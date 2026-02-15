export const state = {
	items: {},
	totalItems: 0,
	totalPrecio: 0,
	tipoEntrega: "domicilio", // "domicilio" | "recoger"
	direccion: "",
	formaPago: "efectivo", // "efectivo" | "tarjeta"
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
		state.totalPrecio = stateParseado.totalPrecio || 0;
		state.tipoEntrega = stateParseado.tipoEntrega || null;
		state.direccion = stateParseado.direccion || "";
		state.formaPago = stateParseado.formaPago || null;
		state.notas = stateParseado.notas || "";
	}
};
