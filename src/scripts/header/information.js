import { openModal, manualClose } from "../modal.js";

const info = document.getElementById("informacion");
const infoBtn = document.getElementById("infoBtn");
const closeInfoBtn = document.getElementById("closeInfoBtn");

infoBtn?.addEventListener("click", () => openModal("info", info));
info.addEventListener("click", (e) => {if (e.target  === info) manualClose()});
closeInfoBtn.addEventListener("click", () => manualClose());

