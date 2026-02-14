export const timeToMinutes = (time) => {
	const [hours, minutes] = time.split(":").map(Number);
	return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

export const getCurrentTimeInTimezone = (timezone) => {
	return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
};

export const formatTimeRemaining = (minutes) => {
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
};

export const formatTime12Hour = (time24) => {
	const [hours, minutes] = time24.split(":").map(Number);
	const period = hours >= 12 ? "p.m." : "a.m.";
	const hours12 = hours % 12 || 12;
	return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
};
