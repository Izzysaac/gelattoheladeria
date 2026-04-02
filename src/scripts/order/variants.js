import { dom } from "./dom.js";
import { getProductById, buildCartItemWithVariants, addToCart } from "./actions.js";

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

    for (const [key, optionId] of Object.entries(raw || {})) {
        const m = key.match(/^group-(.+?)-option-(\d+)$/);
        if (!m) continue;
        const [, group_id, idxStr] = m;
        const idx = Number(idxStr);
        if (!fromRaw[group_id]) fromRaw[group_id] = [];
        fromRaw[group_id][idx] = optionId;
    }

    // Convert to array form, removing holes
    const rawGroups = Object.entries(fromRaw).map(([group_id, arr]) => ({
        group_id,
        options: (arr || []).filter((v) => v !== undefined && v !== null),
    }));

    if (!Array.isArray(currentSelections) || currentSelections.length === 0) {
        return rawGroups;
    }

    const used = new Set();
    const result = currentSelections.map((s) => {
        if (fromRaw[s.group_id]) {
            used.add(s.group_id);
            return {
                group_id: s.group_id,
                options: fromRaw[s.group_id].filter((v) => v != null),
            };
        }
        return s;
    });

    for (const g of rawGroups) {
        if (!used.has(g.group_id)) result.push(g);
    }

    return result;
}


// Validar en change
dom.variantsForm.addEventListener("change", (e) => {
    dom.variantsAddButton.disabled = !dom.variantsForm.checkValidity();
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
