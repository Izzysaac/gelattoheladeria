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


const controlAction = (action, productId) => {

    if (!productId) return;

    switch (action) {
        case "add-product":
            updateCantidad(productId, 1);
            break;
        case "remove-product":
            updateCantidad(productId, -1);
            break;
        default:
            return;
    }
};

export const bindEventosProductos = () => {
    //* Abrir modal de pedido
    dom.btnVerPedido.addEventListener("click", () => openModal("pedido", dom.modalVerPedido));

    //* Acciones de producto (menu)
    dom.menu.addEventListener("click", (e) => {
        const target = e.target;
        const action = target.getAttribute("data-action");
        if (!action) return;
        const productId = target.getAttribute("data-productid");
        controlAction(action, productId);
    });

    //* Acciones de producto (cart)
    dom.listaPedido.addEventListener("click", (e) => {
        const target = e.target;
        const action = target.getAttribute("data-action");
        if (!action) return;
        const productId = target.getAttribute("data-productid");
        controlAction(action, productId);
    });

    setValorEntrega(dom.datos.dataset.valorentrega);
};

export const bindEventosVariants = () => {

    dom.variantsDialog.addEventListener("click", (e) => {
        if (e.target === dom.variantsDialog) dom.variantsDialog.close();
    });
    dom.variantsBackButton.addEventListener("click", dom.variantsDialog.close());
};

export const bindEventosCart = () => {
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
            if (state.totalItems === 0) {
                alert("Pedido vacío. Agrega algún producto antes de continuar.");
                return;
            }
            window.location.href = "/checkout";
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
            borrarPedido(); // primero vacías estado
            history.go(-2); // luego navegas correctamente
            return;
        }
    });
};

export const bindEventosPedido = () => {
    bindEventosProductos();
    bindEventosCart();
    bindEventosVariants();
};


/* ========== CHECKOUT ========== */

const whatsapp = document.querySelector("#datos").dataset.whatsapp;

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
	checkoutDom.btnHacerPedido.addEventListener("click", hacerPedido());
    document.getElementById("btn-cerrar-checkout").addEventListener("click", () => history.back());
};

export const bindEventosCheckout = () => bindCheckout();
