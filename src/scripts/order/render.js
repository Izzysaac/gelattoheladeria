import { state } from "../state.js";
import { dom, checkoutDom } from "./dom.js";
import { resetModals } from "../modal.js";
import { debugLog } from "../debug.js";
import {
    getShipping,
    computeTotal,
    validarFormulario,
    getProductById,
    getTotalQuantityByProductId,
} from "./actions.js";
import { getCloudinaryImageUrl } from "../imgHelper.js";

const formatPrice = (value) => {
    try {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
        }).format(Number(value) || 0);
    } catch {
        return `$${Math.round(Number(value) || 0).toLocaleString("es-CO")}`;
    }
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

const direccionLocal = document.getElementById("datos").dataset.direccionlocal;
const telefono = document.getElementById("datos").dataset.telefono;

// Fuera del render, mapeamos los elementos una sola vez
const productosMap = Array.from(dom.productos).map((productoEl) => ({
    el: productoEl,
    productId: productoEl.dataset.productid,
    // Guardamos las referencias fijas
    refs: {
        cantidad: productoEl.querySelector(".cantidad"),
        add: productoEl.querySelector(".add"),
        remove: productoEl.querySelector(".remove"),
    },
}));

// 🔄 Modal items caching - Cache para elementos del modal
const modalItemsCache = new Map();

// Función para limpiar cache cuando el modal se cierra o se vacía
export const clearModalCache = () => {
    modalItemsCache.clear();
};

// Función para obtener elemento del modal con cache
const getModalItem = (id) => {
    const cached = modalItemsCache.get(id);

    // 🔹 1. Validar cache (muy importante)
    if (cached && document.body.contains(cached)) {
        return cached;
    }

    // 🔹 2. Si no existe o está muerto → limpiar
    modalItemsCache.delete(id);

    // 🔹 3. Buscar en DOM
    const item = dom.listaPedido.querySelector(`[data-id="${id}"]`);

    if (item) {
        modalItemsCache.set(id, item);
    }

    return item;
};

export const renderProductos = () => {
    productosMap.forEach(({ productId, refs }) => {
        const cantidad = getTotalQuantityByProductId(productId);
        const hasItems = cantidad > 0;

        // 1. Actualizar texto (operación más barata)
        refs.cantidad.textContent = cantidad;

        // 2. Sincronizar clases (usando el segundo parámetro de toggle)
        refs.remove.classList.toggle("cerrado", !hasItems);
        refs.cantidad.classList.toggle("cerrado", !hasItems);
    });
};

// Actualiza solo el producto que cambió en la carta
export const renderSingleProducto = (productId) => {
    const itemCache = productosMap.find(
        (p) => String(p.productId) === String(productId),
    );
    if (!itemCache) return;
    const cantidad = getTotalQuantityByProductId(productId);
    const hasItems = cantidad > 0;

    const { refs } = itemCache;

    // 🔹 actualizar cantidad total (sumando variantes)
    refs.cantidad.textContent = cantidad;

    // 🔹 comportamiento UI (igual que antes)
    // refs.add.classList.toggle("cerrado", !hasItems);
    refs.remove.classList.toggle("cerrado", !hasItems);
    refs.cantidad.classList.toggle("cerrado", !hasItems);
};

