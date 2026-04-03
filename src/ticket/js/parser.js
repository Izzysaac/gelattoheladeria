// parser.js - Analizador de mensajes de WhatsApp para distribuidora de pollo

// Importar configuración real de productos
import { PRODUCTOS_CONFIG } from "../products-import.js";

/* Normaliza texto removiendo acentos y convirtiendo a minúsculas */
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/* Convierte números escritos en texto a dígitos */
function textToNumber(text) {
    const numberWords = {
        'un': 1, 'una': 1, 'uno': 1,
        'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
        'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
        'dieciseis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19, 'veinte': 20
    };
    
    const normalized = normalizeText(text);
    return numberWords[normalized] || null;
}

/* Extrae números del texto (dígitos o palabras) */
function extractNumbers(text) {
    const numbers = [];
    
    // Buscar números en dígitos (incluyendo decimales)
    const digitMatches = text.match(/\d+(?:[.,]\d+)?/g);
    if (digitMatches) {
        digitMatches.forEach(match => {
            const num = parseFloat(match.replace(',', '.'));
            if (!isNaN(num)) {
                numbers.push({
                    value: num,
                    original: match,
                    position: text.indexOf(match)
                });
            }
        });
    }
    
    // Buscar números en palabras
    const words = text.split(/\s+/);
    words.forEach((word, index) => {
        const num = textToNumber(word);
        if (num !== null) {
            numbers.push({
                value: num,
                original: word,
                position: text.indexOf(word),
                isWord: true
            });
        }
    });
    
    return numbers.sort((a, b) => a.position - b.position);
}

/* Identifica el producto basado en coincidencia exacta de nombre (ignorando mayúsculas/minúsculas y acentos) */
function identifyProduct(text) {
    const normalized = normalizeText(text);
    for (const producto of Object.keys(PRODUCTOS_CONFIG)) {
        if (normalizeText(producto) === normalized) {
            return producto;
        }
    }
    return null;
}

function isProductLine(line) {
    return line.trim().startsWith("•");
}

function isVariantLine(line) {
    return line.trim().startsWith("-");
}

function parseBlocks(lines) {
    const blocks = [];
    let current = null;

    lines.forEach(line => {
        if (isProductLine(line)) {
            if (current) blocks.push(current);

            current = {
                main: line,
                variants: [],
                priceLine: null
            };
        } 
        else if (isVariantLine(line) && current) {
            current.variants.push(line);
        } 
        else if (line.includes("(") && current) {
            current.priceLine = line;
        }
    });

    if (current) blocks.push(current);

    return blocks;
}

function parseBlock(block) {
    const items = [];

    // 🔹 parse línea principal
    const base = parseLine(block.main);
    if (!base.length) return items;

    const item = base[0];

    // 🔥 añadir variantes
    if (block.variants.length > 0) {
        item.variants = block.variants.map(line => {
            const clean = line.replace(/^-+\s*/, "");
            const [grupo, opciones] = clean.split(":");

            return {
                grupo: grupo?.trim(),
                opciones: opciones
                    ? opciones.split(",").map(o => o.trim())
                    : []
            };
        });
    } else {
        item.variants = [];
    }

    return [item];
}

/*
 * Parsea una línea de WhatsApp estilo:
 * "• 1 x Familiar ($43,000)" => { cantidad: 1, producto: "Familiar" }
 * Extrae solo cantidad y nombre de producto.
 */
function parseLine(line) {
    const items = [];
    const raw = String(line || "").trim();
    if (!raw) return items;

    // Limpiar bullet inicial
    const cleaned = raw.replace(/^[•\-*\s]+/, "").trim();

    // Patrón principal: cantidad + x + nombre + (precio opcional)
    // Ej: "1 x 4 Presas ($23,000)"
    const match = cleaned.match(/^\s*(\d+(?:[.,]\d+)?)\s*[xX]\s*(.+?)(?:\s*\(.*\))?\s*$/);
    if (!match) return items;

    const cantidad = parseFloat(match[1].replace(",", "."));
    if (!Number.isFinite(cantidad) || cantidad <= 0) return items;

    const productPart = match[2].trim();
    if (!productPart) return items;

    // Intentar matchear contra el catálogo (tolerante a acentos/mayúsculas)
    // Estrategia: buscar el producto más largo cuyo nombre normalizado esté contenido
    const normalizedLine = normalizeText(productPart);
    let best = null;
    for (const producto of Object.keys(PRODUCTOS_CONFIG)) {
        const np = normalizeText(producto);
        if (normalizedLine.includes(np)) {
            if (!best || np.length > best.np.length) {
                best = { nombre: producto, np };
            }
        }
    }

    const productoFinal = best ? best.nombre : productPart;
    const precio = PRODUCTOS_CONFIG?.[productoFinal]?.precio;

    items.push({
        producto: productoFinal,
        cantidad,
        precio: typeof precio === 'number' ? precio : 0,
    });

    return items;
}

