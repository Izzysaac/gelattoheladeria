const grupos = {
    bebidas: [
        "Ensaladas Gelattos",
        "Copas de Helado",
        "Otras Delicias",
        "Bebidas",
    ],
    comidas: [
        "Hamburgesas",
        "Patacones",
        "Salchichapapas",
        "Hot Dog",
        "Sandwiches",
        "Picadas",
        "Menú Infantil",
    ],
};

let activeGroup = "bebidas";

const navMenu = document.getElementById("navMenu");
const navList = navMenu.querySelector("ul");
const groupButtons = document.querySelectorAll("[data-group]");

// 🔹 ESTO LO HACEMOS REACTIVO
let navLinks = [];
let linkById = {};

function rebuildNav() {
    const categorias = grupos[activeGroup];

    // reconstruir HTML
    navList.innerHTML = categorias
        .map(
            (cat) => `
      <li>
        <button data-category="${cat}" data-scroll>
          ${cat}
        </button>
        <div class="linea"></div>
      </li>
    `,
        )
        .join("");

    // 🔹 RE-SELECT (CLAVE)
    navLinks = navMenu.querySelectorAll("button");

    // 🔹 RECONSTRUIR MAPA
    linkById = {};
    navLinks.forEach((link) => {
        const category = link.getAttribute("data-category");
        linkById[category] = link;
    });
}

// 🔘 CLICK EN GRUPOS
groupButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        activeGroup = btn.dataset.group;

        // UI activa
        groupButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        rebuildNav();
        filterSections(); // 🔥 AQUÍ
        // 👉 scroll al primer elemento del grupo (sección real)
        const first = grupos[activeGroup][0];
        const section = document.getElementById(first);
        if (section) {
            section.scrollIntoView({ behavior: "auto" });
        }
    });
});

// 🔹 TU LÓGICA ORIGINAL (CASI INTACTA)

const sections = document.querySelectorAll(".grupo[id]");

navMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.getAttribute("data-category");
    if (!id) return;

    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "auto" });
});

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const id = entry.target.id;
            const activeLink = linkById[id];

            if (!activeLink) return;

            // limpiar estados previos
            navLinks.forEach((l) => {
                l.classList.remove("active");
                l.nextElementSibling?.classList.remove("linea-activa");
            });

            // marcar activo
            activeLink.classList.add("active");
            activeLink.nextElementSibling?.classList.add("linea-activa");

            // centrar en el nav
            activeLink.scrollIntoView({
                behavior: "auto",
                inline: "center",
                block: "nearest",
            });
        });
    },
    {
        rootMargin: "-30% 0px -50% 0px",
        threshold: 0,
    },
);

sections.forEach((section) => observer.observe(section));

function filterSections() {
    const sections = document.querySelectorAll(".grupo");

    sections.forEach((section) => {
        const id = section.id;

        if (grupos[activeGroup].includes(id)) {
            section.style.display = "";
        } else {
            section.style.display = "none";
        }
    });
}

// 🔹 INIT
rebuildNav();
filterSections();
