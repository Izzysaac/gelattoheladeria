export const mapCMS = (cms) => {



    return {
        info: cms.info ? mapInfo(cms.info) : null,
        menu: cms.menu ? mapMenu(cms.menu) : null,
        reviews: cms.reviews ? mapReviews(cms.reviews) : null,
        eventos: cms.eventos ? mapEventos(cms.eventos) : null,
        estilos: cms.estilos ? mapEstilos(cms.estilos) : null,
    };
};

//** titulo, descripcion, logo, banner, telefono, tiempoEntrega, valorEntrega
//** [direccion{valor, url}], [horario{valor, horario}],[botones{valor, url}], socials[{valor, url}]
const mapInfo = (infoRaw: any[]) => {
    // 🔵 agrupar por clave
    const grouped = infoRaw.reduce((acc: Record<string, any[]>, row) => {
        if (!row?.clave) return acc;

        if (!acc[row.clave]) {
            acc[row.clave] = [];
        }

        acc[row.clave].push({
            valor: row.valor ?? "",
            ...(row.clave == "horario" && { horario: row.horario ?? null }),
            ...(row.clave !== "horario" && { url: row.url ?? null }),
        });

        return acc;
    }, {});

    // 🔵 helpers
    const getSingle = (key: string) => grouped[key]?.[0]?.valor ?? "";

    const getList = (key: string) => grouped[key] ?? [];

    // 🔵 resultado final limpio
    return {
        titulo: getSingle("titulo"),
        descripcion: getSingle("descripcion"),
        mainBanner: getSingle("banner"),
        mainLogo: getSingle("logo"),
        banner: getSingle("banner"),
        logo: getSingle("logo"),
        telefono: getSingle("telefono"),
        correo: getSingle("correo"),
        tiempoEntrega: getSingle("tiempo-entrega"),
        valorEntrega: getSingle("valor-entrega"),
        metodosPago: getSingle("metodos-pago"),

        direccion: getList("direccion"),
        horario: getList("horario"),
        botones: getList("boton"),
        socials: getList("social"),
    };
};

//* [menu{categoia, nombre, descripcion, precio, imagen, activo}]
const mapMenu = (menuRaw: any[]) => {
    return menuRaw
        .filter((row) => row.nombre) // evita filas vacías
        .map((row) => ({
            categoria: row.categoria?.trim() || "Sin categoría",

            nombre: row.nombre?.trim() || "",

            descripcion: row.descripcion?.trim() || "",

            precio: Number(row.precio) || 0,

            imagen: row.imagen?.trim() || "",

            activo: Boolean(row.activo && String(row.activo).trim() !== ""),
        }));
};

// * meta{total, promedio}, [reseña{nombre, fecha, puntuacion, perfil, texto, referencia}]
const mapReviews = (reviewsRaw: any[]) => {
    return reviewsRaw.reduce(
        (acc, row) => {
            const tipo = String(row.tipo || "").toLowerCase();

            if (tipo === "meta" && row.clave) {
                acc.meta[row.clave] = isNaN(row.valor)
                    ? row.valor
                    : Number(row.valor);
            }

            if (tipo === "review") {
                acc.reviews.push({
                    authorName: row.authorName || "",
                    publishTime: row.publishTime || "",
                    rating: Number(row.rating) || 0,
                    text: row.text || "",
                    authorPhoto: row.authorPhoto || null,
                    referencia: row.referencia || null,
                });
            }

            return acc;
        },
        { meta: {}, reviews: [] },
    );
};

const mapEventos = (eventosRaw: any[]) => {
    if (!Array.isArray(eventosRaw)) return [];

    return eventosRaw
        .filter((row) => row.clave)
        .map((row) => ({
            clave: row.clave?.trim() || "Sin calve",

            nombre: row.nombre?.trim() || "",

            descripcion: row.descripcion?.trim() || "",

            media: row.media?.trim() || "",
        }));
};

export const mapMenuDescription = (menuRaw: any[]) => {
    return menuRaw
        .filter((row) => row.nombre) // evita filas vacías
        .map((row) => ({
            categoria: row.categoria?.trim() || "Sin categoría",

            nombre: row.nombre?.trim() || "",

            descripcion: row.descripcion?.trim() || "",
        }));
};

export const mapEstilos = (estilosRaw: any[]) => {
    if (!Array.isArray(estilosRaw)) return {};

    const estilos = estilosRaw
        .filter((row) => row?.clave || row?.clave)
        .reduce((acc: Record<string, string>, row) => {
            const key = String(row.clave || row.clave || "").trim();
            const value = String(row.valor || "").trim();

            if (!key) return acc;
            acc[key] = value;
            return acc;
        }, {});

    return estilos;
};
