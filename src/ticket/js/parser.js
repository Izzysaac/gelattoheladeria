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


/* Serializa variantes de forma determinista para clave de consolidación */
function serializeVariants(variants) {
    if (!variants || !variants.length) return '';
    return variants
        .map(v => `${v.group_id}:${(v.option_ids || []).sort().join(',')}`)
        .sort()
        .join(';');
}

/* Detecta si una línea es una línea de producto (comienza con •) */
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
// function matchScore(a, b) {
//     const wordsA = a.split(' ');
//     const wordsB = b.split(' ');
//     return wordsB.filter(w => wordsA.includes(w)).length;
// }

// let best = null;

// for (const producto of Object.values(PRODUCTOS_CONFIG)) {
//     const np = normalizeText(producto.nombre);

//     const score = matchScore(normalizedLine, np);

//     if (score > 0 && (!best || score > best.score)) {
//         best = { nombre: producto.id, score };
//     }
// }
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

    
    for (const producto of Object.values(PRODUCTOS_CONFIG)) {
        const np = normalizeText(producto.nombre); // ✅ usar nombre real

        if (normalizedLine.includes(np)) {
            if (!best || np.length > best.np.length) {
                best = { nombre: producto.id, np }; // guardas el id
            }
        }
    }

    if (!best) return items; // No agregar items sin producto válido
    const productoFinal = best.nombre;
    const precio = PRODUCTOS_CONFIG[productoFinal]?.precio ?? 0;

    items.push({
        producto_id: productoFinal, // ✅ clave técnica
        nombre: PRODUCTOS_CONFIG[productoFinal]?.nombre || productPart, // ✅ fallback
        cantidad,
        precio: typeof precio === 'number' ? precio : 0,
        variants: [] // 🔹 inicializar array vacío
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

        // 🔥 Consolidar items con mismo producto_id y variantes idénticas
        const consolidated = {};
        allItems.forEach(item => {
            const variantKey = serializeVariants(item.variants || []);
            const key = `${item.producto_id}|${variantKey}`;
            if (consolidated[key]) {
                consolidated[key].cantidad += item.cantidad;
            } else {
                consolidated[key] = { 
                    ...item,
                    variants: item.variants || []
                };
            }
        });
        
        const finalItems = Object.values(consolidated);
        // console.log(finalItems);
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

    const productoId = item.producto || item.producto_id;

    const productoConfig = PRODUCTOS_CONFIG[productoId];

    // 🔹 Validaciones básicas
    if (!productoId || typeof productoId !== 'string') {
        errors.push('Producto requerido');
    }

    if (!productoConfig) {
        errors.push(`Producto no existe: ${productoId}`);
    }

    if (!item.cantidad || isNaN(item.cantidad) || item.cantidad <= 0) {
        errors.push('Cantidad debe ser un número mayor a 0');
    }

    if (item.precio !== undefined && (isNaN(item.precio) || item.precio < 0)) {
        errors.push('Precio debe ser un número mayor o igual a 0');
    }

    // 🔥 NORMALIZAR VARIANTS (CLAVE)
    let variants = [];

    if (Array.isArray(item.variants) && productoConfig?.groups) {

        variants = item.variants.map(v => {
            if (!v || !v.grupo) return null;

            const grupoNombre = String(v.grupo).trim().toLowerCase();

            // 🔹 encontrar grupo en config
            const group = productoConfig.groups.find(g =>
                g.nombre.toLowerCase() === grupoNombre
            );

            if (!group) {
                errors.push(`Grupo no válido: ${v.grupo}`);
                return null;
            }

            // 🔹 mapear opciones
            const option_ids = (Array.isArray(v.opciones) ? v.opciones : [])
                .map(opNombre => {
                    const opNorm = String(opNombre).trim().toLowerCase();

                    const option = group.options.find(o =>
                        o.nombre.toLowerCase() === opNorm
                    );

                    if (!option) {
                        errors.push(`Opción inválida "${opNombre}" en grupo "${group.nombre}"`);
                        return null;
                    }

                    return option.option_id;
                })
                .filter(Boolean);

            return {
                group_id: group.id,
                option_ids
            };
        }).filter(Boolean);
    }
    // 🔥 VALIDAR reglas de grupo (min/max/required)
    // if (productoConfig?.groups) {
    //     for (const group of productoConfig.groups) {
    //         const selected = variants.find(v => v.group_id === group.id);

    //         const count = selected?.option_ids?.length || 0;

    //         if (group.required && count === 0) {
    //             errors.push(`Grupo requerido: ${group.nombre}`);
    //         }

    //         if (group.min && count < group.min) {
    //             errors.push(`Mínimo ${group.min} en ${group.nombre}`);
    //         }

    //         if (group.max && count > group.max) {
    //             errors.push(`Máximo ${group.max} en ${group.nombre}`);
    //         }
    //     }
    // }

    return {
        isValid: errors.length === 0,
        errors,
        item: {
            producto_id: productoId,
            nombre: productoConfig?.nombre || null,

            cantidad: Number(item.cantidad) || 0,
            precio: Number(item.precio) || 0,
            unidad: 'unidad',

            variants
        }
    };
}

/* Obtiene configuración de productos disponibles */
export function getAvailableProducts() {
    return Object.values(PRODUCTOS_CONFIG).map(producto => ({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio
    }));
}
