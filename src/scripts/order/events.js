import {
    updateCantidad,
    borrarPedido,
    setValorEntrega,
    setNombreCliente,
    setTelefono,
    setTipoEntrega,
    setDireccion,
    setMetodoPago,
    setNotas,
    validarFormulario,
} from "./actions.js";
import { dom ,  checkoutDom } from "./dom.js";
import { state } from "../state.js";
import { openModal, manualClose } from "../modal.js";

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

const controlAction = (action, element, closeModal) => {
    // 1. Extraemos el producto UNA sola vez
    const producto = extraerProductoDesdeElemento(element);
    if (!producto) return;

    // 2. Ejecutamos según la acción
    switch (action) {
        case "add-product":
            updateCantidad(producto, 1);
            break;
        case "remove-product":
            updateCantidad(producto, -1, closeModal);
            break;
        default:
            return;
    }
};

export const bindEventosProductos = () => {
    //* Abrir modal de pedido
    dom.btnVerPedido.addEventListener("click", () => {
        // document.body.classList.add("no-scroll");
        // console.log("antiguo añadiro")
        openModal("pedido", dom.modalVerPedido);
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

        // * Acciones de negocio (producto)
        controlAction(action, target);
    });

    // Listener para el Modal de Pedido
    dom.listaPedido.addEventListener("click", (e) => {
        // Usamos closest para asegurar que pillamos el botón aunque pinchen en el icono
        const target = e.target;
        const action = target.getAttribute("data-action");
        if (!action) return;
        controlAction(action, target);
    });

    setValorEntrega(dom.datos.dataset.valorentrega);
};

export const hacerCheckout = () => {
    // 1. Validación usando el estado derivado (O(1) vs O(n))
    if (state.totalItems === 0) {
        // En lugar de alert, podrías usar un toast o un mensaje en el DOM
        alert("Pedido vacío. Agrega algún producto antes de continuar.");
        return;
    }
	window.location.href = "/checkout";
};

export const bindEventosModal = () => {
    // Delegación de eventos dentro del modal
    dom.modalVerPedido.addEventListener("click", (e) => {
        const target = e.target;
        // Cerrar modal
        if (
            target.id === "btn-modificar-pedido" ||
            target.id === "btn-cerrar-modal" ||
            target == dom.modalVerPedido
        ) {
            // document.body.classList.remove("no-scroll");
            // console.log("antiguo removido")
            manualClose();
        }
        // Abrir eliminar pedido
        if (target.id === "btn-borrar-modal") {
            openModal("borrar", dom.modalBorrarPedido);
        }
        // Hacer pedido
        if (target.id === "btn-hacer-checkout") {
            hacerCheckout();
        }
    });

    // Delegación de eventos dentro del modal borrar
    dom.modalBorrarPedido.addEventListener("click", (e) => {
        const target = e.target;
        if (
            target.id === "btn-conservar-pedido" ||
            target == dom.modalBorrarPedido
        ) {
            manualClose();
            return;
        }
        // Borrar pedido completamente
        if (target.id === "btn-borrar-pedido") {
            // document.body.classList.remove("no-scroll");
            // console.log("antiguo removido")
            borrarPedido(); // primero vacías estado

            history.go(-2); // luego navegas correctamente

            return;
        }
    });
};

export const bindEventosPedido = () => {
    bindEventosProductos();
    bindEventosModal();
};

