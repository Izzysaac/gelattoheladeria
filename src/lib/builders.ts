// ==========================
// PAGE BUILDERS
// ==========================

export const buildMainPageData = ({ tenant, info, reviews, estilos }) => {
    return {
        head: buildHead(info),
        styles: buildStyles(estilos),
        header: buildHeader(info, reviews),
        buttonsList: buildButtonsList(info),
        footer: buildFooter(info),
        reviews: buildReviews(reviews),
    };
};

export const buildMenuPageData = ({ tenant, info, menu, reviews, estilos }) => {
    return {
        head: buildHead(info),
        styles: buildStyles(estilos),
        header: buildHeader(info, reviews),
        badges: buildBadges(info, reviews),
        contact: buildContact(info),
        menu: buildMenu(menu),
        categorias: buildCategorias(menu),
        footer: buildFooter(info),
    };
};

export const buildCheckoutPageData = ( {tenant, info, estilos}) => {
    return {
        head: buildHead(info),
        styles: buildStyles(estilos),
        contact: buildContact(info),
        metodosPago: buildMetodosPago(info),
    }
}

export const buildEventosPageData = ({ tenant, info, eventos, estilos }) => {
    return {
        head: buildEventosHead(info, eventos),
        styles: buildStyles(estilos),
        eventos: buildEvents(eventos),
        footer: buildFooter(info),
    };
};

export const buildTicketPageData = ({ tenant, info, menu }) => {
    return {
        menu: buildTicket(menu, info),
    };
};

// ==========================
// COMPONENT BUILDERS
// ==========================

const buildHead = (info) => {
    return {
        titulo: info.titulo,
        descripcion: info.descripcion,
        logo: info.logo,
        banner: info.banner,
        ogimage: info.ogimage,
    };
};

const buildEventosHead = (info, eventos) => {
    return {
        titulo: info.titulo,
        descripcion: info.descripcion,
        logo: info.logo,
        banner: info.banner,
        ogimage: info.ogimage,
        eventos: buildEvents(eventos)
    };
}

const extractWeight = (filename: string) => {
    const parts = filename.split("-");
    const weightPart = parts.find((part) =>
        /^\d+$/.test(part.replace(".woff2", "")),
    );
    return weightPart ? weightPart.replace(".woff2", "") : "400";
};

const extractFontName = (filename: string) => {
    // "poppins-regular-400.woff2" → "Poppins"
    // "roboto-bold-700.woff2" → "Roboto"
    // "crimson-text-bold-700.woff2" → "Crimson Text"
    if (!filename) return "System Font";
    
    // Extraer todo hasta el primer número (peso de la fuente)
    const fontParts = filename.split("-");
    const weightIndex = fontParts.findIndex((part) =>
        /^\d+$/.test(part.replace(".woff2", "")),
    );

    const fontNameParts =
        weightIndex > 0
            ? fontParts.slice(0, weightIndex)
            : fontParts.slice(0, -2);

    // Eliminar palabras de estilo (regular, bold, medium, etc.)
    const styleWords = [
        "light",
        "regular",
        "medium",
        "semibold",
        "bold",
        "black",
    ];
    const familyParts = fontNameParts.filter(
        (part) => !styleWords.includes(part.toLowerCase()),
    );

    // Convertir guiones a espacios y capitalizar cada palabra
    const fontName = familyParts
        .join(' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    // Agregar comillas si es nombre compuesto (contiene espacios)
    return fontName;
}

const buildStyles = (estilos) => {
    const fuenteRegular = estilos?.["fuente-regular"] ?? "";
    const fuenteMedium = estilos?.["fuente-medium"] ?? "";
    const fuenteSemibold = estilos?.["fuente-semibold"] ?? "";
    const fuenteBold = estilos?.["fuente-bold"] ?? "";
    const fuenteTitulo = estilos?.["fuente-titulo"] ?? "";

    const preload = [
        fuenteRegular,
        fuenteMedium,
        fuenteSemibold,
        fuenteBold,
        fuenteTitulo,
    ]
        .filter((name) => typeof name === "string" && name.trim().length > 0)
        .map((name) => {
            const fontName = extractFontName(name);
            const weight = extractWeight(name);
            return {
                href: `/fonts/${name.trim()}`,
                type: "font/woff2",
                crossOrigin: "anonymous",
                familyName: fontName,
                weight: weight,
            };
        });

    const fontFamilyRegular = extractFontName(fuenteRegular);
    const fontFamilyMedium = extractFontName(fuenteMedium);
    const fontFamilySemibold = extractFontName(fuenteSemibold);
    const fontFamilyBold = extractFontName(fuenteBold);
    const fontFamilyTitulo = extractFontName(fuenteTitulo);
    const fontFamily = preload.length
        ? `"${fontFamilyRegular}", system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
        : "Verdana, Geneva, Tahoma, sans-serif";

    return {
        fonts: {
            preload,
        },
        fontFamily,
        fontFamilyRegular,
        fontFamilyMedium,
        fontFamilySemibold,
        fontFamilyBold,
        fontFamilyTitulo,
    };
}

const buildHeader = (info, reviews) => {
    return {
        titulo: info.titulo,
        descripcion: info.descripcion,
        mainLogo: info.mainLogo,
        mainBanner: info.mainBanner,
        logo: buildLogo(info),
        banner: info.banner,
        background: info.background,
        auxiliarImg: info.auxiliarImg,
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

            // Verificar si hay horario específico o es texto especial
            if (typeof day?.horario === "string" && day.horario.trim()) {
                const horarioText = day.horario.trim();
                
                // Si no parece un formato de hora (no contiene ":"), tratar como texto especial
                if (!horarioText.includes(":")) {
                    return {
                        day: dayNumber,
                        ranges: [], // Array vacío para mantener consistencia
                        specialText: horarioText,
                    };
                }

                // Procesar rangos de tiempo normales
                for (const range of horarioText.split(",")) {
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
        whatsapp: info.whatsapp,
    };
};

const buildMetodosPago = (info) => {
    const metodosPagoString = info.metodosPago || "";
    
    // Convertir string separado por ; a array
    const metodosPagoArray = metodosPagoString
        .split(";")
        .map(metodo => metodo.trim())
        .filter(metodo => metodo.length > 0);
    
    // console.log

    return {
        metodosPago: metodosPagoArray,
    };
}

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

const buildTicket = (menu, info) => {
    const valorEntrega = info.valorEntrega;
    return menu.reduce((acc, item) => {
        // Extraemos el nombre para usarlo como clave y el resto como valor
        const { nombre, activo, ...rest } = item;

        // Solo agregamos el producto si está activo (opcional, basado en tu data)
        if (activo) {
            acc[nombre] = {
                ...rest,
            };
        }

        return acc;
    }, {valorEntrega});
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
        style: reviews.style?.design || "default",
    };
};

const buildEvents = (eventos) => {
    if (!eventos || !Array.isArray(eventos)) {
        return {
            principal: null,
            botones: [],
            contacto: null,
        };
    }

    const principal = eventos.find((evento) => evento.clave === "principal") || null;
    const botones = eventos.filter((evento) => evento.clave === "boton");
    const contacto = eventos.find((evento) => evento.clave === "contacto") || null;

    return {
        principal,
        botones,
        contacto
    };
};
