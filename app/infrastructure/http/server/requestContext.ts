import { type NextRequest } from 'next/server';

import { checkEnvironmentFlag } from '@/infrastructure/environment/flags';
import { getHeaderOrigin } from '@/infrastructure/http/origin';

import { checkServiceAllowedOrigin } from './cors';
import { getFirstForwardedHeaderValue } from './forwardedHeaders';

export function getTrustedRequestIp(request: NextRequest) {
	if (!checkEnvironmentFlag(process.env.TRUST_PROXY)) {
		return null;
	}

	const forwardedFor = request.headers
		.get('x-forwarded-for')
		?.split(',', 1)
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

export function getRequestAuditContext(request: NextRequest) {
	return {
		ipAddress: getRequestIp(request),
		userAgent: getRequestUserAgent(request),
	};
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
	const trustProxy = checkEnvironmentFlag(process.env.TRUST_PROXY);
	const forwardedHost = getFirstForwardedHeaderValue(
		request.headers.get('x-forwarded-host')
	);
	const forwardedProtocol = getFirstForwardedHeaderValue(
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

export function checkSameOriginRequest(request: NextRequest) {
	const expectedOrigin = getExpectedRequestOrigin(request);
	if (expectedOrigin === null) {
		return false;
	}

	const origin = request.headers.get('origin');
	if (origin !== null) {
		const headerOrigin = getHeaderOrigin(origin);

		return (
			headerOrigin === expectedOrigin ||
			checkServiceAllowedOrigin(headerOrigin)
		);
	}

	const refererOrigin = getHeaderOrigin(request.headers.get('referer'));

	return (
		refererOrigin === expectedOrigin ||
		checkServiceAllowedOrigin(refererOrigin)
	);
}

export function checkSecureRequest(request: NextRequest) {
	const forwardedProtocol = normalizeRequestProtocol(
		getFirstForwardedHeaderValue(request.headers.get('x-forwarded-proto'))
	);
	if (
		checkEnvironmentFlag(process.env.TRUST_PROXY) &&
		forwardedProtocol === null
	) {
		return false;
	}

	return (
		request.nextUrl.protocol === 'https:' ||
		(checkEnvironmentFlag(process.env.TRUST_PROXY) &&
			forwardedProtocol === 'https:')
	);
}
