const state = {
    items: {},
    tipoEntrega: "domicilio", // "domicilio" | "recoger"
    direccion: "",
};

// Asigar direccion del local
const direccionLocal = document.querySelector("#datos").dataset.direccionlocal;
const telefono = document.querySelector("#datos").dataset.telefono;
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
    const { nombre, precio, imagen, descripcion } = producto;

    // Si el producto no existe aún en el estado, lo inicializamos
    if (!state.items[nombre]) {
        state.items[nombre] = {
            nombre,
            precio,
            imagen,
            descripcion,
            cantidad: 0
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

const borrarPedido = () => {
    // Vaciamos items
    state.items = {};
    // Persistimos
    guardarStateEnStorage();

    //Re-renderizar
    renderTodo();
}

// Tipo de entrega
const setTipoEntrega = (tipo) => {
    if (tipo !== "domicilio" && tipo !== "recoger") return;

    state.tipoEntrega = tipo;
    guardarStateEnStorage();
    renderTodo();
};

const setDireccion = (dir) => {state.direccion = dir};



const dialogLightbox = document.getElementById('lightbox');
const dialogImg = document.getElementById('lightbox-img');
const closeBtn = dialogLightbox.querySelector('.close');

// !IMPORTANT METER EN EVENTOS
closeBtn.addEventListener('click', () => dialogLightbox.close());
dialogLightbox.addEventListener('click', (e) => {
  if (e.target === dialogLightbox) dialogLightbox.close();
});

// Productos del menú y modal
const bindEventosProductos = () => {
    // Agregar listeners a los botones + y - de cada producto
    document.addEventListener("click", (event) => {
        // 1️⃣ Verificar si el click viene de un botón de producto
        if (!event.target) return;
        const boton = event.target.closest("[data-action]");

        if (event.target.tagName == 'IMG'){
            const imageUrl = event.target.dataset.full || event.target.src;
            dialogImg.src = imageUrl;
            dialogImg.alt = event.target.alt || '';
            dialogLightbox.showModal();
        }

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
            imagen: productoEl.dataset.imagen,
            descripcion: productoEl.dataset.descripcion,
        };

        // 5️⃣ Ejecutar acción
        if (accion === "add") {
            updateCantidad(producto, +1);
        }

        if (accion === "remove") {
            updateCantidad(producto, -1);
        }
    });

    // const menu = document.querySelector("#menu");

    // menu.addEventListener('click', (e) => {
    //     if (e.target.tagName !== 'IMG') return;

    // })
};

const renderProductos = () => {
    const productosDOM = document.querySelectorAll(".producto");

    productosDOM.forEach((productoEl) => {
        const nombre = productoEl.dataset.nombre;
        const cantidadEl = productoEl.querySelector(".cantidad");
        const cantidad = state.items[nombre]?.cantidad || 0;
        
        const addBtn = productoEl.querySelector(".add");
        const removeBtn = productoEl.querySelector(".remove");
        const addProductBtn = productoEl.querySelector(".add-product");
        // Pintar cantidad
        cantidadEl.textContent = cantidad;

        // Estado visual (opcional pero PRO)
        if (cantidad > 0) {
            addBtn.classList.remove("cerrado");
            removeBtn.classList.remove("cerrado");
            cantidadEl.classList.remove("cerrado");
            addProductBtn.classList.add("cerrado");
        } else {
            addBtn.classList.add("cerrado");
            removeBtn.classList.add("cerrado");
            cantidadEl.classList.add("cerrado");
            addProductBtn.classList.remove("cerrado");  
        }
    });
};

// Sticky bar 
const bindEventosBarra = () => {
    const btnVerPedido = document.querySelector("#btn-ver-pedido");
    const modal = document.querySelector("#modal-pedido");

    if (!btnVerPedido) return;

    // Abrir modal desde la barra
    btnVerPedido.addEventListener("click", () => {
        // modal.classList.remove("cerrado");
        modal.showModal();
        document.body.classList.add('no-scroll');
    });

};

const renderBarra = () => {
    const barra = document.querySelector("#barra-pedido");
    const btn = document.querySelector("#btn-ver-pedido");
    const resumenes = document.querySelectorAll("#barra-resumen");
    
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
    resumenes.forEach((resumen) => {
        resumen.querySelector("#barra-resumen-total").textContent = `$ ${totalPrecio.toLocaleString()}`;
        resumen.querySelector("#barra-resumen-cantidad").textContent = `${totalItems} producto${totalItems > 1 ? "s" : ""}`;
    });
};


// Modal
const bindEventosModal = () => {
    const modal = document.querySelector("#modal-pedido");
    const modalBorrar = document.querySelector("#modal-borrar-pedido")
    if (!modal) return;

    // Delegación de eventos dentro del modal
    modal.addEventListener("click", (e) => {
        
        const target = e.target;
        // Cerrar modal
        if (target.id === "btn-modificar-pedido" || target.id === "btn-cerrar-modal" || target == modal) {
            modal.close();
            document.body.classList.remove('no-scroll');
        }
        // Abrir eliminar pedido
        if (target.id === "btn-borrar-modal" ) {
            modalBorrar.showModal();
        }
        // Hacer pedido
        if (target.id === "btn-hacer-pedido") {
            hacerPedido();
        }
    });

    // Delegación de eventos dentro del modal borrar
    modalBorrar.addEventListener("click", (e) => {
        const target = e.target;
        if (target.id === "btn-borrar-pedido" || target.id === "btn-conservar-pedido" || target == modalBorrar) {
            modalBorrar.close();
        }
        if (target.id === "btn-borrar-pedido") {
            document.body.classList.remove('no-scroll');
            borrarPedido();
        }
    })

    // Tipo de entrega
    modal.addEventListener("change", (e) => {
        const target = e.target;
        if (target.name === "entrega") {
            setTipoEntrega(target.value);
        }

        if (target.id === "input-direccion") {
            setDireccion(target.value)
            guardarStateEnStorage();
        }
    });
};

function cloudinaryUrl(id) {
  return `https://res.cloudinary.com/dc8vxeapd/image/upload/w_400,q_auto,f_auto/${id}.jpg`;
}


const renderModal = () => {

    const lista = document.querySelector("#lista-pedido");

    if (!lista ) return;

    lista.replaceChildren();

    let total = 0;
    const template = document.querySelector("#item-pedido-template");

    if (!template) return;

    const modal = document.querySelector("#modal-pedido");
    if (state.items === null || Object.keys(state.items).length === 0) {

        modal.close();
        document.body.classList.remove('no-scroll');
        return;
    }

    Object.values(state.items).forEach((item) => {

        if (item.cantidad <= 0) return;
        total += item.cantidad * item.precio;

        const row = template.content.firstElementChild.cloneNode(true);
        row.dataset.nombre = item.nombre;
        row.dataset.precio = item.precio;
        row.dataset.imagen = item.imagen;
        row.dataset.descripcion = item.descripcion

        const nombreEl = row.querySelector(".nombre");
        if (nombreEl) nombreEl.textContent = item.nombre;
        const cantidadEl = row.querySelector(".cantidad");
        if (cantidadEl) cantidadEl.textContent = String(item.cantidad);
        const descripcionEl = row.querySelector(".descripcion");
        if (descripcionEl) descripcionEl.textContent = item.descripcion;
        const imgEL = row.querySelector(".imagen-producto");
        if (imgEL){
            if (item.imagen) {
                imgEL.src = cloudinaryUrl(item.imagen);
                imgEL.alt = item.nombre;
            }  else {
                row.getElementsByTagName("figure")[0].remove()
            }

        }
        const precioEl = row.querySelector(".precio");
        if (precioEl) precioEl.textContent = `$${(item.precio * item.cantidad).toLocaleString()}`;

        lista.appendChild(row);
    });
};


//! REVISAR DIV DEL TEXTAREAN DISPLAY BLOCK
const renderEntrega = (direccionlocal = direccionLocal) => {
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

    if(state.tipoEntrega === "recoger"){
        inputDireccionEl.value = direccionlocal;
        inputDireccionEl.classList.remove("invalid");
        inputDireccionEl.disabled = true;
    } else {
        campoDireccionEl.style.display = "block";
        inputDireccionEl.value = state.direccion;
        inputDireccionEl.classList.remove("invalid");
        inputDireccionEl.disabled = false;
    }
};

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
    setTipoEntrega("domicilio");
    renderTodo();
}

init();