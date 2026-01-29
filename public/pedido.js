const state = {
    items: {},
    tipoEntrega: null, // "domicilio" | "recoger"
    direccion: "",
};

// Cargar estado desde localStorage

const cargarStateDesdeStorage = () => {
    const stateStorage = localStorage.getItem("pedidoState");
    if (stateStorage) {
        const stateParseado = JSON.parse(stateStorage);
        state.items = stateParseado.items || {};
        state.tipoEntrega = stateParseado.tipoEntrega || null;
        state.direccion = stateParseado.direccion || "";
    }
};

const guardarStateEnStorage = () => {
    localStorage.setItem("pedidoState", JSON.stringify(state));
};

// Actualizar cantidad de un producto en el estado
const updateCantidad = (producto, delta) => {
    const { nombre, precio } = producto;

    // Si el producto no existe aún en el estado, lo inicializamos
    if (!state.items[nombre]) {
        state.items[nombre] = {
            nombre,
            precio,
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

    // Persistimos
    guardarStateEnStorage();

    //Re-renderizar
    renderTodo();
};

// Productos del menú y modal
const bindEventosProductos = () => {
    // Agregar listeners a los botones + y - de cada producto
    document.addEventListener("click", (event) => {
        // 1️⃣ Verificar si el click viene de un botón de producto
        if (!event.target) return;
        const boton = event.target.closest("[data-action]");
        if (!boton) return;

        // 2️⃣ Identificar acción
        const accion = boton.dataset.action;
        if (accion !== "add" && accion !== "remove") return;

        // 3️⃣ Obtener contenedor del producto
        const productoEl = boton.closest("[data-nombre]");
        if (!productoEl) return;
        // 4️⃣ Extraer información del producto
        const producto = {
            nombre: productoEl.dataset.nombre,
            precio: Number(productoEl.dataset.precio),
        };

        // 5️⃣ Ejecutar acción
        if (accion === "add") {
            updateCantidad(producto, +1);
        }

        if (accion === "remove") {
            updateCantidad(producto, -1);
        }
    });
};

const renderProductos = () => {
    const productosDOM = document.querySelectorAll(".producto");

    productosDOM.forEach((productoEl) => {
        const nombre = productoEl.dataset.nombre;
        const cantidadEl = productoEl.querySelector(".cantidad");
        const cantidad = state.items[nombre]?.cantidad || 0;

        // Pintar cantidad
        cantidadEl.textContent = cantidad;

        // Estado visual (opcional pero PRO)
        if (cantidad > 0) {
            productoEl.classList.add("activo");
        } else {
            productoEl.classList.remove("activo");
        }
    });
};

// Sticky bar 
const bindEventosBarra = () => {
    const btnVerPedido = document.querySelector("#btn-ver-pedido");
    const btnCerrarModal = document.querySelector("#btn-cerrar-modal");
    const btnModificarPedido = document.querySelector("#btn-modificar-pedido");
    const modal = document.querySelector("#modal-pedido");

    if (!btnVerPedido || !modal) return;

    // Abrir modal desde la barra
    btnVerPedido.addEventListener("click", () => {
        modal.classList.remove("cerrado");
    });

    // Cerrar modal (botón cerrar)
    if (btnCerrarModal ) {
        btnCerrarModal.addEventListener("click", () => {
            modal.classList.add("cerrado");
        });
    }
    if (btnModificarPedido ) {
        btnModificarPedido.addEventListener("click", () => {
            modal.classList.add("cerrado");
        });
    }

    // Cerrar modal al tocar fuera del contenido
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("cerrado");
        }
    });
};

const renderBarra = () => {
    const barra = document.querySelector("#barra-pedido");
    const btn = document.querySelector("#btn-ver-pedido");
    const resumen = document.querySelector("#barra-resumen");

    if (!barra || !btn) return;

    let totalItems = 0;
    let totalPrecio = 0;

    Object.values(state.items).forEach((item) => {
        totalItems += item.cantidad;
        totalPrecio += item.cantidad * item.precio;
    });

    // Si no hay productos, ocultamos barra
    if (totalItems === 0) {
        barra.classList.add("ocultar");
        return;
    }

    // Mostrar barra
    barra.classList.remove("ocultar");

    // Texto del botón
    resumen.textContent = `🛒 ${totalItems} producto${totalItems > 1 ? "s" : ""} \u2022 $${totalPrecio.toLocaleString()}`;
};

