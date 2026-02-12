import { cargarState } from "./actions.js";
import { bindEventos } from "./events.js";
import { renderTodo } from "./render.js";

const init = () => {
  cargarState();
  bindEventos();
  renderTodo();
};

init();
