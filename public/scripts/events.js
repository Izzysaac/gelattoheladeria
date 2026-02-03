import {
    updateCantidad,
    borrarPedido,
    setTipoEntrega,
    setDireccion,
} from "./actions.js";
import { dom } from "./dom.js";
import { renderTodo, renderEntrega } from "./render.js";
import { state } from "./state.js"

const telefono = document.querySelector("#datos").dataset.telefono;
// Generar mensaje de pedido WhatsApp
const generarMensaje = () => {
    let mensaje = "Hola, quiero realizar un pedido por favor:\n";
    let total = 0;

    Object.values(state.items).forEach((item) => {
        if (item.cantidad <= 0) return;

        const subtotal = item.cantidad * item.precio;
        total += subtotal;

        mensaje += `• ${item.nombre} x${item.cantidad} — $${subtotal.toLocaleString()}\n`;
    });

    mensaje += `\n*Total:* $${total.toLocaleString()}\n\n`;

    // Tipo de entrega
    if (state.tipoEntrega === "domicilio") {
        mensaje += "*Entrega:* A domicilio\n";
        mensaje += `*Dirección:* ${state.direccion}\n`;
    } else {
        mensaje += "*Entrega:* Recoger en el local\n";
    }

    return mensaje;
};

const hacerPedido = (tel = telefono) => {
    // 1️⃣ Validar que haya productos
    const items = Object.values(state.items).filter(
        (item) => item.cantidad > 0,
    );

    if (items.length === 0) {
        alert("No has agregado productos al pedido");
        return;
    }

    // 2️⃣ Validar dirección si es domicilio
    if (state.tipoEntrega === "domicilio" && !state.direccion.trim()) {
        alert("Por favor ingresa la dirección de entrega");
        document.querySelector("#input-direccion").classList.add("invalid");
        return;
    }

    // 3️⃣ Generar mensaje
    const mensaje = generarMensaje();

    // 4️⃣ Enviar (WhatsApp)
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank");
};

export const bindEventosProductos = () => {

    dom.dialogImageViwerCloseBtn.addEventListener("click", () => dom.dialogImageViewer.close());
    dom.dialogImageViewer.addEventListener("click", (e) => {
        if (e.target === dom.dialogImageViewer) dom.dialogImageViewer.close();
    });

    // dom.btnVerPedido.addEventListener("click", () => {
    //     // modal.classList.remove("cerrado");
    //     dom.modalVerPedido.showModal();
    //     document.body.classList.add('no-scroll');
    // });

    document.addEventListener("click", (e) => {
        if (!e.target) return;
        const el = e.target.closest("[data-action]");

        if (e.target.tagName == "IMG") {
            const imageUrl = e.target.dataset.full || e.target.src;
            dom.dialogImageViewerImg.src = imageUrl;
            dom.dialogImageViewerImg.alt = e.target.alt || "";
            dom.dialogImageViewer.showModal();
        }

        if (!el) return;
        const action = el.dataset.action;

        if (action == "ver-pedido"){
            dom.modalVerPedido.showModal();
            document.body.classList.add("no-scroll");
            return;
        }

        const productoEl = el.closest("[data-nombre]");
        if (!productoEl) return;
        console.log("llego?")
        const producto = {
            nombre: productoEl.dataset.nombre,
            precio: Number(productoEl.dataset.precio),
            imagen: productoEl.dataset.imagen,
            descripcion: productoEl.dataset.descripcion,
        };
        switch (action) {
            case "add":
                updateCantidad(producto, +1);
                break;

            case "remove":
                updateCantidad(producto, -1);
                break;

            case "borrar":
                borrarPedido();
                break;

            case "ver-pedido":
                console.log("entro")
                dom.modalVerPedido.showModal();
                document.body.classList.add("no-scroll");
                break;
        }

        renderTodo();
    });

    document.addEventListener("change", (e) => {
        if (e.target.name === "tipo-entrega") {
            setTipoEntrega(e.target.value);
            renderEntrega();
        }

        if (e.target.name === "direccion") {
            setDireccion(e.target.value);
        }
    });
};

export const bindEventosModal = () => {
    // Delegación de eventos dentro del modal
    dom.modalVerPedido.addEventListener("click", (e) => {
        const target = e.target;
        // Cerrar modal
        if (
            target.id === "btn-modificar-pedido" ||
            target.id === "btn-cerrar-modal" ||
            target == dom.modalVerPedido
        ) {
            dom.modalVerPedido.close();
            document.body.classList.remove("no-scroll");
        }
        // Abrir eliminar pedido
        if (target.id === "btn-borrar-modal") {
            dom.modalBorrarPedido.showModal();
        }
        // Hacer pedido
        if (target.id === "btn-hacer-pedido") {
            hacerPedido();
        }
    });

    // Delegación de eventos dentro del modal borrar
    dom.modalBorrarPedido.addEventListener("click", (e) => {
        const target = e.target;
        if (
            target.id === "btn-borrar-pedido" ||
            target.id === "btn-conservar-pedido" ||
            target == dom.modalBorrarPedido
        ) {
            dom.modalBorrarPedido.close();
        }
        if (target.id === "btn-borrar-pedido") {
            document.body.classList.remove("no-scroll");
            borrarPedido();
            renderTodo();
        }
    });

    // Tipo de entrega
    dom.modalVerPedido.addEventListener("change", (e) => {
        const target = e.target;
        if (target.name === "entrega") {
            setTipoEntrega(target.value);
            renderEntrega();
        }

        if (target.id === "input-direccion") {
            setDireccion(target.value);
            guardarStateEnStorage();
        }
    });
};

export const bindEventos = () => {
    bindEventosProductos();
    bindEventosModal();
};
