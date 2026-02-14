const info = document.getElementById("informacion");
const infoBtn = document.getElementById("infoBtn");
const closeInfoBtn = document.getElementById("closeInfoBtn");

infoBtn.addEventListener("click", () => info.showModal());
info.addEventListener("click", (e) => {if (e.target  === info) info.close()});
closeInfoBtn.addEventListener("click", () => info.close());