// Actualiza solo el producto que cambió en el cartmodal
export const renderSingleModal = (productId) => {
    if (!dom.listaPedido) return;

    // 🔹 1. obtener todos los cartItems de ese producto
    const items = Object.values(state.items).filter(
        (item) => item.product_id === productId,
    );

    // 🔹 2. IDs actuales en estado
    const currentIds = new Set(items.map((item) => String(item.id)));
    // 🔹 3. eliminar del DOM los que ya no existen
    for (const [id, el] of Array.from(modalItemsCache.entries())) {
        const elProductId = el.dataset.productid;

        if (elProductId !== String(productId)) continue;

        if (!currentIds.has(String(id))) {
            el.remove();
            modalItemsCache.delete(id);
        }
    }

    // 🔹 4. renderizar / actualizar los actuales
    items.forEach((item) => {
        let row = getModalItem(item.id);

        // 🔹 CASO 1: ya existe → actualizar
        if (row) {
            row.querySelector(".cantidad").textContent = item.quantity;

            row.querySelector(".precio").textContent =
                `$${(item.total_price * item.quantity).toLocaleString()}`;

            return;
        }

        // 🔹 CASO 2: nuevo → crear
        row =
            dom.templatePedidoProducto.content.firstElementChild.cloneNode(
                true,
            );

        // 🔥 IDs IMPORTANTES
        row.dataset.id = item.id;
        row.dataset.productid = item.product_id;

        // 🔹 básicos
        row.querySelector(".nombre").textContent = item.nombre;
        row.querySelector(".cantidad").textContent = item.quantity;

        row.querySelector(".precio").textContent =
            `$${(item.total_price * item.quantity).toLocaleString()}`;

        // 🔹 variantes
        const variantsEl = row.querySelector(".variantes");
        if (variantsEl) {
            if (item.groups.length > 0) {
                variantsEl.textContent = item.groups
                    .map(
                        (g) =>
                            `${g.nombre}: ${g.selections.map((s) => s.nombre).join(", ")}`,
                    )
                    .join(" • ");
            } else {
                variantsEl.remove();
            }
        }

        // 🔹 imagen
        const imgEl = row.querySelector(".imagen-producto");
        if (item.imagen) {
            imgEl.src = item.imagen;
            imgEl.alt = item.nombre;
        } else {
            row.querySelector("figure")?.remove();
        }

        // 🔥 BOTONES → cartItem.id
        row.querySelectorAll("[data-action]").forEach((btn) => {
            btn.dataset.id = item.id;
        });

        // 🔹 insertar y cachear
        dom.listaPedido.appendChild(row);
        modalItemsCache.set(item.id, row);
    });

    // 🔹 5. cerrar modal si no hay items
    if (
        Object.keys(state.items).length === 0 &&
        history.state?.modal === "pedido"
    ) {
        closeModal();
    }
};

// Actualiza el resumen el producto que cambió en la barra
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

export const renderModal = () => {
    debugLog("renderModal called");

    if (!dom.listaPedido) return;

    const { totalItems, items } = state;
    const itemsArray = Object.values(items);

    // 🔹 1. estado vacío
    if (totalItems === 0) {
        dom.listaPedido.replaceChildren();
        clearModalCache();
        closeModalUI();
        return;
    }

    // 🔹 2. limpiar DOM + cache
    dom.listaPedido.replaceChildren();
    clearModalCache();

    const fragment = document.createDocumentFragment();

    itemsArray.forEach((item) => {
        const row =
            dom.templatePedidoProducto.content.firstElementChild.cloneNode(
                true,
            );

        // 🔥 IDs clave
        row.dataset.id = item.id;
        row.dataset.productid = item.product_id;

        // 🔹 básicos
        row.querySelector(".nombre").textContent = item.nombre;
        row.querySelector(".cantidad").textContent = item.quantity;

        row.querySelector(".precio").textContent =
            `$${(item.total_price * item.quantity).toLocaleString()}`;

        // 🔹 variantes
        const variantsEl = row.querySelector(".variantes");
        if (variantsEl) {
            console.log(item)
            if (item.groups.length > 0) {
                variantsEl.textContent = item.groups
                    .map(
                        (g) =>
                            `${g.nombre}: ${g.selections.map((s) => s.nombre).join(", ")}`,
                    )
                    .join(" • ");
            } else {
                variantsEl.remove();
            }
        }

        // 🔹 imagen
        const imgEl = row.querySelector(".imagen-producto");
        if (item.imagen) {
            imgEl.src = item.imagen;
            imgEl.alt = item.nombre;
        } else {
            row.querySelector("figure")?.remove();
        }

        // 🔥 MUY IMPORTANTE: botones usan cartItem.id
        row.querySelectorAll("[data-action]").forEach((btn) => {
            btn.dataset.id = item.id;
        });

        // 🔹 cache inmediato
        modalItemsCache.set(item.id, row);

        fragment.appendChild(row);
    });

    dom.listaPedido.appendChild(fragment);

    resetModals();
};

// ===== VARIANTES ===== //
const renderGroupSelect = (group) => {
    const { id, nombre, min, max, required, allow_repetition, options } = group;

    // 🔹 construir options HTML una sola vez
    const optionsHTML = options
        .filter((opt) => opt.activo)
        .map(
            (opt) => `
            <option 
                value="${opt.option_id}" 
                data-precio="${opt.precio_extra}"
            >
                ${opt.nombre}${opt.precio_extra ? ` (+$${opt.precio_extra})` : ""}
            </option>
        `,
        )
        .join("");

    // 🔹 construir selects según min
    const selectsHTML = Array.from(
        { length: min },
        (_, index) => `
        <div class="variant-select">
            <select
                name="group-${id}-option-${index}"
                data-group-id="${id}" 
                data-index="${index}"
                ${required ? "required" : ""}
            >
                <option value="">Selecciona un sabor</option>
                ${optionsHTML}
            </select>
        </div>
    `,
    ).join("");

    // 🔹 contenedor del grupo
    return `
        <div class="variant-group">
            <h3>${nombre} ${required ? "*" : ""}</h3>
            <div class="variant-options">
                ${selectsHTML}
            </div>
        </div>
    `;
};

