import { loadTenant } from "./loadTenant";
import { loadCMS } from "./loadCMS";
import { mapCMS } from "./mappers";
import { buildMenuPageData, buildMainPageData, buildCheckoutPageData, buildEventosPageData } from "./builders";

import type { PageType } from "./types";

// relaciona nombre de pagina con funcion constructora
const PAGE_BUILDERS: Record<PageType, (params: any) => any> = {
    main: ({ tenant, info, reviews, estilos }) =>
        buildMainPageData({ tenant, info, reviews, estilos }),
    menu: ({ tenant, info, menu, reviews, estilos }) =>
        buildMenuPageData({ tenant, info, menu, reviews, estilos }),
    pedido: ({ tenant, info, menu, reviews, estilos }) =>
        buildMenuPageData({ tenant, info, menu, reviews, estilos }),
    checkout: ({ tenant, info, estilos }) => buildCheckoutPageData({ tenant, info, estilos }),
    eventos: ({ tenant, info, eventos, estilos  }) =>
        buildEventosPageData({ tenant, info, eventos, estilos }),
};

export async function buildTenantData(page: PageType) {
    const tenant = loadTenant();

    const cms = await loadCMS(tenant);

    const mappedCMS = mapCMS(cms);

    const builderStrategy = PAGE_BUILDERS[page];

    if (!builderStrategy) {
        console.warn(`No existe builder para la pagina ${page}`);
        return { tenant, data: {} };
    }

    const pageData = builderStrategy({ tenant, ...mappedCMS, estilos: mappedCMS.estilos });


    return {
        tenant,
        data: pageData,
    };
}
