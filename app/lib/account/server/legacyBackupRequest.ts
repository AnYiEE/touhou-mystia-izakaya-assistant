import { type NextRequest } from 'next/server';
import { createHmac } from 'node:crypto';
import { env } from 'node:process';

import {
	getRequestIp,
	getRequestUserAgent,
} from '@/lib/account/server/request';
import {
	SERVER_MISCONFIGURED_MESSAGE,
	checkAppSecret,
} from '@/lib/account/server/environment';

function getBackupMetaSecret() {
	const appSecret = env.APP_SECRET;
	if (checkAppSecret(appSecret)) {
		return appSecret;
	}

	throw new Error(SERVER_MISCONFIGURED_MESSAGE);
}

function createBackupMetaHmac(value: string, secret: string) {
	return createHmac('sha256', secret)
		.update('backup-meta:v1')
		.update('\0')
		.update(value)
		.digest('base64url');
}

export function getLegacyBackupRequestMeta(request: NextRequest) {
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