const renderGroupSingle = (group) => {
    const { id, nombre, required, options } = group;

    const optionsHTML = options
        .filter((opt) => opt.activo)
        .map(
            (opt, index) => `
            <label class="variant-option">
                <input 
                    type="radio"
                    name="group-${id}"
                    value="${opt.option_id}"
                    data-group-id="${id}"
                    data-precio="${opt.precio_extra}"
                    ${required && index === 0 ? "checked" : ""}
                />
                <span>
                    ${opt.nombre}
                    ${opt.precio_extra ? ` (+$${opt.precio_extra})` : ""}
                </span>
            </label>
        `,
        )
        .join("");

    return `
        <div class="variant-group">
            <h3>${nombre} ${required ? "*" : ""}</h3>
            <div class="variant-options">
                ${optionsHTML}
            </div>
        </div>
    `;
};

const renderGroupCheckbox = (group) => {
    const { id, nombre, required, min, max, options } = group;

    const optionsHTML = options
        .filter((opt) => opt.activo)
        .map(
            (opt) => `
            <label class="variant-option">
                <input 
                    name="group-${id}"
                    type="checkbox"
                    value="${opt.option_id}"
                    data-group-id="${id}"
                    data-precio="${opt.precio_extra}"
                />
                <span>
                    ${opt.nombre}
                    ${opt.precio_extra ? ` (+$${opt.precio_extra})` : ""}
                </span>
            </label>
        `,
        )
        .join("");

    return `
        <div 
            class="variant-group"
            data-group-id="${id}"
            data-min="${min}"
            data-max="${max}"
            data-required="${required}"
        >
            <h3>
                ${nombre} 
                ${required ? "*" : ""}
                ${max ? `(máx ${max})` : ""}
            </h3>

            <div class="variant-options">
                ${optionsHTML}
            </div>

            <p class="variant-error hidden"></p>
        </div>
    `;
};

const renderGroup = (group) => {
    const tipo = group.tipo;
    switch (tipo) {
        case "select":
            return renderGroupSelect(group);
            break;
        case "single":
            return renderGroupSingle(group);
            break;
        case "checkbox":
            return renderGroupCheckbox(group);
            break;
        default:
            return "";
    }
};

// variantsState.js, se contruye el mapa de opciones cada vez que se abre el modal, a partir del producto actual
// variantsState.js
export const variantsState = {
    currentProduct: null,
    optionsMap: null,
};

const buildOptionsMap = (product) => {
    const map = {};

    product.groups.forEach(group => {
        group.options.forEach(opt => {
            map[opt.option_id] = opt;
        });
    });

    return map;
};

export const renderVariantModal = (product) => {
    /* Información del producto*/
    dom.variantsProductName.textContent = product.nombre;
    dom.variantsProductDescription.textContent = product.descripcion;
    dom.variantsProductImage.src = getCloudinaryImageUrl(product.imagen);
    dom.variantsProductPrice.textContent = `$${product.precio.toLocaleString()}`;
    dom.variantsAddButton.dataset.productid = product.id;

    // Map de opciones y de producto que se usa para recuperar precios extra al seleccionar variantes
    variantsState.currentProduct = product;
    variantsState.optionsMap = buildOptionsMap(product);

    /* Información de grupos*/
    const html = product.groups.map((group) => renderGroup(group)).join("");

    dom.variantsForm.innerHTML = html;
    dom.variantsAddButton.disabled = !dom.variantsForm.checkValidity();
    dom.variantsDialog.showModal();
};

// ===== Init Render ===== //
export const renderTodo = () => {
    renderBarra();
    renderProductos();
    renderModal();
};

/* ========== CHECKOUT ========== */

export const renderNombreCliente = () => {
    if (state.nombreCliente) {
        checkoutDom.nombreCliente.value = state.nombreCliente;
    }
};

export const renderTelefono = () => {
    if (state.telefono) {
        checkoutDom.telefono.value = state.telefono;
    }
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

    renderResumen();
};

export const renderMetodoPago = () => {
    if (state.metodoPago) {
        checkoutDom.metodoPago.querySelector(
            `option[value="${state.metodoPago}"]`,
        ).selected = true;
    }
};

export const renderNotas = () => {
    if (state.notas) {
        checkoutDom.notas.value = state.notas;
    }
};

