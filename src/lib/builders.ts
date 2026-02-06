// ==========================
// PAGE BUILDERS
// ==========================

export function buildMainPageData({ tenant, info }) {
    return {
        head: buildHead(info),
        header: buildHeader(info, tenant),
        footer: buildFooter(info),
    };
}

export function buildMenuPageData({ tenant, info, menu }) {
    return {
        head: buildHead(info),
        contact: buildContact(info),
        logo: buildLogo(info),
        menu: buildMenu(menu),
        categorias: buildCategorias(menu),
        footer: buildFooter(info),
    };
}

// ==========================
// COMPONENT BUILDERS
// ==========================

const buildHead = (info) => {
    return {
        titulo: info.titulo,
        descripcion: info.descripcion,
        logo: info.logo,
    };
};

const buildHeader = (info, tenant) => {
    return {
        titulo: info.titulo,
        descripcion: info.descripcion,
        logo: buildLogo(info),
        botones: info.botones,
        socials: info.socials,
        // whatsapp: tenant.features.whatsapp
    };
};

const buildFooter = (info) => {
    return {
        titulo: info.titulo,
        direccion: info.direccion,
        telefono: info.telefono,
    };
};

const buildContact = (info) => {

    return {
        direccion: info.direccion,
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
