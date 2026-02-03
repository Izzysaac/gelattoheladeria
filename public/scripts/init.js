import { cargarState } from "./actions.js";
import { bindEventos } from "./events.js";
import { renderTodo } from "./render.js";

export const init = () => {
    cargarState();
    bindEventos();
    renderTodo();
};
