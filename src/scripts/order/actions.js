import { state, guardarState, cargarState } from "../state.js";
import { renderSingleProducto, renderBarra, renderSingleModal, renderNombreCliente, renderTelefono, renderEntrega,renderMetodoPago, renderTodo, renderValidar } from "./render.js"

const updateTotales = () => {
    let items = 0;
    let precio = 0;

    Object.values(state.items).forEach((item) => {
        items += item.cantidad;
        precio += item.cantidad * item.precio;
    });

    state.totalItems = items;
    state.totalProductos = precio;
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
    guardarState();


    // --- RENDERIZADO GRANULAR ---
    
    // 1. Actualiza solo el producto clickeado en la carta (Súper rápido)
    renderSingleProducto(nombre);

    // 2. La barra siempre debe actualizarse (Totales cambiaron)
    renderBarra();

    // 3. El modal solo se re-renderiza si está abierto
    renderSingleModal(nombre);

};

export const borrarPedido = () => {
    state.items = {};
    state.totalItems = 0;
    state.totalProductos = 0;
    guardarState();
    renderTodo();
};

export const setValorEntrega = (valor) => {
    state.valorEntrega = valor;
    guardarState();
};

export const setNombreCliente = (nombre) => {
    state.nombreCliente = nombre;
    guardarState();
    renderNombreCliente();
};

export const setTelefono = (telefono) => {
    state.telefono = telefono;
    guardarState();
    renderTelefono();
};

export const setTipoEntrega = (tipo) => {
    state.tipoEntrega = tipo;
    guardarState();
    renderEntrega();
};

export const setDireccion = (dir) => {
    state.direccion = dir;
    guardarState();
};

export const setMetodoPago = (forma) => {
    state.metodoPago = forma;
    guardarState();
    renderMetodoPago();
};

export const setNotas = (notas) => {
    state.notas = notas;
    guardarState();
};



export const getShipping = () => {
    // Si no es domicilio, el costo es 0
    if (state.tipoEntrega !== "domicilio") return 0;

    // Intentamos convertir el valor a número
    const valor = Number(state.valorEntrega);

    // Si no es un número (es "Adicional", "Variable", etc.), devolvemos 0 para la suma
    // Si es un número, devolvemos el valor (ej. 5000 o 0)
    return isNaN(valor) ? 0 : valor;
}

export const computeTotal = (items) => {
    return Object.values(items).reduce((total, item) => total + item.precio * item.cantidad, 0);
}

export const validarFormulario = () => {

    const { nombreCliente, telefono, tipoEntrega, direccion, metodoPago } = state;
    
    let estado = true;

    if (!nombreCliente || !telefono || !tipoEntrega || !metodoPago) estado = false;

    if (tipoEntrega === "domicilio") {
        const direccionVacia = !direccion || direccion.trim().length === 0;
        if (direccionVacia) estado = false;
    }

    renderValidar(estado);
    return estado;
}




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