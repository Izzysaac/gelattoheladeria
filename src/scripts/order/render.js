import { state } from "../state.js";
import { dom, checkoutDom } from "./dom.js";
import { resetModals } from "../modal.js";

import { debugLog } from "../debug.js";


const direccionLocal = document.getElementById("datos").dataset.direccionlocal;
const telefono = document.getElementById("datos").dataset.telefono;

// Fuera del render, mapeamos los elementos una sola vez
const productosMap = Array.from(dom.productos).map((productoEl) => ({
    el: productoEl,
    nombre: productoEl.dataset.nombre,
    // Guardamos las referencias fijas
    refs: {
        cantidad: productoEl.querySelector(".cantidad"),
        add: productoEl.querySelector(".add"),
        remove: productoEl.querySelector(".remove"),
        addBtn: productoEl.querySelector(".add-product"),
    },
}));

// 🔄 Modal items caching - Cache para elementos del modal
const modalItemsCache = new Map();

// Función para limpiar cache cuando el modal se cierra o se vacía
export const clearModalCache = () => {
    modalItemsCache.clear();
};

// Función para obtener elemento del modal con cache
const getModalItem = (nombre) => {
    // Si ya está en cache, retornarlo
    if (modalItemsCache.has(nombre)) {
        return modalItemsCache.get(nombre);
    }

    // Si no, buscarlo y cachearlo
    const item = dom.listaPedido.querySelector(`[data-nombre="${nombre}"]`);
    if (item) {
        modalItemsCache.set(nombre, item);
    }
    return item;
};

// Función para eliminar de cache cuando se elimina del DOM
const removeFromModalCache = (nombre) => {
    modalItemsCache.delete(nombre);
};

// 🔄 Performance monitoring - Para debug y análisis
export const getModalCacheStats = () => {
    return {
        cacheSize: modalItemsCache.size,
        cachedItems: Array.from(modalItemsCache.keys()),
        memoryUsage: modalItemsCache.size * 200, // Estimación: ~200 bytes por elemento cacheado
    };
};

// Función para limpiar cache manualmente (útil para debugging)
export const forceClearModalCache = () => {
    clearModalCache();
    console.log("Modal cache cleared manually");
};

export const renderProductos = () => {
    productosMap.forEach(({ nombre, refs }) => {
        const cantidad = state.items[nombre]?.cantidad || 0;
        const hasItems = cantidad > 0;

        // 1. Actualizar texto (operación más barata)
        refs.cantidad.textContent = cantidad;

        // 2. Sincronizar clases (usando el segundo parámetro de toggle)
        // Esto es mucho más limpio que if/else
        refs.add.classList.toggle("cerrado", !hasItems);
        refs.remove.classList.toggle("cerrado", !hasItems);
        refs.cantidad.classList.toggle("cerrado", !hasItems);
        refs.addBtn.classList.toggle("cerrado", hasItems);
    });
};

// Actualiza solo el producto que cambió en la carta
export const renderSingleProducto = (nombre) => {
    // Buscamos el elemento en nuestro caché (productosMap que creamos antes)
    const itemCache = productosMap.find((p) => p.nombre === nombre);
    if (!itemCache) return;

    const cantidad = state.items[nombre]?.cantidad || 0;
    const hasItems = cantidad > 0;
    const { refs } = itemCache;

    // Solo actualizamos este nodo específico
    refs.cantidad.textContent = cantidad;
    refs.add.classList.toggle("cerrado", !hasItems);
    refs.remove.classList.toggle("cerrado", !hasItems);
    refs.cantidad.classList.toggle("cerrado", !hasItems);
    refs.addBtn.classList.toggle("cerrado", hasItems);
};

export const renderBarra = () => {
    // 1. Usamos valores ya calculados en el state
    const { totalItems, totalProductos } = state;

    // 2. Lógica de visibilidad (Early return)
    const isEmpty = totalItems == 0;
    dom.stickyBarPedido.classList.toggle("ocultar", isEmpty);

    if (isEmpty) return;

    // 3. Preparar strings (Solo una vez)
    const totalStr = `$ ${totalProductos.toLocaleString()}`;
    const cantidadStr = `${totalItems} producto${totalItems > 1 ? "s" : ""}`;

    // 4. Pintar (Actualización masiva del DOM)
    dom.resumenTotal.forEach((el) => (el.textContent = totalStr));
    dom.resumenCantidad.forEach((el) => (el.textContent = cantidadStr));
};

const closeModal = () => {
    clearModalCache();
    history.back();
};

const closeModalUI = () => {
    // document.body.classList.remove("no-scroll");
    // console.log("antiguo removido")
    clearModalCache();
};

