import type { 
    RestaurantSchedule, 
    RestaurantStatusInfo, 
    RestaurantStatus, 
    DaySchedule, 
    TimeRange, 
    StatusThresholds 
} from './types';

// Helper function to convert time string to minutes since midnight
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Helper function to convert minutes since midnight to HH:mm string
function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Helper function to get current time in specified timezone
function getCurrentTimeInTimezone(timezone: string): Date {
    return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
}

// Helper function to check if a time is within a range
function isTimeInRange(currentMinutes: number, range: TimeRange): boolean {
    const openMinutes = timeToMinutes(range.open);
    const closeMinutes = timeToMinutes(range.close);
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

// Helper function to find next time change in a day's schedule
function findNextChange(
    currentMinutes: number, 
    ranges: TimeRange[]
): { type: 'open' | 'close'; time: string; minutesUntil: number } | null {
    let nextChange: { type: 'open' | 'close'; time: string; minutesUntil: number } | null = null;
    let minMinutesUntil = Infinity;

    for (const range of ranges) {
        const openMinutes = timeToMinutes(range.open);
        const closeMinutes = timeToMinutes(range.close);

        // Check if we're before opening time
        if (currentMinutes < openMinutes) {
            const minutesUntil = openMinutes - currentMinutes;
            if (minutesUntil < minMinutesUntil) {
                minMinutesUntil = minutesUntil;
                nextChange = {
                    type: 'open',
                    time: range.open,
                    minutesUntil
                };
            }
        }
        // Check if we're before closing time but after opening
        else if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
            const minutesUntil = closeMinutes - currentMinutes;
            if (minutesUntil < minMinutesUntil) {
                minMinutesUntil = minutesUntil;
                nextChange = {
                    type: 'close',
                    time: range.close,
                    minutesUntil
                };
            }
        }
    }

    return nextChange;
}

// Helper function to get today's schedule
function getTodaySchedule(schedule: RestaurantSchedule): DaySchedule | null {
    const now = getCurrentTimeInTimezone(schedule.timezone);
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Check for special dates first
    if (schedule.specialDates) {
        const todayStr = now.toISOString().split('T')[0];
        const specialDate = schedule.specialDates.find(s => s.date === todayStr);
        
        if (specialDate) {
            if (specialDate.ranges === 'closed') {
                return {
                    day: dayOfWeek,
                    ranges: [],
                    special: specialDate.note || 'Cerrado por fecha especial'
                };
            }
            return {
                day: dayOfWeek,
                ranges: specialDate.ranges,
                special: specialDate.note
            };
        }
    }
    
    // Get regular weekly schedule
    const todaySchedule = schedule.weekly.find(day => day.day === dayOfWeek);
    return todaySchedule || null;
}

// Helper function to get next opening time when closed
function getNextOpeningTime(
    currentMinutes: number,
    currentDay: number,
    schedule: RestaurantSchedule
): { time: string; minutesUntil: number; daysUntil: number } | null {
    let nextOpening: { time: string; minutesUntil: number; daysUntil: number } | null = null;
    let minTotalMinutesUntil = Infinity;

    // Check remaining days of the week
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDay = (currentDay + dayOffset) % 7;
        const daySchedule = schedule.weekly.find(day => day.day === checkDay);
        
        if (!daySchedule || daySchedule.ranges.length === 0) continue;

        for (const range of daySchedule.ranges) {
            const openMinutes = timeToMinutes(range.open);
            let minutesUntil: number;
            
            if (dayOffset === 0) {
                // Today
                minutesUntil = currentMinutes < openMinutes ? openMinutes - currentMinutes : (24 * 60) - currentMinutes + openMinutes;
            } else {
                // Future days
                minutesUntil = (dayOffset * 24 * 60) - currentMinutes + openMinutes;
            }

            if (minutesUntil < minTotalMinutesUntil) {
                minTotalMinutesUntil = minutesUntil;
                nextOpening = {
                    time: range.open,
                    minutesUntil,
                    daysUntil: dayOffset
                };
            }
        }
    }

    return nextOpening;
}

// Main function to calculate restaurant status
export function calculateRestaurantStatus(
    schedule: RestaurantSchedule,
    thresholds: StatusThresholds = { closingSoon: 60, openingSoon: 60 }
): RestaurantStatusInfo {
    const now = getCurrentTimeInTimezone(schedule.timezone);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const todaySchedule = getTodaySchedule(schedule);

    if (!todaySchedule || todaySchedule.ranges.length === 0) {
        // Restaurant is closed today
        const nextOpening = getNextOpeningTime(currentMinutes, now.getDay(), schedule);
        
        return {
            status: nextOpening && nextOpening.minutesUntil <= thresholds.openingSoon ? 'openingSoon' : 'closed',
            nextChange: nextOpening ? {
                type: 'open',
                time: nextOpening.time,
                minutesUntil: nextOpening.minutesUntil
            } : null,
            todaySchedule,
            weeklySchedule: schedule.weekly
        };
    }

    // Check if currently open
    const isOpen = todaySchedule.ranges.some(range => isTimeInRange(currentMinutes, range));
    
    if (isOpen) {
        // Find next closing time
        const nextChange = findNextChange(currentMinutes, todaySchedule.ranges);
        
        let status: RestaurantStatus = 'open';
        if (nextChange && nextChange.type === 'close' && nextChange.minutesUntil <= thresholds.closingSoon) {
            status = 'closingSoon';
        }

        return {
            status,
            nextChange,
            todaySchedule,
            weeklySchedule: schedule.weekly
        };
    } else {
        // Currently closed, find next opening time
        const nextOpening = getNextOpeningTime(currentMinutes, now.getDay(), schedule);
        
        let status: RestaurantStatus = 'closed';
        if (nextOpening && nextOpening.minutesUntil <= thresholds.openingSoon) {
            status = 'openingSoon';
        }

        return {
            status,
            nextChange: nextOpening ? {
                type: 'open',
                time: nextOpening.time,
                minutesUntil: nextOpening.minutesUntil
            } : null,
            todaySchedule,
            weeklySchedule: schedule.weekly
        };
    }
}

// Helper function for formatting time remaining
export function formatTimeRemaining(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    } else if (minutes < 24 * 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else {
        const days = Math.floor(minutes / (24 * 60));
        const remainingMinutes = minutes % (24 * 60);
        if (remainingMinutes < 60) {
            return `${days}d ${remainingMinutes}m`;
        } else {
            const hours = Math.floor(remainingMinutes / 60);
            return `${days}d ${hours}h`;
        }
    }
}

// Helper function to get status display text
export function getStatusDisplayText(status: RestaurantStatus, nextChange: RestaurantStatusInfo['nextChange']): string {
    switch (status) {
        case 'open':
            return 'Abierto';
        case 'closed':
            return 'Cerrado';
        case 'closingSoon':
            return `Cierra en ${formatTimeRemaining(nextChange?.minutesUntil || 0)}`;
        case 'openingSoon':
            return `Abre en ${formatTimeRemaining(nextChange?.minutesUntil || 0)}`;
        default:
            return '';
    }
}

// Helper function to get status color for UI
export function getStatusColor(status: RestaurantStatus): string {
    switch (status) {
        case 'open':
            return 'text-green-600 bg-green-50 border-green-200';
        case 'closed':
            return 'text-red-600 bg-red-50 border-red-200';
        case 'closingSoon':
            return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'openingSoon':
            return 'text-blue-600 bg-blue-50 border-blue-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
}
