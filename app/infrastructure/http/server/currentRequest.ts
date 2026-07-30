import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { checkEnvironmentFlag } from '@/infrastructure/environment/flags';

import { getFirstForwardedHeaderValue } from './forwardedHeaders';

export async function createCurrentRequest(
	pathname: string,
	init: RequestInit = {}
) {
	const requestHeaders = await headers();
	const mergedHeaders = new Headers(requestHeaders);
	const initHeaders = new Headers(init.headers);
	initHeaders.forEach((value, key) => {
		mergedHeaders.set(key, value);
	});
	if (init.body !== undefined && init.body !== null) {
		mergedHeaders.delete('content-length');
	}

	const trustProxy = checkEnvironmentFlag(process.env.TRUST_PROXY);
	const host =
		(trustProxy
			? getFirstForwardedHeaderValue(
					mergedHeaders.get('x-forwarded-host')
				)
			: null) ??
		mergedHeaders.get('host') ??
		'localhost';
	const defaultProtocol =
		process.env.NODE_ENV === 'production' ? 'https' : 'http';
	const protocol =
		(trustProxy
			? getFirstForwardedHeaderValue(
					mergedHeaders.get('x-forwarded-proto')
				)
			: null) ?? defaultProtocol;

	const requestInit: NonNullable<
		ConstructorParameters<typeof NextRequest>[1]
	> = { headers: mergedHeaders };
	if (init.body !== undefined && init.body !== null) {
		requestInit.body = init.body;
	}
	if (init.method !== undefined) {
		requestInit.method = init.method;
	}

	return new NextRequest(`${protocol}://${host}${pathname}`, requestInit);
}
