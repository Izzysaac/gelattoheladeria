const divisions = [
    { amount: 30, name: "days" },
    { amount: 12, name: "months" },
    { amount: Infinity, name: "years" },
];

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const now = new Date();

const timeAgo = (dateString) => {
    const past = new Date(dateString);
    const diffSeconds = Math.floor((past - now) / 86400000);

    let duration = diffSeconds;
    for (const division of divisions) {
        if (Math.abs(duration) < division.amount) {
            return rtf.format(Math.trunc(duration), division.name);
        }
        duration /= division.amount;
    }
};

const times = document.getElementsByTagName("time");

for (const time of times) {
    time.textContent = timeAgo(time.dataset.time);
}

//! Mirar un mejor refactoring
document.querySelectorAll("[data-clamp]").forEach((el) => {
    const boton = el.nextElementSibling;
    if (!boton) return;

    requestAnimationFrame(() => {
        if (el.scrollHeight > el.clientHeight) {
            boton.hidden = false;
        }
    });

    boton.addEventListener("click", () => {
        const expandido = el.classList.toggle("line-clamp-none");

        boton.textContent = expandido ? "Ver menos" : "Ver más";
        boton.setAttribute("aria-expanded", expandido);
    });
});
