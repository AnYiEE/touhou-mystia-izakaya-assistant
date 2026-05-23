export function checkEnvFlag(value: string | undefined) {
	return value === 'true';
}

export function checkVercelEnv(value: string | undefined) {
	return value === '1' || value === 'true';
}

export function checkOfflineEnv(value: string | undefined) {
	return checkVercelEnv(value);
}
