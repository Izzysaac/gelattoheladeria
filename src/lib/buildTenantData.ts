import { loadTenant } from "./loadTenant";
import { loadCMS } from "./loadCMS";
import { mapInfo, mapMenu } from "./mappers";
import { buildMenuPageData, buildMainPageData } from "./builders";

export async function buildTenantData(page: string) {

    const tenant = loadTenant();

    const cms = await loadCMS(tenant);

    // 🧠 mappers aquí (una sola vez)
    const info = mapInfo(cms.info);
    const menu = mapMenu(cms.menu);


    // 🧠 registry de builders
    const builders = {
        main: () =>
            buildMainPageData({
                tenant,
                info,
            }),

        menu: () =>
            buildMenuPageData({
                tenant,
                info,
                menu,
            }),

        pedido: () =>
            buildMenuPageData({
                tenant,
                info,
                menu,
            }),
    };

    const builder = builders[page];

    return {
        tenant,
        data: builder ? builder() : {},
    };
}
