import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { checkEnvFlag } from '@/lib/environment';

function getFirstHeaderValue(value: string | null) {
	const firstValue = value?.split(',', 1).at(0)?.trim();

	return firstValue === undefined || firstValue === '' ? null : firstValue;
}

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

	const trustProxy = checkEnvFlag(process.env.TRUST_PROXY);
	const host =
		(trustProxy
			? getFirstHeaderValue(mergedHeaders.get('x-forwarded-host'))
			: null) ??
		mergedHeaders.get('host') ??
		'localhost';
	const defaultProtocol =
		process.env.NODE_ENV === 'production' ? 'https' : 'http';
	const protocol =
		(trustProxy
			? getFirstHeaderValue(mergedHeaders.get('x-forwarded-proto'))
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
