const menuData = document.getElementById('menu-container');
const menu = JSON.parse(menuData.dataset.menu);

const { valorEntrega, ...productos } = menu;
// Import dinámico de productos
export const PRODUCTOS_CONFIG = productos;


// export const PRODUCTOS_CONFIG = {
//     Ideal: {
//         precio: 13000,
//         categoria: "Combos",
//         descripcion:
//             "2 presas (no pechuga) · 2 arepas · papas francesa · salsas · gaseosa",
//         imagen: "combo-ideal_ptzwrc",
//     },
//     "3 Alas + Gaseosa": {
//         precio: 14000,
//         categoria: "Combos",
//         descripcion: "3 Alas braster · 2 arepas · papas francesa",
//         imagen: "combo-3-alas_munz50",
//     },
//     "3 Alas en Salsa + Gaseosa": {
//         precio: 17000,
//         categoria: "Combos",
//         descripcion:
//             "3 Alas · Bañadas en salsa elije: BBQ o miel mostaza · papas francesa",
//         imagen: "combo-3-alas_munz50",
//     },
//     "4 Presas": {
//         precio: 23000,
//         categoria: "Combos",
//         descripcion:
//             "· 4 Presas (Pechuga, Muslo, Ala y Cuadro) · 3 Arepas · Papas francesa · Salsas",
//         imagen: "combo-4--presas_rcuvpg",
//     },
//     Familiar: {
//         precio: 43000,
//         categoria: "Combos",
//         descripcion:
//             "8 Presas · 6 Arepas · Papas a la francesa · Ensalada · Salsas",
//         imagen: "Combo-familiar_ow9mlu",
//     },
//     "Super Familiar": {
//         precio: 63000,
//         categoria: "Combos",
//         descripcion:
//             "12 Presas · 10 Arepas · 2 Porciones de Papas Francesa · Ensalada · Salsas",
//         imagen: "combo-superfamiliar_xwkeov",
//     },
//     Trocipollo: {
//         precio: 14000,
//         categoria: "Combos",
//         descripcion:
//             "8 Tiras de Pechuga Apanada · 2 Arepas y Papas Francesa · Gaseosa · Salsas",
//         imagen: "trocipollos_jmnrm5",
//     },
//     "Trocipollo Max": {
//         precio: 20000,
//         categoria: "Combos",
//         descripcion:
//             "16 Tiras de Pechuga Apanada · 2 Arepas y Papas Francesa · Gaseosa · Salsas",
//         imagen: "trocipollos_jmnrm5",
//     },
//     "Broaster Sándwich": {
//         precio: 17000,
//         categoria: "Combos",
//         descripcion:
//             "Pollo Apanado · queso · cebolla caramelizada · ensalada de la casa · papas francesa",
//         imagen: "sandwich_gj8dah",
//     },
//     "Cono Trosipollo + Ala": {
//         precio: 18000,
//         categoria: "Combos ",
//         descripcion:
//             "Porcioón de tiras de pechuga apanada + 1 ala + papas francesa + arepa + gaseosa",
//         imagen: "cono-trocipollo_y4clhx",
//     },
//     Ala: {
//         precio: 4500,
//         categoria: "Presas",
//         descripcion: "Ala · 1 Arepa · Papas Francesa · Salsas",
//         imagen: "Ala_i0zmhs",
//     },
//     ContraMuslo: {
//         precio: 6000,
//         categoria: "Presas",
//         descripcion: "ContraMuslo · 1 Arepa · Papas Francesa · Salsas",
//         imagen: "Contramuslo_i6j5uf",
//     },
//     Muslo: {
//         precio: 5500,
//         categoria: "Presas",
//         descripcion: "Muslo · 1 Arepa · Papas Francesa · Salsas",
//         imagen: "muslo_dts3vj",
//     },
//     "1/2 Pechuga": {
//         precio: 8500,
//         categoria: "Presas",
//         descripcion: "1/2 Pechuga · 1 Arepa · Papas Francesa · Salsas",
//         imagen: "Combo-familiar_ow9mlu",
//     },
//     "Papas francesa": {
//         precio: 6000,
//         categoria: "Otros",
//         descripcion: "",
//     },
//     "Arepas x 3 uds.": {
//         precio: 1500,
//         categoria: "Otros",
//         descripcion: "",
//     },
//     "Ensalada de la casa": {
//         precio: 3000,
//         categoria: "Otros",
//         descripcion: "",
//     },
//     "Salsa BBQ miel pequeña": {
//         precio: 1000,
//         categoria: "Salsas",
//         descripcion: "",
//     },
//     "Salsa BBQ miel grande": {
//         precio: 2000,
//         categoria: "Salsas",
//         descripcion: "",
//     },
//     "Salsa miel mostaza pequeña": {
//         precio: 1000,
//         categoria: "Salsas",
//         descripcion: "",
//     },
//     "Salsa miel mostaza grande": {
//         precio: 2000,
//         categoria: "Salsas",
//         descripcion: "",
//     },
//     "Condor personal": {
//         precio: 2000,
//         categoria: "Bebidas",
//         descripcion: "",
//     },
//     "Condor personal": {
//         precio: 2000,
//         categoria: "Bebidas",
//         descripcion: "",
//     },
//     "Condor 1L": {
//         precio: 3500,
//         categoria: "Bebidas",
//         descripcion: "",
//     },
//     "Condor 2L": {
//         precio: 5500,
//         categoria: "Bebidas",
//         descripcion: "",
//     },
//     "Coca Cola personal": {
//         precio: 4000,
//         categoria: "Bebidas",
//         descripcion: "",
//     },
//     "Coca Cola 1.5 L": {
//         precio: 7000,
//         categoria: "Bebidas",
//         descripcion: "",
//     },
//     "Agua personal": {
//         precio: 2000,
//         categoria: "Bebidas",
//         descripcion: "",
//     },
//     "Jugo Del Valle 400ml": {
//         precio: 2500,
//         categoria: "Bebidas",
//         descripcion: "",
//     },
//     "Jugo Hit personal": {
//         precio: 3500,
//         categoria: "Bebidas",
//         descripcion: "",
//     },
// };
const pagoExterno = !isNaN(valorEntrega);

export const DELIVERY = pagoExterno ? valorEntrega : 0;

