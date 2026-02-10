const statusMsg = document.getElementById("statusMsg");
const sheduleMsg = document.getElementById("sheduleMsg");
const statusLight = document.getElementById("statusLight");
const shedule = JSON.parse(statusMsg.dataset.horario);

// Helper function to convert time string to minutes since midnight
const timeToMinutes = (time) => {
	const [hours, minutes] = time.split(":").map(Number);
	return hours * 60 + minutes;
};

// Helper function to convert minutes since midnight to HH:mm string
const minutesToTime = (minutes) => {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

// Helper function to get current time in specified timezone
const getCurrentTimeInTimezone = (timezone) => {
	return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
};

// Helper function to check if a time is within a range
const isTimeInRange = (currentMinutes, range) => {
	const openMinutes = timeToMinutes(range.open);
	const closeMinutes = timeToMinutes(range.close);

	// Handle ranges that cross midnight (close < open)
	if (closeMinutes < openMinutes) {
		// Range crosses midnight: open at 1:00 AM, close at 2:00 AM next day
		// Current time is within range if it's >= open minutes OR < close minutes
		return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
	} else {
		// Normal range: same day
		return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
	}
};

// Helper function to find next time change in a day's schedule
const findNextChange = (currentMinutes, ranges) => {
	let nextChange = {
		type: "",
		time: "",
		minutesUntil: 0,
	};
	let minMinutesUntil = Infinity;

	// First, check if we're currently in any range and find the next closing time
	for (const range of ranges) {
		if (isTimeInRange(currentMinutes, range)) {
			const openMinutes = timeToMinutes(range.open);
			const closeMinutes = timeToMinutes(range.close);

			let minutesUntil;
			if (closeMinutes < openMinutes) {
				// Range crosses midnight and we're in it
				if (currentMinutes >= openMinutes) {
					// Before midnight, closing is next day
					minutesUntil = 24 * 60 - currentMinutes + closeMinutes;
				} else {
					// After midnight, closing is today
					minutesUntil = closeMinutes - currentMinutes;
				}
			} else {
				// Normal range
				minutesUntil = closeMinutes - currentMinutes;
			}

			if (minutesUntil < minMinutesUntil) {
				minMinutesUntil = minutesUntil;
				nextChange = {
					type: "close",
					time: range.close,
					minutesUntil,
				};
			}
		}
	}

	// If we found a closing time, return it immediately
	if (nextChange.type !== "") {
		return nextChange;
	}

	// If not in any range, find the next opening time
	for (const range of ranges) {
		const openMinutes = timeToMinutes(range.open);
		const closeMinutes = timeToMinutes(range.close);

		// Handle ranges that cross midnight (close < open)
		if (closeMinutes < openMinutes) {
			// Range crosses midnight

			// Check if we're before opening time (same day)
			if (currentMinutes < openMinutes) {
				const minutesUntil = openMinutes - currentMinutes;
				if (minutesUntil < minMinutesUntil) {
					minMinutesUntil = minutesUntil;
					nextChange = {
						type: "open",
						time: range.open,
						minutesUntil,
					};
				}
			}
			// If we're after midnight but before close, this range already started
			else if (currentMinutes < closeMinutes) {
				// We're after midnight, this range is already open
				const minutesUntil = closeMinutes - currentMinutes;
				if (minutesUntil < minMinutesUntil) {
					minMinutesUntil = minutesUntil;
					nextChange = {
						type: "close",
						time: range.close,
						minutesUntil,
					};
				}
			}
		} else {
			// Normal range (same day)
			// Check if we're before opening time
			if (currentMinutes < openMinutes) {
				const minutesUntil = openMinutes - currentMinutes;
				if (minutesUntil < minMinutesUntil) {
					minMinutesUntil = minutesUntil;
					nextChange = {
						type: "open",
						time: range.open,
						minutesUntil,
					};
				}
			}
		}
	}

	return nextChange;
};

// Helper function to get today's schedule
const getTodaySchedule = (schedule) => {
	const now = getCurrentTimeInTimezone(schedule.timezone);
	const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

	// Check for special dates first
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
			return {
				day: dayOfWeek,
				ranges: specialDate.ranges,
				special: specialDate.note,
			};
		}
	}

	// Get regular weekly schedule
	const todaySchedule = schedule.weekly.find((day) => day.day === dayOfWeek);
	return todaySchedule || null;
};

// Helper function to get next opening time when closed
const getNextOpeningTime = (currentMinutes, currentDay, schedule) => {
	let nextOpening = null;
	let minTotalMinutesUntil = Infinity;

	// Check remaining days of the week
	for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
		const checkDay = (currentDay + dayOffset) % 7;
		const daySchedule = schedule.weekly.find((day) => day.day === checkDay);

		if (!daySchedule || daySchedule.ranges.length === 0) continue;

		for (const range of daySchedule.ranges) {
			const openMinutes = timeToMinutes(range.open);
			let minutesUntil;

			if (dayOffset === 0) {
				// Today - only consider future opening times
				if (currentMinutes >= openMinutes) {
					// This opening time has already passed, skip it
					continue;
				}
				minutesUntil = openMinutes - currentMinutes;
			} else {
				// Future days
				minutesUntil = dayOffset * 24 * 60 - currentMinutes + openMinutes;
			}

			if (minutesUntil < minTotalMinutesUntil) {
				minTotalMinutesUntil = minutesUntil;
				nextOpening = {
					time: range.open,
					minutesUntil,
					daysUntil: dayOffset,
				};
			}
		}
	}
	return nextOpening;
};

