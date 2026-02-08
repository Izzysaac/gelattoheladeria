import { state } from "./state.js";
import { dom } from "./dom.js";

/* 
    productos: todos los productos del menu (article)

    stickyBar: 
    btnVerPedido: 
    btnHacerPedido: 
    resumenesPedido: p de total precio y total cantidad

    modalVerPedido: 
    modalBorrarPedido: 
    listaPedido:
    templatePedidoProducto:

    Seleccion de tipo de entrega
    radios:
    divInputDireccion: 
    inputDireccion:

    Image Viewer
    dialogImageViewer:
    dialogImageViewerImg: 
    dialogImageViwerCloseBtn: 
*/
const direccionLocal = document.querySelector("#datos").dataset.direccionlocal;

export const renderProductos = () => {
  dom.productos.forEach((productoEl) => {
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

export const renderBarra = () => {
  // const total = Object.values(state.items).reduce(
  //     (acc, i) => acc + i.cantidad,
  //     0,
  // );

  // dom.barra.classList.toggle("visible", total > 0);
  // dom.btnVerPedido.textContent = `Ver pedido (${total})`;

  let totalItems = 0;
  let totalPrecio = 0;

  Object.values(state.items).forEach((item) => {
    totalItems += item.cantidad;
    totalPrecio += item.cantidad * item.precio;
  });

  // Si no hay productos, ocultamos barra
  if (totalItems === 0) {
    dom.stickyBar.classList.add("ocultar");
    return;
  }

  // Mostrar barra
  dom.stickyBar.classList.remove("ocultar");

  // Texto del botón
  dom.resumenesPedido.forEach((resumen) => {
    resumen.querySelector("#barra-resumen-total").textContent =
      `$ ${totalPrecio.toLocaleString()}`;
    resumen.querySelector("#barra-resumen-cantidad").textContent =
      `${totalItems} producto${totalItems > 1 ? "s" : ""}`;
  });
};

//! COMPROBAR SI CON DIALOG, EL SCROLL AFECTA
export const closeModal = () => {
  dom.modalVerPedido.close();
  document.body.classList.remove("no-scroll");
};

function cloudinaryUrl(id) {
  return `https://res.cloudinary.com/dc8vxeapd/image/upload/w_400,q_auto,f_auto/${id}.jpg`;
}

export const renderModal = () => {
  if (!dom.listaPedido) return;
  dom.listaPedido.replaceChildren();

  let total = 0;
  if (state.items === null || Object.keys(state.items).length === 0) {
    closeModal();
    return;
  }
  Object.values(state.items).forEach((item) => {
    if (item.cantidad <= 0) return;
    total += item.cantidad * item.precio;

    const row =
      dom.templatePedidoProducto.content.firstElementChild.cloneNode(true);
    row.dataset.nombre = item.nombre;
    row.dataset.precio = item.precio;
    row.dataset.imagen = item.imagen;
    row.dataset.descripcion = item.descripcion;

    const nombreEl = row.querySelector(".nombre");
    if (nombreEl) nombreEl.textContent = item.nombre;
    const cantidadEl = row.querySelector(".cantidad");
    if (cantidadEl) cantidadEl.textContent = String(item.cantidad);
    const descripcionEl = row.querySelector(".descripcion");
    if (descripcionEl) descripcionEl.textContent = item.descripcion;
    const imgEL = row.querySelector(".imagen-producto");
    if (imgEL) {
      if (item.imagen) {
        imgEL.src = cloudinaryUrl(item.imagen);
        imgEL.alt = item.nombre;
      } else {
        row.getElementsByTagName("figure")[0].remove();
      }
    }
    const precioEl = row.querySelector(".precio");
    if (precioEl)
      precioEl.textContent = `$${(item.precio * item.cantidad).toLocaleString()}`;

    dom.listaPedido.appendChild(row);
  });
};

//! REVISAR DIV DEL TEXTAREAN DISPLAY BLOCK
export const renderEntrega = () => {
  // dom.entrega.classList.toggle(
  //     "mostrar-direccion",
  //     state.tipoEntrega === "domicilio",
  // );
  dom.radios.forEach((radio) => {
    const inputRadio = radio;
    inputRadio.checked = inputRadio.value === state.tipoEntrega;
  });
  // Mostrar / ocultar dirección
  const campoDireccionEl = dom.divInputDireccion;
  const inputDireccionEl = dom.inputDireccion;

  if (state.tipoEntrega === "recoger") {
    inputDireccionEl.value = direccionLocal;
    inputDireccionEl.classList.remove("invalid");
    inputDireccionEl.disabled = true;
  } else {
    campoDireccionEl.style.display = "block";
    inputDireccionEl.value = state.direccion;
    inputDireccionEl.classList.remove("invalid");
    inputDireccionEl.disabled = false;
  }
};

export const renderTodo = () => {
  renderProductos();
  renderBarra();
  renderModal();
  renderEntrega();
};
