import { createHash } from 'node:crypto';

export function maskBackupCode(code: string) {
	return `sha256:${createHash('sha256').update(code).digest('hex').slice(0, 12)}`;
}
