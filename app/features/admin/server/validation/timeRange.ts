export function checkAdminTimeRange(options: {
	endTime?: number;
	startTime?: number;
}) {
	return (
		(options.startTime === undefined ||
			(Number.isSafeInteger(options.startTime) &&
				options.startTime >= 0)) &&
		(options.endTime === undefined ||
			(Number.isSafeInteger(options.endTime) && options.endTime >= 0)) &&
		(options.startTime === undefined ||
			options.endTime === undefined ||
			options.startTime <= options.endTime)
	);
}
