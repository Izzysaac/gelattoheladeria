import { loadTenant } from "./loadTenant";
import { loadCMS } from "./loadCMS";
import { mapCMS } from "./mappers";
import { buildMenuPageData, buildMainPageData, buildCheckoutPageData, buildEventosPageData, buildTicketPageData } from "./builders";
// import {data} from "./datagelattos.js";
import type { PageType } from "./types";

// relaciona nombre de pagina con funcion constructora
const PAGE_BUILDERS: Record<PageType, (params: any) => any> = {
    main: ({ tenant, info, reviews, estilos }) =>
        buildMainPageData({ tenant, info, reviews, estilos }),
    menu: ({ tenant, info, menu, menuMap, reviews, estilos }) =>
        buildMenuPageData({ tenant, info, menu, menuMap, reviews, estilos }),
    pedido: ({ tenant, info, menu, menuMap, reviews, estilos }) =>
        buildMenuPageData({ tenant, info, menu, menuMap, reviews, estilos }),
    checkout: ({ tenant, info, estilos }) => buildCheckoutPageData({ tenant, info, estilos }),
    eventos: ({ tenant, info, eventos, estilos  }) =>
        buildEventosPageData({ tenant, info, eventos, estilos }),
    ticket: ({ tenant, info, menu, menuMap  }) =>
        buildTicketPageData({ tenant, info, menu, menuMap })
};

export async function buildTenantData(page: PageType) {
    const tenant = loadTenant();

    const cms = await loadCMS(tenant);
    // console.log(cms);
    const mappedCMS = mapCMS(cms);

    const builderStrategy = PAGE_BUILDERS[page];

    if (!builderStrategy) {
        console.warn(`No existe builder para la pagina ${page}`);
        return { tenant, data: {} };
    }

    // console.log(mappedCMS);

    const pageData = builderStrategy({ tenant, ...mappedCMS, estilos: mappedCMS.estilos });


    return {
        tenant,
        data: pageData,
    };
}
