import { state } from "./state.js";
import { renderSingleProducto, renderBarra, renderModal, renderSingleModal, renderEntrega } from "./render.js"

const STORAGE_KEY = "pedido_state";

const guardar = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

export const cargarState = () => {
    const stateStorage = localStorage.getItem(STORAGE_KEY);

    if (stateStorage) {
        const stateParseado = JSON.parse(stateStorage);
        state.items = stateParseado.items || {};
        state.tipoEntrega = stateParseado.tipoEntrega || null;
        state.direccion = stateParseado.direccion || "";
        state.totalItems = stateParseado.totalItems || 0;
        state.totalPrecio = stateParseado.totalPrecio || 0;
    }
    // Object.assign(state, JSON.parse(saved));
}; //! REVISAR SI SON EQUIVALENTES (basicamente llena variable state con datos de localsorage)


const updateTotales = () => {
    let items = 0;
    let precio = 0;

    Object.values(state.items).forEach((item) => {
        items += item.cantidad;
        precio += item.cantidad * item.precio;
    });

    state.totalItems = items;
    state.totalPrecio = precio;
};

export const updateCantidad = (producto, delta) => {
    const { nombre, precio, imagen, descripcion } = producto;
    // Si el producto no existe aún en el estado, lo inicializamos
    if (!state.items[nombre]) {
        state.items[nombre] = {
            nombre,
            precio,
            imagen,
            descripcion,
            cantidad: 0,
        };
    }
    // Actualizamos la cantidad
    const nuevaCantidad = state.items[nombre].cantidad + delta;

    // Si llega a 0 o menos, eliminamos el producto del pedido
    if (nuevaCantidad <= 0) {
        delete state.items[nombre];
    } else {
        state.items[nombre].cantidad = nuevaCantidad;
    }
    updateTotales();
    guardar();


    // --- RENDERIZADO GRANULAR ---
    
    // 1. Actualiza solo el producto clickeado en la carta (Súper rápido)
    renderSingleProducto(nombre);

    // 2. La barra siempre debe actualizarse (Totales cambiaron)
    renderBarra();

    // 3. El modal solo se re-renderiza si está abierto
    // renderModal();
    renderSingleModal(nombre);

};

export const borrarPedido = () => {
    state.items = {};
    state.totalItems = 0;
    state.totalPrecio = 0;
    guardar();
    renderTodo();
};

export const setTipoEntrega = (tipo) => {
    state.tipoEntrega = tipo;
    guardar();
    renderEntrega();
};

export const setDireccion = (dir) => {
    state.direccion = dir;
    guardar();
};


// 3. Un último detalle: El Render Inicial
// Para cuando el usuario abre el modal por primera vez, sí necesitarás una función que lo pinte todo de golpe. Puedes reutilizar tu lógica original pero optimizada con el DocumentFragment que vimos antes:
// export const abrirYRenderizarModal = () => {
//     // Limpiamos y pintamos todo solo UNA VEZ al abrir
//     dom.listaPedido.replaceChildren();
//     const fragment = document.createDocumentFragment();
    
//     Object.values(state.items).forEach(item => {
//         // ... lógica de clonado de fila ...
//         fragment.appendChild(row);
//     });
    
//     dom.listaPedido.appendChild(fragment);
//     openModal(); // Tu función de abrir el modal
// };