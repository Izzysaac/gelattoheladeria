import { loadTenant } from "./loadTenant";
import { loadCMS } from "./loadCMS";
import { mapCMS } from "./mappers";
import { buildMenuPageData, buildMainPageData } from "./builders";

import type { PageType } from "./types";

// relaciona nombre de pagina con funcion constructora
const PAGE_BUILDERS: Record<PageType, (params: any) => any> = {
    main: ({ tenant, info, reviews }) =>
        buildMainPageData({ tenant, info, reviews }),
    menu: ({ tenant, info, menu }) => buildMenuPageData({ tenant, info, menu }),
    pedido: ({ tenant, info, menu }) =>
        buildMenuPageData({ tenant, info, menu }),
};

export async function buildTenantData(page: string) {
    const tenant = loadTenant();

    const cms = await loadCMS(tenant);

    const mappedCMS = mapCMS(cms);

    const builderStrategy = PAGE_BUILDERS[page];

    if (!builderStrategy) {
        console.warn(`No existe builder para la pagina ${page}`);
        return { tenant, data: {} };
    }

    const pageData = builderStrategy({ tenant, ...mappedCMS });

    return {
        tenant,
        data: pageData,
    };
}
