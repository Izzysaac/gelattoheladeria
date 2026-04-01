import { dom } from "./dom.js";

// Validar en change
dom.variantsForm.addEventListener("change", (e) => {
    dom.variantsAddButton.disabled = !dom.variantsForm.checkValidity();
});

// Validar en submit
dom.variantsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(dom.variantsForm);
    const selectedOptions = Object.fromEntries(formData.entries());

    const product = getProductById(dom.variantsAddButton.dataset.productId);
    const cartItem = buildCartItem(product, selectedOptions);
    console.log(cartItem);
});

const buildCartItem = (product, selectedOptions) => {
    // parseas keys → agrupas por group_id
    // resuelves contra product.groups
    // construyes groups[]
    // calculas precio
    // generas id único
}