// !Generar mensaje de pedido WhatsApp
export const generarMensaje = () => {
    // 1. Usar totales ya calculados en el estado (Evitamos el bucle de cálculo)
    const { items, totalProductos, tipoEntrega, valorEntrega, direccion, metodoPago, notas, nombreCliente, telefono } = state;
    const itemsArray = Object.values(items);

    if (itemsArray.length === 0) return "";

    // 2. Acumulador de líneas
    const lineas = ["Hola, quiero realizar un pedido por favor:\n"];

    // 3. Generar cuerpo del mensaje
    itemsArray.forEach((item) => {
        if (item.cantidad <= 0) return;
        const subtotal = item.cantidad * item.precio;
        lineas.push(
            `• ${item.cantidad} x ${item.nombre} ($${subtotal.toLocaleString()})`,
        );
    });

    // 4. Totales
    const esDomicilio = tipoEntrega === "domicilio";
    const numEnvio = Number(valorEntrega);
    const esEnvioNumerico = !isNaN(numEnvio);

    lineas.push(``);
    if (esDomicilio) {
        // Si es un número, sumamos. Si es texto (Adicional), el total es solo el de productos.
        const totalSuma = Number(totalProductos) + (esEnvioNumerico ? numEnvio : 0);

        // Mostramos el valor tal cual (si es "Adicional" sale "Adicional", si es 5000 sale con formato)
        const envioTexto = esEnvioNumerico ? `$${numEnvio.toLocaleString()}` : valorEntrega;

        lineas.push(`*Envío:* ${envioTexto}`);
        lineas.push(`*Total:* $${totalSuma.toLocaleString()}`);

        if (!esEnvioNumerico) {
            lineas.push(`_Nota: El costo de envío se paga al domiciliario_`);
        }
        // const total = Number(totalProductos) + Number(valorEntrega);
        // lineas.push(`*Envío:* $${valorEntrega.toLocaleString()}`);
        // lineas.push(`*Total:* $${total.toLocaleString()}`);
    }else {
        lineas.push(`*Total:* $${totalProductos.toLocaleString()}`);
    }
    // 5. Pago y entrega
    lineas.push(`\n*Método de pago:* ${metodoPago}`);
    if(esDomicilio){
        lineas.push(`*Entrega:* Domicilio`);
    }else {
        lineas.push(`*Entrega:* Recogida en local`);
    }

    // 6. Datos entrega
    if(esDomicilio) lineas.push(`\n*Dirección:* ${direccion}`);
    lineas.push(`*Nombre:* ${nombreCliente}`);
    lineas.push(`*Teléfono:* ${telefono}`);
    if (notas) lineas.push(`*Notas:* ${notas}`);

    // 5. El "Único" String final
    return lineas.join("\n");
};

const whatsapp = document.querySelector("#datos").dataset.whatsapp;

export const hacerPedido = () => {
    // 1. Validación usando el estado derivado (O(1) vs O(n))
    if (state.totalItems === 0) {
        // En lugar de alert, podrías usar un toast o un mensaje en el DOM
        alert("Pedido vacío. Agrega algún producto antes de continuar.");
        return;
    }
    // 2.0 Validación de formulario
    const isValid = validarFormulario();
    if (!isValid) return;

    // // 2. Validación de dirección (Lógica de estado)
    // const esDomicilio = state.tipoEntrega === "domicilio";
    // const direccionVacia =
    //     !state.direccion || state.direccion.trim().length === 0;

    // if (esDomicilio && direccionVacia) {
    //     // Feedback visual inmediato
    //     checkoutDom.inputDireccion.focus(); // Mejor que scroll si es un input
    //     checkoutDom.inputDireccion.classList.add("invalid");
    //     checkoutDom.inputDireccion.scrollIntoView({
    //         behavior: "smooth",
    //         block: "center",
    //     });
    //     return;
    // }

    // 3. Generación de mensaje y envío
    const mensaje = generarMensaje();

    // Usamos encodeURIComponent solo al final para asegurar que caracteres
    // especiales como #, & o emojis no rompan la URL
    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`;

    // 4. Abrir WhatsApp
    window.open(url, "_blank");
};

export const bindCheckout = () => {
    checkoutDom.checkoutMain.addEventListener("change", (e) => {

		const target = e.target;
        const action = target.getAttribute("name");
        if (!action) return;

        if (action === "nombreCliente") {
            setNombreCliente(target.value);
        }

        if (action === "telefono") {
            setTelefono(target.value);
        }
        if (action === "entrega") {
            setTipoEntrega(target.value);
        }

        if (action === "direccion") {
            setDireccion(target.value);
        }
		if (action === "metodo-pago") {
			console.log("accion cambio forma pago")
            setMetodoPago(target.value);
        }
		if (action === "notas") {
            setNotas(target.value);
        }
        validarFormulario();
    });
	checkoutDom.btnHacerPedido.addEventListener("click", () => {
		hacerPedido();
	});

    document.getElementById("btn-cerrar-checkout").addEventListener("click", () => history.back());
};

export const bindEventosCheckout = () => {
    bindCheckout();
};
