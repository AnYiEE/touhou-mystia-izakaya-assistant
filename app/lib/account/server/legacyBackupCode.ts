import { validate } from 'uuid';

export function parseLegacyBackupCode(rawCode: string) {
	const normalizedCode = rawCode.trim();
	if (!validate(normalizedCode)) {
		return null;
	}

	return normalizedCode.toLowerCase();
}