// Main function to calculate restaurant status
const calculateRestaurantStatus = (
	schedule,
	thresholds = { closingSoon: 60, openingSoon: 60 },
) => {
	const now = getCurrentTimeInTimezone(schedule.timezone);
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	const todaySchedule = getTodaySchedule(schedule);

	if (!todaySchedule || todaySchedule.ranges.length === 0) {
		// Restaurant is closed today
		const nextOpening = getNextOpeningTime(
			currentMinutes,
			now.getDay(),
			schedule,
		);

		return {
			status:
				nextOpening && nextOpening.minutesUntil <= thresholds.openingSoon
					? "openingSoon"
					: "closed",
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

	// Check if currently open
	const isOpen = todaySchedule.ranges.some((range) =>
		isTimeInRange(currentMinutes, range),
	);

	if (isOpen) {
		// Find next closing time
		const nextChange = findNextChange(currentMinutes, todaySchedule.ranges);
		console.log("findNextChange result:", nextChange);

		let status = "open";
		if (
			nextChange &&
			nextChange.type === "close" &&
			nextChange.minutesUntil <= thresholds.closingSoon
		) {
			status = "closingSoon";
		}

		return {
			status,
			nextChange,
			todaySchedule,
			weeklySchedule: schedule.weekly,
		};
	} else {
		// Currently closed, find next opening time
		const nextOpening = getNextOpeningTime(
			currentMinutes,
			now.getDay(),
			schedule,
		);
		let status = "closed";
		if (nextOpening && nextOpening.minutesUntil <= thresholds.openingSoon) {
			status = "openingSoon";
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
	}
};

// Helper function for formatting time remaining
const formatTimeRemaining = (minutes) => {
	if (minutes < 60) {
		return `${minutes} min`;
	} else if (minutes < 24 * 60) {
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return remainingMinutes > 0
			? `${hours}h ${remainingMinutes}m`
			: `${hours}h`;
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
};

// Helper function to convert 24h time to 12h AM/PM format
const formatTime12Hour = (time24) => {
	const [hours, minutes] = time24.split(":").map(Number);
	const period = hours >= 12 ? "p.m." : "a.m.";
	const hours12 = hours % 12 || 12; // Convert 0 to 12
	return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

// Helper function to get Spanish day name for future days
const getSpanishDayName = (daysFromNow) => {
	const days = [
		"domingo",
		"lunes",
		"martes",
		"miércoles",
		"jueves",
		"viernes",
		"sábado",
	];
	const now = new Date();
	const futureDate = new Date(
		now.getTime() + daysFromNow * 24 * 60 * 60 * 1000,
	);
	return days[futureDate.getDay()];
};

// Helper function to get status display text
const getStatusDisplayText = (status, nextChange) => {
	if (!nextChange) return "";

	const time12Hour = formatTime12Hour(nextChange.time);
	const daysUntil = nextChange.daysUntil || 0;

	switch (status) {
		case "open":
			if (daysUntil === 0) {
				return `Abierto · Cierra a las ${time12Hour}`;
			} else if (daysUntil === 1) {
				return `Abierto · Cierra mañana a las ${time12Hour}`;
			} else {
				const dayName = getSpanishDayName(daysUntil);
				return `Abierto · Cierra el ${dayName} a las ${time12Hour}`;
			}
		case "closed":
			if (daysUntil === 0) {
				return `Cerrado · Abre a las ${time12Hour}`;
			} else if (daysUntil === 1) {
				return `Cerrado · Abre mañana a las ${time12Hour}`;
			} else {
				const dayName = getSpanishDayName(daysUntil);
				return `Cerrado · Abre el ${dayName} a las ${time12Hour}`;
			}
		case "closingSoon":
			return `Cierra en ${formatTimeRemaining(nextChange?.minutesUntil || 0)} (${time12Hour})`;
		case "openingSoon":
			return `Abre en ${formatTimeRemaining(nextChange?.minutesUntil || 0)} (${time12Hour})`;
		default:
			return "";
	}
};

// Helper function to get status color for UI
const getStatusColor = (status) => {
	switch (status) {
		case "open":
			return "open";
		case "closed":
			return "closed";
		case "closingSoon":
			return "closing-soon";
		case "openingSoon":
			return "opening-soon";
		default:
			return "text-gray-600 bg-gray-50 border-gray-200";
	}
};

const hightlightCurrentDay = () => {
    const today = new Date().getDay();
    const todayElement = document.querySelector(`[data-day="${today}"]`);
    if (todayElement) {
        todayElement.classList.add("currentDayHightlight");
    }
};

export const updateStatus = () => {
    const status = calculateRestaurantStatus(shedule);
    const mensaje = getStatusDisplayText(status.status, status.nextChange);
    const statusClass = getStatusColor(status.status);
    
    statusMsg.textContent = mensaje;
	sheduleMsg.textContent = mensaje;
	statusLight.classList.add(statusClass);
	hightlightCurrentDay();
}