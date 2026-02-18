export const dom = {
    /* Productos del menu (en build) */
    productos: document.querySelectorAll(".producto"),
    menu: document.getElementById("menu"),

    /* Sticky bar */
    stickyBarPedido: document.getElementsByClassName("stickybar-pedido")[0],
    btnPaginaPedido: document.getElementById("btn-pagina-pedido"),
    btnVerPedido: document.getElementById("btn-ver-pedido"),
    btnHacerCheckout: document.getElementById("btn-hacer-checkout"),
    resumenTotal: document.querySelectorAll(".barra-resumen-total"),
    resumenCantidad: document.querySelectorAll(".barra-resumen-cantidad"),


    /* Modal ver pedido */
    modalVerPedido: document.getElementById("modal-pedido"),
    modalBorrarPedido: document.getElementById("modal-borrar-pedido"),
    listaPedido: document.getElementById("lista-pedido"),
    templatePedidoProducto: document.getElementById("item-pedido-template"),

    /* Image Viewer */
    imageViewer: document.getElementById("imageViewer"),
    imageViewerImg: document.getElementById("imageViewerImg"),
    imageViewerCloseBtn: document.getElementById("imageViewerCloseBtn"),

    /* Datos */
    datos: document.getElementById("datos")
};


export const checkoutDom = {
     /* Seleccion de tipo de entrega*/
    checkoutMain: document.getElementById("checkoutMain"),
    entregaProducto: document.getElementById("entrega-producto"),
    radios: document.querySelectorAll('input[name="entrega"]'),
    divInputDireccion: document.querySelector("#campo-direccion"),

    inputDireccion: document.getElementById("input-direccion"),  
    formaPago: document.getElementById("forma-pago"),
    notas: document.getElementById("notas"),

    envioPedido: document.getElementById("envioPedido"),
    resumenPedido: document.getElementById("resumenPedido"),
    totalPedido: document.getElementById("totalPedido"),
    btnHacerPedido: document.getElementById("btn-hacer-pedido"),
}