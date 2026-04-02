import { dom } from "./dom.js";
import { getProductById } from "./render.js";


const buildCartItem = (product, selectedOptions) => {

    // 1) Parseas keys y agrupas por group_id (preservando orden por option index)
    // key: group-{groupId}-option-{n}  value: {optionId}
    const groupedSelections = Object.entries(selectedOptions).reduce((acc, [key, optionId]) => {
        const match = key.match(/^group-(.+)-option-(\d+)$/);
        if (!match) return acc;

        const groupId = match[1];
        const index = Number(match[2]);

        if (!acc[groupId]) acc[groupId] = [];
        acc[groupId].push({ index, optionId: String(optionId) });
        return acc;
    }, {});

    Object.keys(groupedSelections).forEach((groupId) => {
        groupedSelections[groupId].sort((a, b) => a.index - b.index);
    });

    // 2) Resuelves contra product.groups y construyes groups[]
    const groups = (product.groups || []).map((group) => {
        const selections = groupedSelections[group.id] || [];

        // Importante: preservamos el orden (y repetición si allow_repetition)
        const selectedOptionsResolved = selections
            .map(({ optionId }) => group.options.find((opt) => opt.option_id === optionId))
            .filter(Boolean);

        return {
            group_id: group.id,
            nombre: group.nombre,
            selections: selectedOptionsResolved.map((opt) => ({
                option_id: opt.option_id,
                nombre: opt.nombre,
                precio_extra: Number(opt.precio_extra) || 0,
            })),
        };
    });

    // 3) Calculas precio
    const basePrice = Number(product.precio) || 0;
    const extrasPrice = groups.reduce((total, group) => {
        return (
            total +
            group.selections.reduce((groupTotal, selection) => {
                return groupTotal + (Number(selection.precio_extra) || 0);
            }, 0)
        );
    }, 0);
    const totalPrice = basePrice + extrasPrice;

    // 4) Generas id único (estable: incluye orden por grupo)
    const optionsSignature = groups
        .map((group) => {
            const optionIds = group.selections.map((s) => s.option_id).join(",");
            return `${group.group_id}:${optionIds}`;
        })
        .join("|");

    const uniqueId = `${product.id}|${optionsSignature}`;

    return {
        id: uniqueId,
        product_id: product.id,
        nombre: product.nombre,
        imagen: product.imagen,
        base_price: basePrice,
        extras_price: extrasPrice,
        total_price: totalPrice,
        quantity: 1,
        groups,
    };
}

// Validar en change
dom.variantsForm.addEventListener("change", (e) => {
    dom.variantsAddButton.disabled = !dom.variantsForm.checkValidity();
});

// Validar en submit
dom.variantsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(dom.variantsForm);
    const selectedOptions = Object.fromEntries(formData.entries());
    const product = getProductById(dom.variantsAddButton.dataset.productid);

    const cartItem = buildCartItem(product, selectedOptions);
});


