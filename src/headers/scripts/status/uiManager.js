import { SPANISH_DAY_NAMES, STATUS_CLASS } from "./constants.js";
import { formatTime12Hour, formatTimeRemaining } from "./timeUtils.js";

const getSpanishDayName = (daysFromNow) => {
	const now = new Date();
	const futureDate = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
	return SPANISH_DAY_NAMES[futureDate.getDay()];
};

export const getStatusDisplayText = (status, nextChange) => {
	if (!nextChange) return "";

	const time12Hour = formatTime12Hour(nextChange.time);
	const daysUntil = nextChange.daysUntil || 0;

	switch (status) {
		case "open":
			if (daysUntil === 0) return `Abierto · Cierra a las ${time12Hour}`;
			if (daysUntil === 1) return `Abierto · Cierra mañana a las ${time12Hour}`;
			return `Abierto · Cierra el ${getSpanishDayName(daysUntil)} a las ${time12Hour}`;
		case "closed":
			if (daysUntil === 0) return `Cerrado · Abre a las ${time12Hour}`;
			if (daysUntil === 1) return `Cerrado · Abre mañana a las ${time12Hour}`;
			return `Cerrado · Abre el ${getSpanishDayName(daysUntil)} a las ${time12Hour}`;
		case "closingSoon":
			return `Cierra en ${formatTimeRemaining(nextChange?.minutesUntil || 0)} (${time12Hour})`;
		case "openingSoon":
			return `Abre en ${formatTimeRemaining(nextChange?.minutesUntil || 0)} (${time12Hour})`;
		default:
			return "";
	}
};

export const getStatusClass = (status) => {
	return STATUS_CLASS[status] || "";
};

export const highlightCurrentDay = (scheduleListEl) => {
	const today = new Date().getDay();
	const todayElement = scheduleListEl 
		? scheduleListEl.querySelector(`[data-day="${today}"]`)
		: document.querySelector(`[data-day="${today}"]`);
	if (todayElement) todayElement.classList.add("currentDayHightlight");
};

export const applyStatusToDom = ({ message, statusClass, statusMsgEl, statusLightEl }) => {
	if (statusMsgEl) statusMsgEl.textContent = message;
	if (statusLightEl && statusClass) {
		statusLightEl.classList.remove("open", "closed", "closing-soon", "opening-soon");
		statusLightEl.classList.add(statusClass);
	}
};