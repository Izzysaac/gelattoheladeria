export const state = {
	items: {},
	totalItems: 0,
	totalProductos: 0,
	valorEntrega: 0,
	nombreCliente: "",
	telefono: "",
	tipoEntrega: "domicilio", // "domicilio" | "recoger"
	direccion: "",
	metodoPago: "Efectivo", // "efectivo" | "tarjeta"
	notas: "",
};

const STORAGE_KEY = "pedido_state";

export const guardarState = () =>
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

export const cargarState = () => {
	const stateStorage = localStorage.getItem(STORAGE_KEY);

	if (stateStorage) {
		const stateParseado = JSON.parse(stateStorage);
		state.items = stateParseado.items || {};
		state.totalItems = stateParseado.totalItems || 0;
		state.totalProductos = stateParseado.totalProductos || 0;
		state.valorEntrega = stateParseado.valorEntrega || 0;
		state.nombreCliente = stateParseado.nombreCliente || "";
		state.telefono = stateParseado.telefono || "";
		state.tipoEntrega = stateParseado.tipoEntrega || null;
		state.direccion = stateParseado.direccion || "";
		state.metodoPago = stateParseado.metodoPago || null;
		state.notas = stateParseado.notas || "";
	}
};