export const renderModal = () => {
    debugLog("renderModal called");

    if (!dom.listaPedido) return;
    // 1. Usar el estado ya calculado (Evitamos recalcular el total aquí)
    const { totalItems, items } = state;
    const itemsArray = Object.values(items);

    if (totalItems === 0) {
        // 🔄 Si no hay items, limpiamos el modal pero NO lo cerramos
        // Así el usuario ve que el pedido está vacío
        dom.listaPedido.replaceChildren();
        clearModalCache();
        closeModalUI();
        // resetModals();
        return;
    }

    // 2. Limpiar la lista y cache (replaceChildren es eficiente)
    dom.listaPedido.replaceChildren();
    clearModalCache(); // 🔄 Limpiar cache al reconstruir modal

    // 3. Crear el fragmento (Memoria volátil, súper rápido)
    const fragment = document.createDocumentFragment();

    itemsArray.forEach((item) => {
        // Clonamos el template
        const row =
            dom.templatePedidoProducto.content.firstElementChild.cloneNode(
                true,
            );

        // Sincronizamos datasets
        Object.assign(row.dataset, {
            nombre: item.nombre,
            precio: item.precio,
            imagen: item.imagen,
            descripcion: item.descripcion,
        });

        // 4. Selección optimizada (Buscamos solo lo necesario)
        row.querySelector(".nombre").textContent = item.nombre;
        row.querySelector(".cantidad").textContent = item.cantidad;
        // row.querySelector(".descripcion").textContent = item.descripcion;

        const precioTotal = item.precio * item.cantidad;
        row.querySelector(".precio").textContent =
            `$${precioTotal.toLocaleString()}`;

        const imgEl = row.querySelector(".imagen-producto");
        if (item.imagen) {
            imgEl.src = item.imagen;
            imgEl.alt = item.nombre;
        } else {
            row.querySelector("figure")?.remove();
        }

        // Añadimos al fragmento, NO al DOM real todavía
        fragment.appendChild(row);
    });

    // 5. Inserción única (Solo 1 reflow de diseño)
    dom.listaPedido.appendChild(fragment);

    // Reset de pagina o renderall (modales a 0)
    resetModals();
};


export const renderSingleModal = (nombre) => {
    if (!dom.listaPedido) return;
    
    const item = state.items[nombre];
 
    // 🔄 Usar cache en lugar de querySelector directo
    const itemEnDOM = getModalItem(nombre);
    // CASO 1: El producto ya no existe en el estado (cantidad 0)
    if (!item || item.cantidad <= 0) {
        if (itemEnDOM) {
            itemEnDOM.remove(); // Lo eliminamos físicamente
            removeFromModalCache(nombre); // 🔄 Limpiar de cache
        }
     // Si era el último desde el modal, cerramos
        if (state.totalItems === 0 && history.state?.modal === "pedido") {
            closeModal();
        }
        return;
    }

    // CASO 2: El producto ya está en el DOM (Actualizamos solo sus textos)

    if (itemEnDOM) {
        itemEnDOM.querySelector(".cantidad").textContent = item.cantidad;
        const precioTotal = item.precio * item.cantidad;
        itemEnDOM.querySelector(".precio").textContent =
            `$${precioTotal.toLocaleString()}`;
        return;
    }

    // CASO 3: Es un producto nuevo (Lo añadimos al final)
    const row =
        dom.templatePedidoProducto.content.firstElementChild.cloneNode(true);

    // Configuración inicial de la fila
    row.dataset.nombre = item.nombre;
    row.querySelector(".nombre").textContent = item.nombre;
    row.querySelector(".cantidad").textContent = item.cantidad;
    row.querySelector(".precio").textContent =
        `$${(item.precio * item.cantidad).toLocaleString()}`;

    const imgEl = row.querySelector(".imagen-producto");
    if (item.imagen) {
        imgEl.src = item.imagen;
        imgEl.alt = item.nombre;
    } else {
        row.querySelector("figure")?.remove();
    }

    dom.listaPedido.appendChild(row);
    // 🔄 Cacheamos el nuevo elemento para futuras actualizaciones
    modalItemsCache.set(nombre, row);
};



export const renderTodo = () => {
    renderBarra();
    renderProductos();
    renderModal();
};



export const renderEntrega = () => {
    // 1. Sincronizar Radios
    checkoutDom.radios.forEach((radio) => {
        radio.checked = radio.value === state.tipoEntrega;
    });

    // 2. Sincronizar Input
    const isRecoger = state.tipoEntrega === "recoger";
    const input = checkoutDom.inputDireccion;
    input.disabled = isRecoger;
    input.value = isRecoger ? direccionLocal : state.direccion;

    // Limpieza de validación
    input.classList.remove("invalid");
};


export const renderFormaPago = () => {
    if (state.formaPago) {
        checkoutDom.formaPago.querySelector((`option[value="${state.formaPago}"]`)).selected = true;
    }
}

export const renderNotas = () => {
    if (state.notas) {
        checkoutDom.notas.value = state.notas;
    }
}


export const renderResumen = () => {
    
    const { items , valorEntrega, totalProductos } = state;

    const html = Object.values(items).map(item => 
        `<li class="producto-resumen"> 
            <span>${item.cantidad}x</span>
            <span class="grow">${item.nombre}</span>
            <span>$${item.precio}</span>
        </li>`)
        .join('');

    checkoutDom.resumenPedido.innerHTML = html;
    checkoutDom.envioPedido.textContent = `$${valorEntrega.toLocaleString()}`;
    const total = Number(totalProductos) +  Number(valorEntrega);
    checkoutDom.totalPedido.textContent = `$${total.toLocaleString()}`;
}

export const renderCheckout = () => {
    renderEntrega();
    renderFormaPago();
    renderNotas();
    renderResumen();
}