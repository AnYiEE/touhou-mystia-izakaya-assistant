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

function getFirstHeaderValue(value: string | null) {
	const firstValue = value?.split(',').at(0)?.trim();

	return firstValue === undefined || firstValue === '' ? null : firstValue;
}

function normalizeRequestProtocol(protocol: string | null) {
	const normalizedProtocol = protocol
		?.trim()
		.toLowerCase()
		.replace(/:$/u, '');
	if (normalizedProtocol !== 'http' && normalizedProtocol !== 'https') {
		return null;
	}

	return `${normalizedProtocol}:`;
}

function normalizeRequestHost(host: string | null) {
	const normalizedHost = host?.trim();
	if (!normalizedHost || /[\s/\\?#@]/u.test(normalizedHost)) {
		return null;
	}

	return normalizedHost;
}

export function getExpectedRequestOrigin(request: NextRequest) {
	const trustProxy = env.TRUST_PROXY === 'true';
	const host = normalizeRequestHost(
		trustProxy
			? (getFirstHeaderValue(request.headers.get('x-forwarded-host')) ??
					request.headers.get('host'))
			: request.headers.get('host')
	);
	const protocol = normalizeRequestProtocol(
		trustProxy
			? (getFirstHeaderValue(request.headers.get('x-forwarded-proto')) ??
					request.nextUrl.protocol)
			: request.nextUrl.protocol
	);

	if (host === null || protocol === null) {
		return null;
	}

	try {
		return new URL(`${protocol}//${host}`).origin;
	} catch {
		return null;
	}
}

export function getHeaderOrigin(value: string | null) {
	if (value === null) {
		return null;
	}

	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

export function checkSameOriginRequest(request: NextRequest) {
	const expectedOrigin = getExpectedRequestOrigin(request);
	if (expectedOrigin === null) {
		return false;
	}

	const origin = request.headers.get('origin');
	if (origin !== null) {
		return getHeaderOrigin(origin) === expectedOrigin;
	}

	return getHeaderOrigin(request.headers.get('referer')) === expectedOrigin;
}

export function checkSecureRequest(request: NextRequest) {
	return (
		request.nextUrl.protocol === 'https:' ||
		(env.TRUST_PROXY === 'true' &&
			request.headers.get('x-forwarded-proto') === 'https')
	);
}
