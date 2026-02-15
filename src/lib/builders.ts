// ==========================
// PAGE BUILDERS
// ==========================

export const buildMainPageData = ({ tenant, info, reviews }) => {
    return {
        head: buildHead(info),
        header: buildHeader(info, reviews),
        buttonsList: buildButtonsList(info),
        footer: buildFooter(info),
        reviews: buildReviews(reviews),
    };
};

export const buildMenuPageData = ({ tenant, info, menu, reviews }) => {
    return {
        head: buildHead(info),
        header: buildHeader(info, reviews),
        badges: buildBadges(info, reviews),
        contact: buildContact(info),
        menu: buildMenu(menu),
        categorias: buildCategorias(menu),
        footer: buildFooter(info),
    };
};

export const buildCheckoutPageData = ( {tenant, info}) => {
    return {
        head: buildHead(info),
        contact: buildContact(info),
    }
}

// ==========================
// COMPONENT BUILDERS
// ==========================

const buildHead = (info) => {
    return {
        titulo: info.titulo,
        descripcion: info.descripcion,
        logo: info.logo,
        banner: info.banner,
    };
};

const buildHeader = (info, reviews) => {
    return {
        titulo: info.titulo,
        descripcion: info.descripcion,
        logo: buildLogo(info),
        banner: info.banner,
        horario: buildHorario(info.horario),
        direccion: info.direccion,
        telefono: info.telefono,
        correo: info.correo,
        socials: info.socials,
    };
};

const buildBadges = (info, reviews) => {
    return {
        tiempoEntrega: info.tiempoEntrega,
        valorEntrega: info.valorEntrega,
        userRatingCount: Number(reviews.meta?.userRatingCount) || 0,
        rating: Number(reviews.meta?.rating) || 0,
    }
}

const buildHorario = (horario) => {
    if (!horario || !Array.isArray(horario)) {
        return {
            weekly: [],
            timezone: "America/Bogota",
        };
    }

    const dayMap = {
        lunes: 1,
        martes: 2,
        miercoles: 3,
        jueves: 4,
        viernes: 5,
        sabado: 6,
        domingo: 0,
    };

    const weeklySchedule = horario
        .map((day) => {
            const dayNumber = dayMap[day.valor.toLowerCase()];
            if (dayNumber === undefined) return null;

            const timeRanges = [];

            if (typeof day?.horario === "string" && day.horario.trim()) {
                for (const range of day.horario.split(",")) {
                    const parts = range.trim().split("-");

                    if (parts.length !== 2) continue;

                    const open = parts[0]?.trim();
                    const close = parts[1]?.trim();

                    if (open && close) {
                        timeRanges.push({ open, close });
                    }
                }
            }

            return {
                day: dayNumber,
                ranges: timeRanges,
            };
        })
        .filter((day) => day !== null);

    return {
        weekly: weeklySchedule,
        timezone: "America/Bogota",
    };
};

const buildFooter = (info) => {
    return {
        titulo: info.titulo,
        direccion: info.direccion,
        telefono: info.telefono,
    };
};

const buildButtonsList = (info) => {
    return {
        direccion: info.direccion,
        telefono: info.telefono,
        correo: info.correo,
        botones: info.botones,
        socials: info.socials,
    };
};

const buildContact = (info) => {

    return {
        direccion: info.direccion[0].valor,
        telefono: info.telefono,
    };
};

const buildLogo = (info) => {
    return {
        titulo: info.titulo,
        logo: info.logo,
    };
};

const buildMenu = (menu) => {
    const grouped = {};

    menu.forEach((item) => {
        const cat = item.categoria || "Otros";

        if (!grouped[cat]) {
            grouped[cat] = [];
        }

        grouped[cat].push(item);
    });

    return grouped;
};

const buildCategorias = (menu) => {
    const categorias = new Set();

    menu.forEach((item) => {
        categorias.add(item.categoria || "Otros");
    });

    return Array.from(categorias);
};

const buildReviews = (reviews) => {
    if (!reviews) {
        return {
            userRatingCount: 0,
            rating: 0,
            reviewsUrl: "",
            reviews: [],
        };
    }

    return {
        userRatingCount: Number(reviews.meta?.userRatingCount) || 0,
        rating: Number(reviews.meta?.rating) || 0,
        reviewsUrl: reviews.meta?.reviewsUrl || "",
        reviews: reviews.reviews || [],
    };
};
