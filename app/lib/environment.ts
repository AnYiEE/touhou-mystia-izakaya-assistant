export function checkEnvFlag(value: string | undefined) {
	return value?.trim().toLowerCase() === 'true';
}

export function checkVercelEnv(value: string | undefined) {
	const v = value?.trim().toLowerCase();
	return v === '1' || v === 'true';
}

export function checkOfflineEnv(value: string | undefined) {
	return checkVercelEnv(value);
}
