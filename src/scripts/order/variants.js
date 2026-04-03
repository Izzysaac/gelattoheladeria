import { dom } from "./dom.js";
import { getProductById, buildCartItemWithVariants, addToCart } from "./actions.js";
import { variantsState } from "./render.js";
/**
 * Convierte un objeto con claves tipo:
 *  'group-<group_id>-option-<index>': '<optionId>'
 * a un array de selecciones:
 *  [{ group_id, options: [optionId,...] }, ...]
 *
 * Si se pasa `currentSelections` los grupos existentes se actualizan,
 * y los nuevos grupos del `raw` se añaden al final.
 */
const normalizeVariantSelections = (raw, currentSelections = []) => {
    const fromRaw = Object.create(null);

    for (const [key, value] of Object.entries(raw || {})) {
        // 🔹 CASO 1: select indexado
        let match = key.match(/^group-(.+?)-option-(\d+)$/);

        if (match) {
            const [, group_id, idxStr] = match;
            const idx = Number(idxStr);

            if (!fromRaw[group_id]) fromRaw[group_id] = [];
            fromRaw[group_id][idx] = value;
            continue;
        }

        // 🔹 CASO 2: radio / single
        match = key.match(/^group-(.+)$/);

        if (match) {
            const [, group_id] = match;

            fromRaw[group_id] = [value]; // 👈 SIEMPRE array
        }
    }

    // 🔹 limpiar y convertir
    const rawGroups = Object.entries(fromRaw).map(([group_id, arr]) => ({
        group_id,
        options: (arr || []).filter(v => v != null && v !== "")
    }));

    // 🔹 merge con currentSelections (igual que ya haces)
    if (!Array.isArray(currentSelections) || currentSelections.length === 0) {
        return rawGroups;
    }

    const used = new Set();

    const result = currentSelections.map((s) => {
        if (fromRaw[s.group_id]) {
            used.add(s.group_id);
            return rawGroups.find(g => g.group_id === s.group_id);
        }
        return s;
    });

    for (const g of rawGroups) {
        if (!used.has(g.group_id)) result.push(g);
    }

    return result;
};

const calculateExtrasPrice = (form, optionsMap) => {
    let total = 0;

    const formData = new FormData(form);

    for (const value of formData.values()) {
        const option = optionsMap[value];
        if (option) {
            total += Number(option.precio_extra || 0);
        }
    }

    return total;
};

const updateVariantPriceUI = (product, form, optionsMap) => {
    const extras = calculateExtrasPrice(form, optionsMap);
    const total = Number(product.precio) + extras;

    dom.variantsProductPrice.textContent =
        `$${total.toLocaleString()}`;
};

// Validar en change
dom.variantsForm.addEventListener("change", (e) => {
    // 🔹 1. validación
    dom.variantsAddButton.disabled = !dom.variantsForm.checkValidity();
    // 🔹 2. precio dinámico
    updateVariantPriceUI(variantsState.currentProduct, dom.variantsForm, variantsState.optionsMap);
});


// Validar en submit
dom.variantsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(dom.variantsForm);
    const selectionsRaw = Object.fromEntries(formData.entries());
    const selections = normalizeVariantSelections(selectionsRaw);
    const product = getProductById(dom.variantsAddButton.dataset.productid);

    const cartItem = buildCartItemWithVariants(product, selections);
    addToCart(cartItem);
    dom.variantsDialog.close();
});
