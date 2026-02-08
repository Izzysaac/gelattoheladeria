import type { TenantConfig } from "./types";

export function loadTenant(): TenantConfig {
    const pagesEnv = (import.meta.env.PAGES || "")
        .split(",")
        .map((p: string) => p.trim());

    const featuresEnv = (import.meta.env.FEATURES || "")
        .split(",")
        .map((f: string) => f.trim());

    return {
        nameId: import.meta.env.NAME_ID,

        sheetId: import.meta.env.GOOGLE_SHEET_ID,

        theme: import.meta.env.THEME || "default",

        cloudinaryCloudName: import.meta.env.CLOUDINARY_CLOUD_NAME,

        pages: {
            menu: true,
            pedido: true,
            reserva: pagesEnv.includes("reserva"),
        },

        features: {
            whatsapp: featuresEnv.includes("whatsapp"),
            reviews: featuresEnv.includes("reviews"),
            reserva: featuresEnv.includes("reserva"),
        },

        layout: {
            heroVariant: "default",
        },
    };
}
