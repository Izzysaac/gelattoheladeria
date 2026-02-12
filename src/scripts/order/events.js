import {
	updateCantidad,
	borrarPedido,
	setTipoEntrega,
	setDireccion,
} from "./actions.js";
import { dom } from "./dom.js";
import { state } from "./state.js";
import { showImageViewer } from "../menu/viewimg.js"

const telefono = document.querySelector("#datos").dataset.telefono;
// !Generar mensaje de pedido WhatsApp
export const generarMensaje = () => {
    // 1. Usar totales ya calculados en el estado (Evitamos el bucle de cálculo)
    const { items, totalPrecio, tipoEntrega, direccion } = state;
    const itemsArray = Object.values(items);

    if (itemsArray.length === 0) return "";

    // 2. Acumulador de líneas
    const lineas = ["Hola, quiero realizar un pedido por favor:"];

    // 3. Generar cuerpo del mensaje
    itemsArray.forEach((item) => {
        if (item.cantidad <= 0) return;
        const subtotal = item.cantidad * item.precio;
        lineas.push(`• ${item.nombre} x${item.cantidad} — $${subtotal.toLocaleString()}`);
    });

    // 4. Totales y entrega
    lineas.push(`\n*Total:* $${totalPrecio.toLocaleString()}`);
    
    const esDomicilio = tipoEntrega === "domicilio";
    lineas.push(`\n*Entrega:* ${esDomicilio ? "A domicilio" : "Recoger en el local"}`);
    
    if (esDomicilio) {
        lineas.push(`*Dirección:* ${direccion}`);
    }

    // 5. El "Único" String final
    return lineas.join("\n");
};

export const hacerPedido = (tel = telefono) => {
    // 1. Validación usando el estado derivado (O(1) vs O(n))
    if (state.totalItems === 0) {
        // En lugar de alert, podrías usar un toast o un mensaje en el DOM
        alert("Pedido vacío. Agrega algún producto antes de continuar.");
        return;
    }

    // 2. Validación de dirección (Lógica de estado)
    const esDomicilio = state.tipoEntrega === "domicilio";
    const direccionVacia = !state.direccion || state.direccion.trim().length === 0;

    if (esDomicilio && direccionVacia) {
        // Feedback visual inmediato
        dom.inputDireccion.classList.add("invalid");
        dom.inputDireccion.focus(); // Mejor que scroll si es un input
        dom.inputDireccion.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    // 3. Generación de mensaje y envío
    const mensaje = generarMensaje();
    
    // Usamos encodeURIComponent solo al final para asegurar que caracteres 
    // especiales como #, & o emojis no rompan la URL
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;

    // 4. Abrir WhatsApp
    window.open(url, "_blank");
};

const extraerProductoDesdeElemento = (el) => {

	const productEl = el.closest("article");
	if (!productEl) return null;
	return {
		nombre: productEl.dataset.nombre,
		precio: Number(productEl.dataset.precio),
		imagen: productEl.dataset.imagen,
		descripcion: productEl.dataset.descripcion,
	};
};

const controlAction = (action, element) => {
    // 1. Extraemos el producto UNA sola vez
    const producto = extraerProductoDesdeElemento(element);
    if (!producto) return;

    // 2. Ejecutamos según la acción
    switch (action) {
        case "add-product":
            updateCantidad(producto, 1);
            break;
        case "remove-product":
            updateCantidad(producto, -1);
            break;
        default:
            return;
    }
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

	//* Acciones de producto (carta y pedido)

	// Listener para el Menú Principal
	dom.menu.addEventListener("click", (e) => {
		/* ! Flujo ideal: (se saca factor común)
		delegación menú
		|--filtrar clicks irrevelantes
		|--determinar intención (imagen/accion)
		|--resolver producto/contexto
		|--ejecutar acción negocio
		|--actualizar UI necesaria
		*/
		const target = e.target;
		const action = target.getAttribute("data-action");
		if (!action) return;

		// * Ver imagen
		if (action === "view-image") {
			showImageViewer(target);
			return;
		}

		// * Acciones de negocio (producto)
		controlAction(action, target);
	});

	// Listener para el Modal de Pedido
	dom.listaPedido.addEventListener("click", (e) => {
		// Usamos closest para asegurar que pillamos el botón aunque pinchen en el icono
		const btn = e.target.closest("[data-action]");
		if (!btn) return;

		controlAction(btn.dataset.action, btn);
	});

};

export const bindEventosModal = () => {
	// Tipo de entrega
	dom.modalVerPedido.addEventListener("change", (e) => {
		const target = e.target;
		if (target.name === "entrega") {
			setTipoEntrega(target.value);
			
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
		}
	});
};

export const bindEventos = () => {
	bindEventosProductos();
	bindEventosModal();
};
