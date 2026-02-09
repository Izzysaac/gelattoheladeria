import type { TenantConfig } from "./types";

import { CMS_CACHE } from "@lib/cmsCache";

export async function loadCMS(tenant: TenantConfig) {
    CMS_CACHE.clear();
    if (CMS_CACHE.has(tenant.nameId)) {
        return CMS_CACHE.get(tenant.nameId);
    }

    const hojas = ["info", "menu"];
    if (tenant.features.reviews) hojas.push("reviews");

    const sheets = await Promise.all(
        hojas.map((hoja) => loadSheet(tenant.sheetId, tenant.nameId, hoja)),
    );

    const cms = Object.fromEntries(hojas.map((hoja, i) => [hoja, sheets[i]]));

    CMS_CACHE.set(tenant.nameId, cms);

    return cms;
}

async function loadSheet(sheetId: string, nameId: string, hoja: string) {
    const url = `https://opensheet.elk.sh/${sheetId}/${nameId}-${hoja}`;

    const res = await fetch(url);

    if (!res.ok) throw new Error(`Sheet fetch failed: ${url}`);

    return await res.json();
}
