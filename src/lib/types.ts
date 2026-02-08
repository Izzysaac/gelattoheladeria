export type PageType = "main" | "menu" | "pedido";

export type Pages = {
    menu: boolean;
    pedido: boolean;
    reserva: boolean;
};

export type Features = {
    whatsapp: boolean;
    reviews: boolean;
    reserva: boolean;
};

export type TenantConfig = {
    nameId: string;
    sheetId: string;
    cloudinaryCloudName: string;
    theme: string;
    pages: Pages;
    layout: {
        heroVariant: "default" | "image-left" | "centered";
    };
    features: Features;
};
