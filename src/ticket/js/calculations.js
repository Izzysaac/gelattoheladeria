// calculations.js - Shared calculation utilities for ticket system

import { PRODUCTOS_CONFIG } from "../products-import.js";

/* Formatea número como moneda colombiana */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/* Calcula el precio total de un item incluyendo variantes */
export function calculateItemPrice(item) {
    const productoConfig = PRODUCTOS_CONFIG[item.producto_id];
    if (!productoConfig) return item.precio || 0;

    let totalPrice = productoConfig.precio || 0;

    if (item.variants && productoConfig.groups) {
        item.variants.forEach(variant => {
            const group = productoConfig.groups.find(g => g.id === variant.group_id);
            if (group && variant.option_ids) {
                variant.option_ids.forEach(optionId => {
                    const option = group.options.find(o => o.option_id === optionId);
                    if (option && option.precio_extra) {
                        totalPrice += option.precio_extra;
                    }
                });
            }
        });
    }

    return totalPrice;
}

/* Escapa caracteres HTML para prevenir XSS al insertar texto en innerHTML */
export function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}
