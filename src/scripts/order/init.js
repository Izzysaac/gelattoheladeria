import { cargarState } from "../state.js";
import { bindEventosPedido } from "./events.js";
import { renderTodo } from "./render.js";

const init = () => {
  cargarState();
  bindEventosPedido();
  renderTodo();
};

init();
