
const sections = document.querySelectorAll(".grupo[id]");
const navLinks = document.querySelectorAll(".category-nav a");

const linkById = {};
navLinks.forEach((link) => {
    const category = link.getAttribute("data-category");
    linkById[(category)] = link;
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
            activeLink.nextElementSibling?.classList.add(
                "linea-activa",
            );
            // centrar en el nav
            activeLink.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            });
        });
    },
    {
        rootMargin: "-30% 0px -50% 0px", // zona “activa revisar bugs”
        threshold: 0,
    },
);

sections.forEach((section) => observer.observe(section));
