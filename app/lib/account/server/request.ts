import { type NextRequest } from 'next/server';
import { env } from 'node:process';

import { checkEnvFlag } from '@/lib/environment';

import { SERVER_MISCONFIGURED_MESSAGE } from './environment';

export function getTrustedRequestIp(request: NextRequest) {
	if (!checkEnvFlag(env.TRUST_PROXY)) {
		return null;
	}

	const forwardedFor = request.headers
		.get('x-forwarded-for')
		?.split(',')
		.at(0)
		?.trim();

	if (forwardedFor) {
		return forwardedFor;
	}

	const realIp = request.headers.get('x-real-ip')?.trim() ?? '';

	return realIp === '' ? null : realIp;
}

export function getRequestIp(request: NextRequest) {
	return getTrustedRequestIp(request) ?? 'direct';
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
	const trustProxy = checkEnvFlag(env.TRUST_PROXY);
	const forwardedHost = getFirstHeaderValue(
		request.headers.get('x-forwarded-host')
	);
	const forwardedProtocol = getFirstHeaderValue(
		request.headers.get('x-forwarded-proto')
	);
	if (trustProxy && (forwardedHost === null || forwardedProtocol === null)) {
		return null;
	}

	const host = normalizeRequestHost(
		trustProxy ? forwardedHost : request.headers.get('host')
	);
	const protocol = normalizeRequestProtocol(
		trustProxy ? forwardedProtocol : request.nextUrl.protocol
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
	const forwardedProtocol = normalizeRequestProtocol(
		getFirstHeaderValue(request.headers.get('x-forwarded-proto'))
	);
	if (checkEnvFlag(env.TRUST_PROXY) && forwardedProtocol === null) {
		return false;
	}

	return (
		request.nextUrl.protocol === 'https:' ||
		(checkEnvFlag(env.TRUST_PROXY) && forwardedProtocol === 'https:')
	);
}

export function checkInsecureAccountCookiesAllowed() {
	return (
		env.NODE_ENV !== 'production' ||
		checkEnvFlag(env.ALLOW_INSECURE_COOKIES)
	);
}

export function getAccountCookieSecureFlag(request: NextRequest) {
	if (checkSecureRequest(request)) {
		return true;
	}
	if (checkInsecureAccountCookiesAllowed()) {
		return false;
	}

	throw new Error(SERVER_MISCONFIGURED_MESSAGE);
}