/* Función principal para parsear mensaje completo de WhatsApp */
export function parseWhatsAppMessage(message) {
    if (!message || typeof message !== 'string') {
        return {
            success: false,
            error: 'Mensaje vacío o inválido',
            items: []
        };
    }
    
    try {
        const lines = message
            .split(/[\n\r]+/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        const allItems = [];
        const errors = [];
        
        const blocks = parseBlocks(lines);

        blocks.forEach(block => {
            const parsed = parseBlock(block);
            allItems.push(...parsed);
        });

        // for (const line of lines) {
        //     // Saltar líneas que parecen saludos o despedidas
        //     const normalized = normalizeText(line);
        //     if (normalized.match(/^(hola|buenos|buenas|gracias|saludos|hasta|chao|bye)/)) {
        //         continue;
        //     }
            
        //     const lineItems = parseLine(line);
        //     allItems.push(...lineItems);
        // }
        
        // Consolidar productos duplicados
        const consolidated = {};
        allItems.forEach(item => {
            const key = normalizeText(item.producto) + "|" + JSON.stringify(item.variants || []);
            if (consolidated[key]) {
                consolidated[key].cantidad += item.cantidad;
            } else {
                consolidated[key] = { ...item };
            }
        });
        
        const finalItems = Object.values(consolidated);
        console.log(finalItems);
        if (finalItems.length === 0) {
            return {
                success: false,
                error: 'No se encontraron productos válidos en el mensaje',
                items: [],
                suggestions: Object.keys(PRODUCTOS_CONFIG)
            };
        }
        
        return {
            success: true,
            items: finalItems,
            originalMessage: message,
            processedLines: lines.length
        };
        
    } catch (error) {
        return {
            success: false,
            error: `Error al procesar el mensaje: ${error.message}`,
            items: []
        };
    }
}

/* Valida y limpia un item de pedido */
export function validateOrderItem(item) {
    const errors = [];
    
    if (!item.producto || typeof item.producto !== 'string') {
        errors.push('Producto requerido');
    }
    
    if (!item.cantidad || isNaN(item.cantidad) || item.cantidad <= 0) {
        errors.push('Cantidad debe ser un número mayor a 0');
    }

    if (item.precio !== undefined && (isNaN(item.precio) || item.precio < 0)) {
        errors.push('Precio debe ser un número mayor o igual a 0');
    }

    // 🔹 NORMALIZAR VARIANTS (nuevo)
    let variants = [];

    if (Array.isArray(item.variants)) {
        variants = item.variants
            .filter(v => v && v.grupo) // limpieza básica
            .map(v => ({
                grupo: String(v.grupo).trim(),
                opciones: Array.isArray(v.opciones)
                    ? v.opciones.map(o => String(o).trim()).filter(Boolean)
                    : []
            }));
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        item: {
            producto: String(item.producto).trim(),
            cantidad: parseFloat(item.cantidad) || 0,
            unidad: 'unidad',
            precio: parseFloat(item.precio) || 0,

            // 🔥 NUEVO
            variants
        }
    };
}

/* Obtiene configuración de productos disponibles */
export function getAvailableProducts() {
    return Object.keys(PRODUCTOS_CONFIG).map(producto => ({
        nombre: producto,
        precio: PRODUCTOS_CONFIG[producto].precio
    }));
}

// Exportar para uso en tests
export { PRODUCTOS_CONFIG, normalizeText, extractNumbers, identifyProduct };
