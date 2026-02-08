import { state } from "./state.js";

const STORAGE_KEY = "pedido_state";

const guardar = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

export const cargarState = () => {
  const stateStorage = localStorage.getItem(STORAGE_KEY);

  if (stateStorage) {
    const stateParseado = JSON.parse(stateStorage);
    state.items = stateParseado.items || {};
    state.tipoEntrega = stateParseado.tipoEntrega || null;
    state.direccion = stateParseado.direccion || "";
  }
  // Object.assign(state, JSON.parse(saved));
}; //! REVISAR SI SON EQUIVALENTES (basicamente llena variable state con datos de localsorage)

export const updateCantidad = (producto, delta) => {
  const { nombre, precio, imagen, descripcion } = producto;
  // Si el producto no existe aún en el estado, lo inicializamos
  if (!state.items[nombre]) {
    state.items[nombre] = {
      nombre,
      precio,
      imagen,
      descripcion,
      cantidad: 0,
    };
  }
  // Actualizamos la cantidad
  const nuevaCantidad = state.items[nombre].cantidad + delta;

  // Si llega a 0 o menos, eliminamos el producto del pedido
  if (nuevaCantidad <= 0) {
    delete state.items[nombre];
  } else {
    state.items[nombre].cantidad = nuevaCantidad;
  }

  guardar();
};

export const borrarPedido = () => {
  state.items = {};
  guardar();
};

export const setTipoEntrega = (tipo) => {
  state.tipoEntrega = tipo;
  guardar();
};

export const setDireccion = (dir) => {
  state.direccion = dir;
  guardar();
};
