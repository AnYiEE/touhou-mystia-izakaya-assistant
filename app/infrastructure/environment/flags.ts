export function checkEnvironmentFlag(value: string | undefined) {
	const normalizedValue = value?.trim().toLowerCase();
	return normalizedValue === '1' || normalizedValue === 'true';
}