// Modal
const bindEventosModal = () => {
    const modal = document.querySelector("#modal-pedido");
    if (!modal) return;
    // Delegación de eventos dentro del modal
    modal.addEventListener("click", (e) => {
        const target = e.target;
        // ➕ Agregar producto
        // if (target.classList.contains("add")) {
        //     const item = target.closest(".item-pedido");
        //     if (!item) return;
        //     const producto = {
        //         nombre: (item as HTMLElement).dataset.nombre,
        //         precio: Number((item as HTMLElement).dataset.precio),
        //     };
        //     updateCantidad(producto, +1);
        // }
        // ➖ Quitar producto
        // if (target.classList.contains("remove")) {
        //     const item = target.closest(".item-pedido");
        //     if (!item) return;

        //     const producto = {
        //         nombre: (item as HTMLElement).dataset.nombre,
        //         precio: Number((item as HTMLElement).dataset.precio),
        //     };
        //     updateCantidad(producto, -1);
        // }
        // 🟢 Hacer pedido
        if (target.id === "btn-hacer-pedido") {
            hacerPedido();
        }
    });

    // Tipo de entrega
    modal.addEventListener("change", (e) => {
        const target = e.target;
        if (target.name === "entrega") {
            setTipoEntrega(target.value);
        }

        if (target.id === "input-direccion") {
            state.direccion = target.value;
            guardarStateEnStorage();
        }
    });
};

const renderModal = () => {

    const lista = document.querySelector("#lista-pedido");
    const totalEl = document.querySelector("#total-pedido");

    if (!lista || !totalEl) return;

    lista.replaceChildren();

    let total = 0;
    const template = document.querySelector("#item-pedido-template");

    if (!template) return;

    const modal = document.querySelector("#modal-pedido");
    if (state.items === null || Object.keys(state.items).length === 0) {
        modal.classList.add("cerrado");
        return;
    }

    Object.values(state.items).forEach((item) => {

        if (item.cantidad <= 0) return;

        total += item.cantidad * item.precio;

        const row = template.content.firstElementChild.cloneNode(true);
        row.dataset.nombre = item.nombre;
        row.dataset.precio = item.precio;

        const nombreEl = row.querySelector(".nombre");
        if (nombreEl) nombreEl.textContent = item.nombre;
        const cantidadEl = row.querySelector(".cantidad");
        if (cantidadEl) cantidadEl.textContent = String(item.cantidad);
        const precioEl = row.querySelector(".precio");
        if (precioEl) precioEl.textContent = `$${(item.precio * item.cantidad).toLocaleString()}`;

        lista.appendChild(row);
    });

    totalEl.textContent = `Total: $${total.toLocaleString()}`;
};

// Tipo de entrega
const setTipoEntrega = (tipo) => {
    if (tipo !== "domicilio" && tipo !== "recoger") return;

    state.tipoEntrega = tipo;

    // Si recoge, limpiamos dirección
    if (tipo === "recoger") {
        state.direccion = "";
    }

    guardarStateEnStorage();
    renderTodo();
};

const renderEntrega = () => {
    const radios = document.querySelectorAll('input[name="entrega"]');
    const campoDireccion = document.querySelector("#campo-direccion");
    const inputDireccion = document.querySelector("#input-direccion");

    if (!radios.length || !campoDireccion || !inputDireccion) return;

    // Marcar radio activo según estado
    radios.forEach((radio) => {
        const inputRadio = radio;
        inputRadio.checked = inputRadio.value === state.tipoEntrega;
    });

    // Mostrar / ocultar dirección
    const campoDireccionEl = campoDireccion;
    const inputDireccionEl = inputDireccion;
    if (state.tipoEntrega === "domicilio") {
        campoDireccionEl.style.display = "block";
        inputDireccionEl.value = state.direccion;
    } else {
        campoDireccionEl.style.display = "none";
        inputDireccionEl.value = "";
    }
};

// Generar mensaje de pedido WhatsApp
const generarMensaje = () => {
    let mensaje = "*Nuevo pedido*\n";
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

const hacerPedido = () => {
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
        return;
    }

    // 3️⃣ Generar mensaje
    const mensaje = generarMensaje();

    // 4️⃣ Enviar (WhatsApp)
    const telefono = "573163896572"; // cambia por el real
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank");
};

// Renderizar todo
const renderTodo = () => {
    renderProductos();
    renderBarra();
    renderModal();
    renderEntrega();
};

const init = () => {
    cargarStateDesdeStorage();
    bindEventosProductos();
    bindEventosBarra();
    bindEventosModal();
    renderTodo();
}

init();