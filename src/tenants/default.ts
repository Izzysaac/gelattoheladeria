import type { TenantConfig } from "../lib/types";

const config: TenantConfig = {
    name: "Restaurante",
    theme: "default",
    pages: {
        menu: true,
        pedido: true,
        reserva: true
    },
    layout: {
        heroVariant: "default",
    },
    features: {
        whatsapp: true,
        promo: false,
        reserva: false,
    },
};

export default config;