// Validar datos para botón
export const renderValidar = (estado) => {
    const isValid = estado;
    checkoutDom.btnHacerPedido.disabled = !isValid;
    checkoutDom.estadoFormulario.textContent = isValid
        ? ""
        : "Por favor, completa todos los campos correctamente.";
};

// Render del resumen
export const renderResumen = () => {
    const { tipoEntrega, items, valorEntrega, totalProductos } = state;
    const isDomicilio = tipoEntrega === "domicilio";
    let total = 0;

    const html = Object.values(items)
    .map((item) => {
        const hasImage = item.imagen && item.imagen.trim() !== "";

        // 🔥 variantes
        const variantes = item.groups?.length
            ? `<p class="product-variants text-sm text-gray-500">
                ${item.groups
                    .map(g => `${g.nombre}: ${g.selections.map(s => s.nombre).join(", ")}`)
                    .join(" • ")}
               </p>`
            : "";

        return hasImage
            ? `
            <li class="product-item flex gap-2 items-center con-img">
                <div class="flex relative w-fit">
                    <figure class="h-16 w-16 aspect-square">
                        <img src="${item.imagen}" alt="${item.nombre}" class="rounded object-cover h-full w-full"/>
                    </figure>
                    <span class="product-badge absolute -top-1 -right-1 bg-black text-white rounded px-2 py-0.5 text-xs text-bold">
                        ${item.quantity}
                    </span>
                </div>

                <div>
                    <p class="product-name">${item.nombre}</p>
                    ${variantes}
                    <p class="product-price text-gray-700">
                        ${formatPrice(item.total_price)}
                    </p>
                </div>

                <p class="product-subtotal ms-auto text-nowrap">
                    ${formatPrice(item.total_price * item.quantity)}
                </p>
            </li>
            `
            : `
            <li class="product-item flex gap-2 items-center sin-img">
                <div class="flex relative w-fit">
                    <div class="h-16 w-16 flex items-center justify-center">
                        <span class="product-badge bg-black text-white rounded px-2 py-0.5 text-xs text-bold">
                            ${item.quantity}
                        </span>
                        <span>&nbsp;x</span>
                    </div>
                </div>

                <div>
                    <p class="product-name">${item.nombre}</p>
                    ${variantes}
                    <p class="product-price text-gray-700">
                        ${formatPrice(item.total_price)}
                    </p>
                </div>

                <p class="product-subtotal ms-auto text-nowrap">
                    ${formatPrice(item.total_price * item.quantity)}
                </p>
            </li>
            `;
    })
    .join("");

    // checkoutDom.resumenPedido.innerHTML = html;
    checkoutDom.orderSummaryItems.innerHTML = html;

    // Cálculo matemático
    const subtotal = computeTotal(items);
    const shipping = getShipping(items);
    const grandTotal = Number(subtotal) + Number(shipping);

    checkoutDom.orderSummaryProductsTotal.textContent = `${formatPrice(subtotal)}`;

    if (isNaN(valorEntrega)) {
        checkoutDom.orderSummaryShipping.textContent =
            "El costo de envío se paga al domiciliario";
    } else {
        checkoutDom.orderSummaryShipping.textContent = `${formatPrice(shipping)}`;
    }

    checkoutDom.orderSummaryGrandTotal.textContent = `${formatPrice(grandTotal)}`;
    checkoutDom.orderSummaryFinalTotal.textContent = `${formatPrice(grandTotal)}`;

    // Opcional: Mostrar/Ocultar contenedor de envío según el tipo
    if (isDomicilio) {
        checkoutDom.orderSummaryShipping?.parentElement?.classList.remove(
            "visually-hidden",
        );
    } else {
        checkoutDom.orderSummaryShipping?.parentElement?.classList.add(
            "visually-hidden",
        );
    }

    // if (tipoEntrega === "domicilio") {
    //     checkoutDom.envioPedido.textContent = `$${valorEntrega.toLocaleString()}`;
    //     checkoutDom.envioPedidoContainer.classList.remove("oculto");
    //     total = Number(totalProductos) +  Number(valorEntrega);
    //     checkoutDom.totalPedido.textContent = `$${total.toLocaleString()}`;
    // } else {
    //     checkoutDom.envioPedidoContainer.classList.add("oculto");    }
    //     total = Number(totalProductos);
    //     checkoutDom.totalPedido.textContent = `$${total.toLocaleString()}`;
};

const renderForm = () => {
    renderNombreCliente();
    renderTelefono();
    renderEntrega();
    renderMetodoPago();
    renderNotas();
    validarFormulario();
};

export const renderCheckout = () => {
    renderForm();
    renderResumen();
};
