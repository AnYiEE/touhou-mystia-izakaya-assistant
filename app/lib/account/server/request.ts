import { type NextRequest } from 'next/server';
import { env } from 'node:process';

export function getRequestIp(request: NextRequest) {
	if (env.TRUST_PROXY !== 'true') {
		return 'direct';
	}

	const forwardedFor = request.headers
		.get('x-forwarded-for')
		?.split(',')
		.at(0)
		?.trim();

	if (forwardedFor) {
		return forwardedFor;
	}

	return request.headers.get('x-real-ip') ?? 'unknown';
}

export function getRequestUserAgent(request: NextRequest) {
	return request.headers.get('user-agent') ?? '';
}

export function checkSameOriginRequest(request: NextRequest) {
	const origin = request.headers.get('origin');
	if (origin !== null) {
		return origin === request.nextUrl.origin;
	}

	const referer = request.headers.get('referer');
	if (referer === null) {
		return false;
	}

	try {
		return new URL(referer).origin === request.nextUrl.origin;
	} catch {
		return false;
	}
}

export function checkSecureRequest(request: NextRequest) {
	return (
		request.nextUrl.protocol === 'https:' ||
		request.headers.get('x-forwarded-proto') === 'https'
	);
}
