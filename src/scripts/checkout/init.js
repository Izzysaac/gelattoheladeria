import { cargarState, state } from "../state.js";
import { bindEventosCheckout } from "@scripts/order/events.js";
import { renderResumen } from "../order/render.js";

const init = () => {
    cargarState();
    
    // Check if cart is empty after loading state
    if (Object.keys(state.items).length === 0) {
        window.location.href = "/pedido";
        return; // Stop execution if redirecting
    }
    
    bindEventosCheckout();
    renderResumen();
};

document.getElementById("btn-cerrar-checkout").addEventListener("click", () => history.back());
init();




