export type PageType = "main" | "menu" | "pedido" | "checkout" | "eventos" | "ticket" ;

export type Pages = {
    menu: boolean;
    pedido: boolean;
    reserva: boolean;
    eventos: boolean;
    ticket: boolean;
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
        mainLayout: "default" | "bg-image";
        headerVariant: "default" | "nobanner" | "broaster" | "centered";
        menuHeaderVariant: "default" | "broaster";
        eventosVariant: "default" | "classic";
    };
    features: Features;
};

// Restaurant Status Badge Types
export type RestaurantStatus = 'open' | 'closed' | 'closingSoon' | 'openingSoon';

export type TimeRange = {
    open: string; // HH:mm format
    close: string; // HH:mm format
};

export type DaySchedule = {
    day: number; // 0-6 (Sunday-Saturday)
    ranges: TimeRange[];
    special?: string; // For special notes like "Cerrado por festivo"
};

export type WeeklySchedule = DaySchedule[];

export type RestaurantSchedule = {
    weekly: WeeklySchedule;
    specialDates?: Array<{
        date: string; // YYYY-MM-DD
        ranges: TimeRange[] | 'closed';
        note?: string;
    }>;
    timezone: string;
};

export type StatusThresholds = {
    closingSoon: number; // minutes before closing
    openingSoon: number; // minutes before opening
};

export type RestaurantStatusInfo = {
    status: RestaurantStatus;
    nextChange: {
        type: 'open' | 'close';
        time: string; // HH:mm
        minutesUntil: number;
    } | null;
    todaySchedule: DaySchedule | null;
    weeklySchedule: WeeklySchedule;
};
