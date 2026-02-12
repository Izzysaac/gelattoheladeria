import {
  updateCantidad,
  borrarPedido,
  setTipoEntrega,
  setDireccion,
} from "./actions.js";
import { dom } from "./dom.js";
import { renderTodo, renderEntrega } from "./render.js";
import { state } from "./state.js";

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
  const items = Object.values(state.items).filter((item) => item.cantidad > 0);

  if (items.length === 0) {
    alert("No has agregado productos al pedido");
    return;
  }

  // 2️⃣ Validar dirección si es domicilio
  if (state.tipoEntrega === "domicilio" && !state.direccion.trim()) {
    alert("Por favor ingresa la dirección de entrega");
    dom.inputDireccion.scrollIntoView({ behavior: "smooth" });
    dom.inputDireccion.classList.add("invalid");
    return;
  }

  // 3️⃣ Generar mensaje
  const mensaje = generarMensaje();

  // 4️⃣ Enviar (WhatsApp)
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank");
};

const extraerProductoDesdeElemento = (el) => {
  const productEl = el.closest("[data-nombre]");
  if (!productEl) return null;
  return {
    nombre: productEl.dataset.nombre,
    precio: Number(productEl.dataset.precio),
    imagen: productEl.dataset.imagen,
    descripcion: productEl.dataset.descripcion,
  };
};

export const bindEventosProductos = () => {
  // * Cerrar visor de imagen
  dom.imageViewerCloseBtn.addEventListener("click", () =>
      dom.imageViewer.close(),
  );
  dom.imageViewer.addEventListener("click", (e) => {
      if (e.target === dom.imageViewer) dom.imageViewer.close();
  });

  //* Abrir modal de pedido
  dom.btnVerPedido.addEventListener("click", () => {
    dom.modalVerPedido.showModal();
    document.body.classList.add("no-scroll");
  });

  //* Acciones de producto
  dom.menu.addEventListener("click", (e) => {
    /* ! Flujo ideal: 
        delegación menú
        |--filtrar clicks irrevelantes
        |--determinar intención (imagen/accion)
        |--resolver producto/contexto
        |--ejecutar acción negocio
        |--actualizar UI necesaria
        */
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    // * Ver imagen
    if (action == "view-image") {
      const img = actionEl.closest("[data-nombre]")?.querySelector("img");
      if (!img) return;
      const imageUrl = img.dataset.image || img.src;
      dom.imageViewerImg.src = imageUrl;
      dom.imageViewerImg.alt = img.alt || "";
      dom.imageViewer.showModal();
      return;
    }
    // * Acciones de negocio (producto)
    const producto = extraerProductoDesdeElemento(actionEl);
    if (!producto) return;
    switch (action) {
      case "add-product":
        updateCantidad(producto, +1);
        break;

      case "remove-product":
        updateCantidad(producto, -1);
        break;

      default:
        return;
    }
    // ! REnder global siempre
    renderTodo();
  });

  dom.listaPedido.addEventListener("click", (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const producto = extraerProductoDesdeElemento(actionEl);
    if (!producto) return;
    switch (action) {
      case "add-product":
        updateCantidad(producto, +1);
        break;

      case "remove-product":
        updateCantidad(producto, -1);
        break;

      default:
        return;
    }
    // ! REnder global siempre
    renderTodo();
  });
};

export const bindEventosModal = () => {
  // Tipo de entrega
  dom.modalVerPedido.addEventListener("change", (e) => {
    const target = e.target;
    if (target.name === "entrega") {
      setTipoEntrega(target.value);
      renderEntrega();
    }

    if (target.id === "input-direccion") {
      setDireccion(target.value);
    }
  });

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
  // ! DE PRONTO ACTION ROUTER?? AUN ASI ME GUSTA EL CONTROL DE CLICKS INUTILES
  // dom.modalBorrarPedido.addEventListener("click", (e) => {
  //     const action = e.target.closest("[data-action]")?.dataset.action;
  //     if (!action) return;

  //     const actions = {
  //         "close-modal": () => {
  //             dom.modalBorrarPedido.close();
  //         },

  //         "delete-order": () => {
  //             dom.modalBorrarPedido.close();
  //             document.body.classList.remove("no-scroll");
  //             borrarPedido();
  //             renderTodo();
  //         },
  //     };

  //     actions[action]?.();
  // });
};

export const bindEventos = () => {
  bindEventosProductos();
  bindEventosModal();
};
