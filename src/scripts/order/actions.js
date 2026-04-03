import { state, guardarState, cargarState } from "../state.js";
import {
    renderSingleProducto,
    renderBarra,
    renderSingleModal,
    renderNombreCliente,
    renderTelefono,
    renderEntrega,
    renderMetodoPago,
    renderTodo,
    renderValidar,
    renderVariantModal,
} from "./render.js";

// consulta en PRODUCTS_MAP
export const getProductById = (id) => {
    return PRODUCTS_MAP[id] || null;
};

// consulta en CART
export const getTotalQuantityByProductId = (productId) => {
    let total = 0;
    for (const item of Object.values(state.items)) {
        if (item.product_id === productId) {
            total += item.quantity;
        }
    }

    return total;
};

// Constructor de productos para el carrito
export const buildSimpleCartItem = (product) => {
    return {
        id: product.id,
        product_id: product.id,
        nombre: product.nombre,
        imagen: product.imagen || "",
        base_price: Number(product.precio || 0),
        extras_price: 0,
        total_price: Number(product.precio || 0),
        quantity: 1,
        groups: []
    };
};

export const buildCartItemWithVariants = (product, selections) => {
    let extrasTotal = 0;

    const groups = selections.map((sel) => {
        // 🔹 buscar grupo real en producto
        const group = product.groups.find(g => g.id === sel.group_id);

        if (!group) return null;

        // 🔹 obtener opciones completas
        const selectedOptions = sel.options
            .map(optId => group.options.find(o => o.option_id === optId))
            .filter(Boolean);

        // 🔹 sumar extras
        selectedOptions.forEach(opt => {
            extrasTotal += Number(opt.precio_extra || 0);
        });

        return {
            group_id: group.id,
            nombre: group.nombre,
            selections: selectedOptions.map(opt => ({
                option_id: opt.option_id,
                nombre: opt.nombre,
                precio_extra: Number(opt.precio_extra || 0)
            }))
        };
    }).filter(Boolean);

    // 🔥 construir ID determinístico
    const groupsIdPart = groups
        .map(g => {
            const sortedOptions = g.selections
                .map(o => o.option_id)
                .sort()
                .join(",");
            return `${g.group_id}:${sortedOptions}`;
        })
        .sort()
        .join("|");

    const cartItemId = `${product.id}|${groupsIdPart}`;

    return {
        id: cartItemId,

        product_id: product.id,
        nombre: product.nombre,
        imagen: product.imagen || "",

        base_price: Number(product.precio || 0),
        extras_price: extrasTotal,
        total_price: Number(product.precio || 0) + extrasTotal,

        quantity: 1,

        groups
    };
};

export const recalculateTotals = () => {
    let totalItems = 0;
    let totalPrice = 0;

    for (const item of Object.values(state.items)) {
        totalItems += item.quantity;
        totalPrice += item.total_price * item.quantity;
    }

    state.totalItems = totalItems;
    state.totalProductos = totalPrice;
};

const renderAfterCartChange = (productId) => {
    renderSingleProducto(productId); // menú
    renderSingleModal(productId);    // cart
    renderBarra();                   // barra
};

export const updateCantidad = (productId, delta) => {
    const product = getProductById(productId);
    if (!product) return;

    // 🔹 CASO 1: producto con variantes
    if (product.hasVariants) {
        // 👉 solo tiene sentido abrir modal si es suma
        if (delta > 0) {
            renderVariantModal(product);
        }
        return;
    }

    // 🔹 CASO 2: producto simple
    const cartItem = buildSimpleCartItem(product);

    addToCart(cartItem, delta);
};

export const updateCartItemQuantity = (id, delta) => {
    const item = state.items[id];
    if (!item) return;
    addToCart(item, delta);
};

export const addToCart = (cartItem, delta = 1) => {
    const existingItem = state.items[cartItem.id];

    // 🔹 1. Si ya existe → modificar cantidad
    if (existingItem) {
        const newQuantity = existingItem.quantity + delta;

        if (newQuantity <= 0) {
            delete state.items[cartItem.id];
        } else {
            existingItem.quantity = newQuantity;
        }
    } 
    // 🔹 2. Si NO existe → crear nuevo
    else {
        if (delta > 0) {
            state.items[cartItem.id] = {
                ...cartItem,
                quantity: delta
            };
        }
    }

    // 🔹 3. Recalcular derivados
    recalculateTotals();

    // 🔹 4. Persistir
    guardarState();

    // 🔹 5. Renderizar
    // 🔥 5. Resolver productId de forma segura
    const productId =
        cartItem.product_id || existingItem?.product_id;

    if (productId) {
        console.log(`Actualizando UI para productId: ${productId}`);
        renderAfterCartChange(productId)
    };
};

export const borrarPedido = () => {
    state.items = {};
    state.totalItems = 0;
    state.totalProductos = 0;
    guardarState();
    renderTodo();
};

// Auntomatico con render de pagina pedido en init
export const setValorEntrega = (valor) => {
    state.valorEntrega = valor;
    guardarState();
};

// Checkout
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
};

export const computeTotal = (items) => {
    return Object.values(items).reduce((total, item) => {
        const price = Number(item.total_price || 0);
        const qty = Number(item.quantity || 0);
        return total + price * qty;
    }, 0);
};

export const validarFormulario = () => {
    const { nombreCliente, telefono, tipoEntrega, direccion, metodoPago } =
        state;

    let estado = true;

    if (!nombreCliente || !telefono || !tipoEntrega || !metodoPago)
        estado = false;

    if (tipoEntrega === "domicilio") {
        const direccionVacia = !direccion || direccion.trim().length === 0;
        if (direccionVacia) estado = false;
    }

    renderValidar(estado);
    return estado;
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
