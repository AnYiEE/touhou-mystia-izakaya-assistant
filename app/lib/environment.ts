export function checkEnvFlag(value: string | undefined) {
	return value === 'true';
}

export function checkVercelEnv(value: string | undefined) {
	return value === '1' || value === 'true';
}
