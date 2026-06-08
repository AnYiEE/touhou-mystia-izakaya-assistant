function checkBooleanEnv(value: string | undefined) {
	const v = value?.trim().toLowerCase();
	return v === '1' || v === 'true';
}

export function checkEnvFlag(value: string | undefined) {
	return checkBooleanEnv(value);
}

export function checkVercelEnv(value: string | undefined) {
	return checkBooleanEnv(value);
}

export function checkOfflineEnv(value: string | undefined) {
	return checkVercelEnv(value);
}
