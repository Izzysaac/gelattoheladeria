// parser.js - Analizador de mensajes de WhatsApp para distribuidora de pollo

// Importar configuración real de productos
import { PRODUCTOS_CONFIG } from "../products-import.js";

// Patrones de unidades
const UNIDADES_PATTERNS = {
    'kg': ['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos', 'k'],
    'unidad': ['unidad', 'unidades', 'u', 'ud', 'uds', 'pieza', 'piezas']
};

/**
 * Normaliza texto removiendo acentos y convirtiendo a minúsculas
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Convierte números escritos en texto a dígitos
 */
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

/**
 * Extrae números del texto (dígitos o palabras)
 */
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

/**
 * Identifica el producto basado en coincidencia exacta de nombre (ignorando mayúsculas/minúsculas y acentos)
 */
function identifyProduct(text) {
    const normalized = normalizeText(text);
    for (const producto of Object.keys(PRODUCTOS_CONFIG)) {
        if (normalizeText(producto) === normalized) {
            return producto;
        }
    }
    return null;
}

/**
 * Identifica la unidad en el texto
 */
function identifyUnit(text, defaultUnit = 'unidad') {
    const normalized = normalizeText(text);
    
    for (const [unidad, patterns] of Object.entries(UNIDADES_PATTERNS)) {
        for (const pattern of patterns) {
            if (normalized.includes(pattern)) {
                return unidad;
            }
        }
    }
    
    return defaultUnit;
}

/**
 * Parsea una línea de texto buscando cantidad + producto + unidad
 */
function parseLine(line) {
    const items = [];
    const normalized = normalizeText(line);
    
    // Extraer números de la línea
    const numbers = extractNumbers(line);
    
    // Buscar productos en la línea (solo por nombre exacto, sin alias)
    const productos = [];
    for (const producto of Object.keys(PRODUCTOS_CONFIG)) {
        const idx = normalized.indexOf(normalizeText(producto));
        if (idx !== -1) {
            productos.push({ nombre: producto, config: PRODUCTOS_CONFIG[producto], position: idx });
        }
    }
    // Remover duplicados y ordenar por posición
    const uniqueProducts = productos
        .filter((item, index, arr) => 
            arr.findIndex(p => p.nombre === item.nombre) === index
        )
        .sort((a, b) => a.position - b.position);
    
    // Asociar números con productos
    if (numbers.length > 0 && uniqueProducts.length > 0) {
        // Si hay igual cantidad de números y productos, asociar 1:1
        if (numbers.length === uniqueProducts.length) {
            uniqueProducts.forEach((producto, index) => {
                const unidad = identifyUnit(line, producto.config.unidadDefault);
                items.push({
                    producto: producto.nombre,
                    cantidad: numbers[index].value,
                    unidad: unidad,
                    precio: producto.config.precio
                });
            });
        }
        // Si hay más números que productos, usar el primer número para cada producto
        else if (numbers.length >= uniqueProducts.length) {
            uniqueProducts.forEach((producto, index) => {
                const numero = numbers[index] || numbers[0];
                const unidad = identifyUnit(line, producto.config.unidadDefault);
                items.push({
                    producto: producto.nombre,
                    cantidad: numero.value,
                    unidad: unidad,
                    precio: producto.config.precio
                });
            });
        }
        // Si hay más productos que números, usar el primer número para todos
        else {
            const cantidad = numbers[0].value;
            uniqueProducts.forEach(producto => {
                const unidad = identifyUnit(line, producto.config.unidadDefault);
                items.push({
                    producto: producto.nombre,
                    cantidad: cantidad,
                    unidad: unidad,
                    precio: producto.config.precio
                });
            });
        }
    }
    // Si solo hay productos sin números, asumir cantidad 1
    else if (uniqueProducts.length > 0) {
        uniqueProducts.forEach(producto => {
            const unidad = identifyUnit(line, producto.config.unidadDefault);
            items.push({
                producto: producto.nombre,
                cantidad: 1,
                unidad: unidad,
                precio: producto.config.precio
            });
        });
    }
    
    return items;
}

/**
 * Función principal para parsear mensaje completo de WhatsApp
 */
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
        
        for (const line of lines) {
            // Saltar líneas que parecen saludos o despedidas
            const normalized = normalizeText(line);
            if (normalized.match(/^(hola|buenos|buenas|gracias|saludos|hasta|chao|bye)/)) {
                continue;
            }
            
            const lineItems = parseLine(line);
            allItems.push(...lineItems);
        }
        
        // Consolidar productos duplicados
        const consolidated = {};
        allItems.forEach(item => {
            const key = `${item.producto}-${item.unidad}`;
            if (consolidated[key]) {
                consolidated[key].cantidad += item.cantidad;
            } else {
                consolidated[key] = { ...item };
            }
        });
        
        const finalItems = Object.values(consolidated);
        
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

/**
 * Valida y limpia un item de pedido
 */
export function validateOrderItem(item) {
    const errors = [];
    
    if (!item.producto || typeof item.producto !== 'string') {
        errors.push('Producto requerido');
    }
    
    if (!item.cantidad || isNaN(item.cantidad) || item.cantidad <= 0) {
        errors.push('Cantidad debe ser un número mayor a 0');
    }
    
    if (!item.unidad || !['kg', 'unidad'].includes(item.unidad)) {
        errors.push('Unidad debe ser "kg" o "unidad"');
    }
    
    if (!item.precio || isNaN(item.precio) || item.precio < 0) {
        errors.push('Precio debe ser un número mayor o igual a 0');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        item: {
            producto: String(item.producto).trim(),
            cantidad: parseFloat(item.cantidad) || 0,
            unidad: String(item.unidad).toLowerCase(),
            precio: parseFloat(item.precio) || 0
        }
    };
}

/**
 * Obtiene configuración de productos disponibles
 */
export function getAvailableProducts() {
    return Object.keys(PRODUCTOS_CONFIG).map(producto => ({
        nombre: producto,
        unidadDefault: PRODUCTOS_CONFIG[producto].unidadDefault,
        precio: PRODUCTOS_CONFIG[producto].precio
    }));
}

// Exportar para uso en tests
export { PRODUCTOS_CONFIG, UNIDADES_PATTERNS, normalizeText, extractNumbers, identifyProduct };
