import { background } from "@cloudinary/url-gen/qualifiers/focusOn";

export const mapCMS = (cms) => {

    const menu = mapMenu(cms.menu);
    const groups = mapGroups(cms.groups);
    const options = mapOptions(cms.options);

    const products = normalizeProducts(menu, groups, options);
    const productsMap = Object.fromEntries(products.map(p => [p.id, p])
);

    return {
        info: cms.info ? mapInfo(cms.info) : null,
        menu: products,
        menuMap: productsMap,
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
        ogimage: getSingle("ogimage"),
        background: getSingle("background"),
        auxiliarImg: getSingle("auxiliar-img"),
        telefono: getSingle("telefono"),
        whatsapp: getSingle("whatsapp"),
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

type MenuItem = {
    id: string;
    nombre: string;
    categoria: string;
    descripcion?: string;
    precio: number;
    imagen?: string;
    activo: boolean;
    group_ids?: string[];
};

type Group = {
    group_id: string;
    nombre: string;
    descripcion?: string;
    tipo: "single" | "multiple";
    min: number;
    max: number;
    required: boolean;
    allow_repetition: boolean;
};

type Option = {
    option_id: string;
    group_id: string;
    nombre: string;
    descripcion?: string;
    precio_extra: number;
    activo: boolean;
};

export function normalizeProducts(
    menu: MenuItem[],
    groups: Group[],
    options: Option[]
) {

    // 🔹 1. indexar grupos
    const groupsMap: Record<string, Group> = {};
    groups.forEach(g => {
        groupsMap[g.group_id] = g;
    });

    // 🔹 2. agrupar opciones por group_id
    const optionsByGroup: Record<string, Option[]> = {};
    options.forEach(opt => {
        if (!opt.activo) return;

        if (!optionsByGroup[opt.group_id]) {
            optionsByGroup[opt.group_id] = [];
        }

        optionsByGroup[opt.group_id].push({
            ...opt,
            precio_extra: Number(opt.precio_extra || 0),
        });
    });

    // 🔹 3. construir productos finales (🔥 cambio aquí)
    const products = menu
        .filter(p => p.activo)
        .map(p => {
            const groupIds = p.group_ids || [];
            const groupsFinal = groupIds
                .map((gid: string) => {
                    const g = groupsMap[gid];
                    if (!g) return null;

                    return {
                        id: g.group_id,
                        nombre: g.nombre,
                        tipo: g.tipo,
                        min: Number(g.min),
                        max: Number(g.max),
                        required: Boolean(g.required),
                        allow_repetition: Boolean(g.allow_repetition),
                        options: optionsByGroup[g.group_id] || [],
                    };
                })
                .filter(Boolean); // elimina nulls

            return {
                ...p,
                precio: Number(p.precio || 0),

                groups: groupsFinal,

                hasVariants: groupsFinal.length > 0,
            };
        });

    return products;
}

const mapMenu = (menuRaw: any[]) => {
    return menuRaw
        .filter((row) => row.nombre) // evita filas vacías
        .map((row) => ({
            categoria: row.categoria?.trim() || "Sin categoría",

            id: row.id?.trim() || "",

            nombre: row.nombre?.trim() || "",

            descripcion: row.descripcion?.trim() || "",

            precio: Number(row.precio) || 0,

            imagen: row.imagen?.trim() || "",

            activo: Boolean(row.activo && String(row.activo).trim() !== ""),

            group_ids: row.group_ids
                ? row.group_ids.split(";").map((g: string) => g.trim())
                : [],
        }));
};

const mapGroups = (groupsRaw: any[]) => {
    return groupsRaw
        .filter((row) => row.nombre) // evita filas vacías
        .map((row) => ({

            group_id: row.group_id?.trim() || "",

            nombre: row.nombre?.trim() || "",

            descripcion: row.descripcion?.trim() || "",

            tipo: row.tipo?.trim() || "",

            min: Number(row.min) || 0,

            max: Number(row.max) || 0,

            required: Boolean(row.required && String(row.required).trim() !== ""),

            allow_repetition: Boolean(row.allow_repetition && String(row.allow_repetition).trim() !== ""),

            // activo: Boolean(row.activo && String(row.activo).trim() !== ""),
        }));
};

const mapOptions = (optionsRaw: any[]) => {
    return optionsRaw
        .filter((row) => row.nombre) // evita filas vacías
        .map((row) => ({
            option_id: row.option_id?.trim() || "",
            group_id: row.group_id?.trim() || "",
            nombre: row.nombre?.trim() || "",
            descripcion: row.descripcion?.trim() || "",
            precio_extra: Number(row.precio_extra) || 0,
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
            if (tipo == "style") {
                
                acc.style[row.clave] = row.valor || "default";
            }
            // console.log(acc)
            return acc;
        },
        { meta: {}, reviews: [], style: {} },
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

            galeria: row.galeria
				? row.galeria.split(";")
						.map((m) => m.trim())
						.filter((m) => m)
				: [],
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
