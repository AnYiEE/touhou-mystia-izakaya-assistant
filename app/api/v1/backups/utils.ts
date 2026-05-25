/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { createHash } from 'node:crypto';
import { type NextRequest } from 'next/server';
import { sha1 } from 'js-sha1';

import {
	getRequestIp,
	getRequestUserAgent,
} from '@/lib/account/server/request';
export { getLogSafeErrorCode } from '@/lib/logging';

export function maskBackupCode(code: string) {
	return `sha256:${createHash('sha256').update(code).digest('hex').slice(0, 12)}`;
}

export function getRequestMeta(request: NextRequest) {
	const contentType = request.headers.get('content-type') || null;

	const requestIp = getRequestIp(request).trim();
	const ip = requestIp === '' ? null : sha1(requestIp);
	const requestUserAgent = getRequestUserAgent(request).trim();
	const ua = requestUserAgent === '' ? null : sha1(requestUserAgent);

	return { contentType, ip, ua };
}
