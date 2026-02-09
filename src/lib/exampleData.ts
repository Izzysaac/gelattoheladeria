import type { RestaurantSchedule, StatusThresholds } from './types';

// Example restaurant schedule for testing
export const exampleRestaurantSchedule: RestaurantSchedule = {
    weekly: [
        {
            day: 0, // Sunday
            ranges: [
                { open: '11:00', close: '15:00' },
                { open: '18:00', close: '22:00' }
            ]
        },
        {
            day: 1, // Monday
            ranges: [
                { open: '11:00', close: '15:00' },
                { open: '18:00', close: '22:00' }
            ]
        },
        {
            day: 2, // Tuesday
            ranges: [
                { open: '01:00', close: '15:00' },
                { open: '18:00', close: '22:00' }
            ]
        },
        {
            day: 3, // Wednesday
            ranges: [
                { open: '11:00', close: '15:00' },
                { open: '18:00', close: '22:00' }
            ]
        },
        {
            day: 4, // Thursday
            ranges: [
                { open: '11:00', close: '15:00' },
                { open: '18:00', close: '22:00' }
            ]
        },
        {
            day: 5, // Friday
            ranges: [
                { open: '11:00', close: '15:00' },
                { open: '18:00', close: '23:00' }
            ]
        },
        {
            day: 6, // Saturday
            ranges: [
                { open: '11:00', close: '15:00' },
                { open: '18:00', close: '23:00' }
            ]
        }
    ],
    specialDates: [
        {
            date: '2024-12-25',
            ranges: 'closed',
            note: 'Cerrado por Navidad'
        },
        {
            date: '2024-01-01',
            ranges: 'closed',
            note: 'Cerrado por Año Nuevo'
        }
    ],
    timezone: 'America/Bogota'
};

export const exampleThresholds: StatusThresholds = {
    closingSoon: 60, // 60 minutes before closing
    openingSoon: 60  // 60 minutes before opening
};

export const exampleAddress = 'Calle Ejemplo #123, Colonia Centro, Ciudad de México';
