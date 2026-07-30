export function createAdminPageInputValue(page: number) {
	return String(Math.max(1, page));
}

export function parseAdminPageInput(value: string, totalPages: number) {
	const page = Number.parseInt(value, 10);
	if (!Number.isSafeInteger(page) || page < 1) {
		return 1;
	}

	return Math.min(page, Math.max(1, totalPages));
}

export function createAdminDateTimeText(timestamp: number | null) {
	return timestamp === null
		? '无'
		: new Date(timestamp).toLocaleString('zh-CN');
}

function createAdminTimeInputSegment(value: number) {
	return String(value).padStart(2, '0');
}

export function createAdminTimeInputValue(timestamp: number | undefined) {
	if (timestamp === undefined) {
		return '';
	}

	const date = new Date(timestamp);
	return `${date.getFullYear()}-${createAdminTimeInputSegment(
		date.getMonth() + 1
	)}-${createAdminTimeInputSegment(date.getDate())}T${createAdminTimeInputSegment(
		date.getHours()
	)}:${createAdminTimeInputSegment(date.getMinutes())}`;
}

export function parseAdminTimeInputValue(value: string) {
	if (value.trim() === '') {
		return;
	}

	const timestamp = new Date(value).getTime();
	return Number.isSafeInteger(timestamp) && timestamp >= 0
		? timestamp
		: undefined;
}
