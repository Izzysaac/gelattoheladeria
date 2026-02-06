export const dom = {
    /* Productos del menu (en build) */
    productos: document.querySelectorAll(".producto"),
    menu: document.getElementById("menu"),

    /* Sticky bar */
    stickyBar: document.getElementById("stickybar"),
    btnPaginaPedido: document.getElementById("btn-pagina-pedido"),
    btnVerPedido: document.getElementById("btn-ver-pedido"),
    btnHacerPedido: document.getElementById("btn-hacer-pedido"),
    resumenesPedido: document.querySelectorAll("#barra-resumen"),

    /* Modal ver pedido */
    modalVerPedido: document.getElementById("modal-pedido"),
    modalBorrarPedido: document.getElementById("modal-borrar-pedido"),
    listaPedido: document.getElementById("lista-pedido"),
    templatePedidoProducto: document.getElementById("item-pedido-template"),

    /* Seleccion de tipo de entrega*/
    entregaProducto: document.getElementById("entrega-producto"),
    radios: document.querySelectorAll('input[name="entrega"]'),
    divInputDireccion: document.querySelector("#campo-direccion"),
    inputDireccion: document.getElementById("input-direccion"),

    /* Image Viewer */
    dialogImageViewer: document.getElementById("dialogImageViewer"),
    dialogImageViewerImg: document.getElementById("imageViewerImg"),
    dialogImageViwerCloseBtn: document.getElementById("dialogImageViewerClose"),
};
