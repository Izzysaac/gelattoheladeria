import type { TenantConfig } from "./types";

const CMS_CACHE = new Map<string, any>();

export async function loadCMS(tenant: TenantConfig) {

    if (CMS_CACHE.has(tenant.nameId)) {
        return CMS_CACHE.get(tenant.nameId);
    }

    async function loadSheet(sheetId: string, nameId: string, hoja: string) {
        const url = `https://opensheet.elk.sh/${sheetId}/${nameId}-${hoja}`;

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`Sheet fetch failed: ${url}`);
        }

        return await res.json();
    }

    const [infoRaw, menuRaw] = await Promise.all([
        loadSheet(tenant.sheetId, tenant.nameId,"info"),
        loadSheet(tenant.sheetId, tenant.nameId,"menu"),
    ]);

    const data = {
        info: infoRaw,
        menu: menuRaw,
    };

    CMS_CACHE.set(tenant.nameId, data);

    return data;
}
