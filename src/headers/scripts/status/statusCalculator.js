import { DEFAULT_THRESHOLDS, STATUS } from "./constants.js";
import { getCurrentTimeInTimezone, timeToMinutes } from "./timeUtils.js";

const isTimeInRange = (currentMinutes, range) => {
	const openMinutes = timeToMinutes(range.open);
	const closeMinutes = timeToMinutes(range.close);
	// Logica para ver si el horario pasa al dia siguiente
	if (closeMinutes < openMinutes) {
		return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
	}
	// Logica para ver si el horario esta dentro del dia actual
	return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};

const findNextChange = (currentMinutes, ranges) => {
	let nextChange = { type: "", time: "", minutesUntil: 0 };
	let minMinutesUntil = Infinity;

	for (const range of ranges) {
		if (isTimeInRange(currentMinutes, range)) {
			const openMinutes = timeToMinutes(range.open);
			const closeMinutes = timeToMinutes(range.close);

			let minutesUntil;
			if (closeMinutes < openMinutes) {
				minutesUntil =
					currentMinutes >= openMinutes
						? 24 * 60 - currentMinutes + closeMinutes
						: closeMinutes - currentMinutes;
			} else {
				minutesUntil = closeMinutes - currentMinutes;
			}

			if (minutesUntil < minMinutesUntil) {
				minMinutesUntil = minutesUntil;
				nextChange = { type: "close", time: range.close, minutesUntil };
			}
		}
	}

	if (nextChange.type !== "") return nextChange;

	for (const range of ranges) {
		const openMinutes = timeToMinutes(range.open);
		const closeMinutes = timeToMinutes(range.close);

		if (closeMinutes < openMinutes) {
			if (currentMinutes < openMinutes) {
				const minutesUntil = openMinutes - currentMinutes;
				if (minutesUntil < minMinutesUntil) {
					minMinutesUntil = minutesUntil;
					nextChange = { type: "open", time: range.open, minutesUntil };
				}
			} else if (currentMinutes < closeMinutes) {
				const minutesUntil = closeMinutes - currentMinutes;
				if (minutesUntil < minMinutesUntil) {
					minMinutesUntil = minutesUntil;
					nextChange = { type: "close", time: range.close, minutesUntil };
				}
			}
		} else {
			if (currentMinutes < openMinutes) {
				const minutesUntil = openMinutes - currentMinutes;
				if (minutesUntil < minMinutesUntil) {
					minMinutesUntil = minutesUntil;
					nextChange = { type: "open", time: range.open, minutesUntil };
				}
			}
		}
	}

	return nextChange;
};

const getTodaySchedule = (schedule) => {
	const now = getCurrentTimeInTimezone(schedule.timezone);
	const dayOfWeek = now.getDay();

	if (schedule.specialDates) {
		const todayStr = now.toISOString().split("T")[0];
		const specialDate = schedule.specialDates.find((s) => s.date === todayStr);

		if (specialDate) {
			if (specialDate.ranges === "closed") {
				return {
					day: dayOfWeek,
					ranges: [],
					special: specialDate.note || "Cerrado por fecha especial",
				};
			}
			return { day: dayOfWeek, ranges: specialDate.ranges, special: specialDate.note };
		}
	}

	const todaySchedule = schedule.weekly.find((day) => day.day === dayOfWeek);
	return todaySchedule || null;
};

const getNextOpeningTime = (currentMinutes, currentDay, schedule) => {
	let nextOpening = null;
	let minTotalMinutesUntil = Infinity;

	// Bucle de 7 Días para buscar
	for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
		const checkDay = (currentDay + dayOffset) % 7;
		const daySchedule = schedule.weekly.find((day) => day.day === checkDay);
		if (!daySchedule || daySchedule.ranges.length === 0) continue;
		// Bucle de los horarios del día
		for (const range of daySchedule.ranges) {
			const openMinutes = timeToMinutes(range.open);
			let minutesUntil;

			// Si es el mismo día, buscar el horario más cercano al actual (continue de los pasados)
			if (dayOffset === 0) {
				if (currentMinutes >= openMinutes) continue;
				minutesUntil = openMinutes - currentMinutes;
			} else { // Si es otro día, suma en minutos los días pasados
				minutesUntil = dayOffset * 24 * 60 - currentMinutes + openMinutes;
			}

			if (minutesUntil < minTotalMinutesUntil) {
				minTotalMinutesUntil = minutesUntil;
				nextOpening = { time: range.open, minutesUntil, daysUntil: dayOffset };
			}
		}
	}

	return nextOpening;
};

export const calculateRestaurantStatus = (schedule, thresholds = DEFAULT_THRESHOLDS) => {
	const now = getCurrentTimeInTimezone(schedule.timezone);
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	const todaySchedule = getTodaySchedule(schedule);

	if (!todaySchedule || todaySchedule.ranges.length === 0) {
		const nextOpening = getNextOpeningTime(currentMinutes, now.getDay(), schedule);
		return {
			status:
				nextOpening && nextOpening.minutesUntil <= thresholds.openingSoon
					? STATUS.OPENING_SOON
					: STATUS.CLOSED,
			nextChange: nextOpening
				? {
						type: "open",
						time: nextOpening.time,
						minutesUntil: nextOpening.minutesUntil,
						daysUntil: nextOpening.daysUntil,
					}
				: null,
			todaySchedule,
			weeklySchedule: schedule.weekly,
		};
	}

	const openNow = todaySchedule.ranges.some((range) => isTimeInRange(currentMinutes, range));
	
	if (openNow) {
		const nextChange = findNextChange(currentMinutes, todaySchedule.ranges);
		let status = STATUS.OPEN;
		if (
			nextChange &&
			nextChange.type === "close" &&
			nextChange.minutesUntil <= thresholds.closingSoon
		) {
			status = STATUS.CLOSING_SOON;
		}
		return { status, nextChange, todaySchedule, weeklySchedule: schedule.weekly };
	}

	const nextOpening = getNextOpeningTime(currentMinutes, now.getDay(), schedule);
	let status = STATUS.CLOSED;
	if (nextOpening && nextOpening.minutesUntil <= thresholds.openingSoon) {
		status = STATUS.OPENING_SOON;
	}

	return {
		status,
		nextChange: nextOpening
			? {
					type: "open",
					time: nextOpening.time,
					minutesUntil: nextOpening.minutesUntil,
					daysUntil: nextOpening.daysUntil,
				}
			: null,
		todaySchedule,
		weeklySchedule: schedule.weekly,
	};
};
