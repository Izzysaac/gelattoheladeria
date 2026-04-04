const menuData = document.getElementById('menu-container');
const menu = JSON.parse(menuData.dataset.menu);

const { valorEntrega, ...productos } = menu;

// Import dinámico de productos
export const PRODUCTOS_CONFIG = productos;

const pagoExterno = !isNaN(valorEntrega);

export const DELIVERY = pagoExterno ? valorEntrega : 0;

