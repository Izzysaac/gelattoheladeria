import { calculateRestaurantStatus } from "./statusCalculator.js";
import { getStatusClass, getStatusDisplayText, applyStatusToDom, highlightCurrentDay } from "./uiManager.js";

const getDomRefs = () => {
	return {
		statusLightEl: document.getElementById("statusLight"),
		statusMsgEl: document.getElementById("statusMsg"),
		scheduleMsgEl: document.getElementById("sheduleMsg"),
	};
};

const parseSchedule = (statusMsgEl) => {
	if (!statusMsgEl) return null;
	const raw = statusMsgEl.dataset.horario;
	if (!raw) return null;
	return JSON.parse(raw);
};

export const updateStatus = ({ schedule, dom } = {}) => {
	const { statusMsgEl, scheduleMsgEl, statusLightEl } = dom || getDomRefs();
	const effectiveSchedule = schedule || parseSchedule(statusMsgEl);
	if (!effectiveSchedule) return;

	const result = calculateRestaurantStatus(effectiveSchedule);
	const message = getStatusDisplayText(result.status, result.nextChange);
	const statusClass = getStatusClass(result.status);

	applyStatusToDom({ message, statusClass, statusMsgEl, scheduleMsgEl, statusLightEl });
};

const startAutoUpdates = () => {
	let intervalId = null;

	const start = () => {
		if (intervalId) return;
		updateStatus();
		intervalId = window.setInterval(() => updateStatus(), 60 * 1000);
	};

	const stop = () => {
		if (!intervalId) return;
		window.clearInterval(intervalId);
		intervalId = null;
	};

	document.addEventListener("visibilitychange", () => {
		if (document.hidden) stop();
		else start();
	});

	start();
};

startAutoUpdates();
highlightCurrentDay(document.getElementById("scheduleList"));