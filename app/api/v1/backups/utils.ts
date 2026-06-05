import { createHash, createHmac } from 'node:crypto';
import { type NextRequest } from 'next/server';

import {
	getRequestIp,
	getRequestUserAgent,
} from '@/lib/account/server/request';
export { getLogSafeErrorCode } from '@/lib/logging';

function getBackupMetaSecret() {
	const secret = [
		process.env.SESSION_SECRET,
		process.env.CLEANUP_SECRET,
	].find((value) => typeof value === 'string' && value !== '');

	return secret ?? null;
}

function createBackupMetaHmac(value: string, secret: string) {
	return createHmac('sha256', secret)
		.update('backup-meta:v1')
		.update('\0')
		.update(value)
		.digest('base64url');
}

export function maskBackupCode(code: string) {
	return `sha256:${createHash('sha256').update(code).digest('hex').slice(0, 12)}`;
}

export function getRequestMeta(request: NextRequest) {
	const secret = getBackupMetaSecret();
	if (secret === null) {
		return null;
	}

	const contentType = request.headers.get('content-type') ?? null;

	const requestIp = getRequestIp(request).trim();
	const ip =
		requestIp === '' ? null : createBackupMetaHmac(requestIp, secret);
	const requestUserAgent = getRequestUserAgent(request).trim();
	const ua =
		requestUserAgent === ''
			? null
			: createBackupMetaHmac(requestUserAgent, secret);

	return { contentType, ip, ua };
}
