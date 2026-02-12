import { state } from "./state.js";
import { dom } from "./dom.js";

const direccionLocal = document.getElementById("datos").dataset.direccionlocal;
const telefono = document.getElementById("datos").dataset.telefono;

// Fuera del render, mapeamos los elementos una sola vez
const productosMap = Array.from(dom.productos).map(productoEl => ({
    el: productoEl,
    nombre: productoEl.dataset.nombre,
    // Guardamos las referencias fijas
    refs: {
        cantidad: productoEl.querySelector(".cantidad"),
        add: productoEl.querySelector(".add"),
        remove: productoEl.querySelector(".remove"),
        addBtn: productoEl.querySelector(".add-product")
    }
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
        memoryUsage: modalItemsCache.size * 200 // Estimación: ~200 bytes por elemento cacheado
    };
};

// Función para limpiar cache manualmente (útil para debugging)
export const forceClearModalCache = () => {
    clearModalCache();
    console.log('Modal cache cleared manually');
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
    const itemCache = productosMap.find(p => p.nombre === nombre);
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
    const { totalItems, totalPrecio } = state;

    // 2. Lógica de visibilidad (Early return)
    const isEmpty = totalItems == 0;
    dom.stickyBar.classList.toggle("ocultar", isEmpty);
    
    if (isEmpty) return;

    // 3. Preparar strings (Solo una vez)
    const totalStr = `$ ${totalPrecio.toLocaleString()}`;
    const cantidadStr = `${totalItems} producto${totalItems > 1 ? "s" : ""}`;

    // 4. Pintar (Actualización masiva del DOM)
    dom.resumenTotal.forEach(el => el.textContent = totalStr);
    dom.resumenCantidad.forEach(el => el.textContent = cantidadStr);
};

const closeModal = () => {
    dom.modalVerPedido.close();
    document.body.classList.remove("no-scroll");
    // 🔄 Limpiar cache al cerrar modal para liberar memoria
    clearModalCache();
};

export const renderModal = () => {
    if (!dom.listaPedido) return;

    // 1. Usar el estado ya calculado (Evitamos recalcular el total aquí)
    const { totalItems, items } = state;
    const itemsArray = Object.values(items);

    if (totalItems === 0) {
        // 🔄 Si no hay items, limpiamos el modal pero NO lo cerramos
        // Así el usuario ve que el pedido está vacío
        dom.listaPedido.replaceChildren();
        clearModalCache();
        closeModal();
        return;
    }

    // 2. Limpiar la lista y cache (replaceChildren es eficiente)
    dom.listaPedido.replaceChildren();
    clearModalCache(); // 🔄 Limpiar cache al reconstruir modal

    // 3. Crear el fragmento (Memoria volátil, súper rápido)
    const fragment = document.createDocumentFragment();

    itemsArray.forEach((item) => {
        // Clonamos el template
        const row = dom.templatePedidoProducto.content.firstElementChild.cloneNode(true);
        
        // Sincronizamos datasets
        Object.assign(row.dataset, {
            nombre: item.nombre,
            precio: item.precio,
            imagen: item.imagen,
            descripcion: item.descripcion
        });

        // 4. Selección optimizada (Buscamos solo lo necesario)
        row.querySelector(".nombre").textContent = item.nombre;
        row.querySelector(".cantidad").textContent = item.cantidad;
        // row.querySelector(".descripcion").textContent = item.descripcion;
        
        const precioTotal = item.precio * item.cantidad;
        row.querySelector(".precio").textContent = `$${precioTotal.toLocaleString()}`;

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
};

// Ejemplo de enfoque híbrido rápido
// Este método es 10 veces más rápido que clonar plantillas porque elimina todos los querySelector del bucle.
// const html = itemsArray.map(item => `
//     <div class="fila-producto" data-nombre="${item.nombre}">
//         <span class="nombre">${item.nombre}</span>
//         <span class="precio">$${(item.precio * item.cantidad).toLocaleString()}</span>
//     </div>
// `).join('');

// dom.listaPedido.innerHTML = html;

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
        if (state.totalItems === 0) closeModal(); // Si era el último, cerramos
        return;
    }

    // CASO 2: El producto ya está en el DOM (Actualizamos solo sus textos)
    if (itemEnDOM) {
        itemEnDOM.querySelector(".cantidad").textContent = item.cantidad;
        const precioTotal = item.precio * item.cantidad;
        itemEnDOM.querySelector(".precio").textContent = `$${precioTotal.toLocaleString()}`;
        return;
    }

    // CASO 3: Es un producto nuevo (Lo añadimos al final)
    const row = dom.templatePedidoProducto.content.firstElementChild.cloneNode(true);
    
    // Configuración inicial de la fila
    row.dataset.nombre = item.nombre;
    row.querySelector(".nombre").textContent = item.nombre;
    row.querySelector(".cantidad").textContent = item.cantidad;
    row.querySelector(".precio").textContent = `$${(item.precio * item.cantidad).toLocaleString()}`;
    
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

export const renderEntrega = () => {
    // 1. Sincronizar Radios
    dom.radios.forEach((radio) => {
        radio.checked = radio.value === state.tipoEntrega;
    });
    const isRecoger = state.tipoEntrega === "recoger";

    // 3. Estado del Input
    const input = dom.inputDireccion;
    input.disabled = isRecoger;
    input.value = isRecoger ? direccionLocal : state.direccion;
    
    // Limpieza de validación
    input.classList.remove("invalid");
};

export const renderTodo = () => {
    renderBarra();
    renderProductos();
    renderModal();
    renderEntrega();
};
