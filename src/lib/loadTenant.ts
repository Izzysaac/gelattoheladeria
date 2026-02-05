import defaultConfig from "../tenants/default";
import type { TenantConfig } from "./types";

export async function loadTenant(): Promise<TenantConfig> {
    // base desde default
    const base = structuredClone(defaultConfig);

    // paginas desde ENV
    const pagesEnv = (import.meta.env.PAGES || "").split(",");
    base.pages.reserva = pagesEnv.includes("reserva");

    // features desde ENV
    const featuresEnv = (import.meta.env.FEATURES || "").split(",");
    base.features.whatsapp = featuresEnv.includes("whatsapp");
    base.features.promo = featuresEnv.includes("promo");
    base.features.reserva = featuresEnv.includes("reservas");

    return base;
}
