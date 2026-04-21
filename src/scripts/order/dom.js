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
    datos: document.getElementById("datos"),

    /* Variants */
    variantsDialog: document.getElementById("variants-dialog"),
    variantsProductName: document.getElementById("variants-product-name"),
    variantsProductDescription: document.getElementById("variants-product-description"),
    variantsProductImage: document.getElementById("variants-product-image"),
    variantsProductPrice: document.getElementById("variants-product-price"),
    variantsForm: document.getElementById("variants-form"),
    variantsCloseButton: document.getElementById("variants-close-button"),
    variantsBackButton: document.getElementById("variants-back-button"),
    variantsAddButton: document.getElementById("variants-add-button"),
};


export const checkoutDom = {
    /* Seleccion de tipo de entrega*/
    checkoutMain: document.getElementById("checkoutMain"),
    entregaProducto: document.getElementById("entrega-producto"),
    radios: document.querySelectorAll('input[name="entrega"]'),
    divInputDireccion: document.querySelector("#campo-direccion"),
    inputDireccion: document.getElementById("input-direccion"),  

    // envioPedidoContainer: document.getElementById("envioPedidoContainer"),
    // envioPedido: document.getElementById("envioPedido"),
    // resumenPedido: document.getElementById("resumenPedido"),
    // totalPedido: document.getElementById("totalPedido"),



    btnHacerPedido: document.getElementById("btn-hacer-pedido"),
    estadoFormulario: document.getElementById("estadoFormulario"),

    // Nuevo checkout
    // FORMULARIO
    nombreCliente: document.getElementById("nombreClienteForm"),
    telefono: document.getElementById("telefonoForm"),
    direccion: document.getElementById("direccionForm"),
    metodoPago: document.getElementById("metodoPagoForm"),
    notas: document.getElementById("notasForm"),


    orderSummaryItems: document.getElementById("orderSummaryItems"),
    orderSummaryProductsTotal: document.getElementById("orderSummaryProductsTotal"),
    orderSummaryShipping: document.getElementById("orderSummaryShipping"),
    orderSummaryGrandTotal: document.getElementById("orderSummaryGrandTotal"),
    orderSummaryFinalTotal: document.getElementById("orderSummaryFinalTotal")
}