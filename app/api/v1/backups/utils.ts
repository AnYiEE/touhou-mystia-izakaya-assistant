import { createHash, createHmac } from 'node:crypto';
import { type NextRequest } from 'next/server';

import {
	getRequestIp,
	getRequestUserAgent,
} from '@/lib/account/server/request';
import { checkAppSecret } from '@/lib/account/server/environment';
export { getLogSafeErrorCode } from '@/lib/logging';

const LEGACY_BACKUP_META_FALLBACK_SECRET =
	'touhou-mystia-izakaya-assistant:legacy-backup-meta:v1';

function getBackupMetaSecret() {
	const legacySecret = process.env.LEGACY_BACKUP_SECRET;
	if (checkAppSecret(legacySecret)) {
		return legacySecret;
	}

	const appSecret = process.env.APP_SECRET;
	if (checkAppSecret(appSecret)) {
		return appSecret;
	}

	return LEGACY_BACKUP_META_FALLBACK_SECRET;
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
