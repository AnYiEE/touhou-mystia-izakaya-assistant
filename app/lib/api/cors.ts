import { type NextRequest, NextResponse } from 'next/server';

const SERVICE_CORS_ALLOWED_METHODS = 'DELETE, GET, OPTIONS, PATCH, POST, PUT';
const SERVICE_CORS_ALLOWED_HEADERS = [
	'Content-Type',
	'X-CSRF-Token',
	'X-Requested-With',
	'X-Cleanup-Secret',
	'X-Sso-Dispatch-Secret',
].join(', ');
const SERVICE_CORS_EXPOSE_HEADERS = 'Retry-After';
const SERVICE_CORS_MAX_AGE = '86400';

function getHeaderOrigin(value: string | null) {
	if (value === null) {
		return null;
	}

	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

function getConfiguredServiceAllowedOrigins() {
	return new Set(
		(process.env.SERVICE_ALLOWED_ORIGINS ?? '')
			.split(',')
			.map((item) => getHeaderOrigin(item.trim()))
			.filter((origin): origin is string => origin !== null)
	);
}

function appendVaryHeader(headers: Headers, value: string) {
	const varyValues = new Map<string, string>();
	const current = headers.get('Vary');
	if (current !== null) {
		current.split(',').forEach((item) => {
			const normalizedItem = item.trim();
			if (normalizedItem !== '') {
				varyValues.set(normalizedItem.toLowerCase(), normalizedItem);
			}
		});
	}

	varyValues.set(value.toLowerCase(), value);
	headers.set('Vary', [...varyValues.values()].join(', '));
}

export function checkServiceAllowedOrigin(origin: string | null) {
	return origin !== null && getConfiguredServiceAllowedOrigins().has(origin);
}

export function getServiceCorsOrigin(request: NextRequest) {
	const origin = getHeaderOrigin(request.headers.get('origin'));

	return checkServiceAllowedOrigin(origin) ? origin : null;
}

export function applyServiceCorsHeaders(
	headers: Headers,
	request: NextRequest
) {
	const origin = getServiceCorsOrigin(request);
	if (origin === null) {
		return false;
	}

	headers.set('Access-Control-Allow-Origin', origin);
	headers.set('Access-Control-Allow-Credentials', 'true');
	headers.set('Access-Control-Expose-Headers', SERVICE_CORS_EXPOSE_HEADERS);
	appendVaryHeader(headers, 'Origin');

	return true;
}

export function createServiceCorsPreflightResponse(request: NextRequest) {
	const response = new NextResponse(null, { status: 204 });

	if (applyServiceCorsHeaders(response.headers, request)) {
		response.headers.set(
			'Access-Control-Allow-Methods',
			SERVICE_CORS_ALLOWED_METHODS
		);
		response.headers.set(
			'Access-Control-Allow-Headers',
			SERVICE_CORS_ALLOWED_HEADERS
		);
		response.headers.set('Access-Control-Max-Age', SERVICE_CORS_MAX_AGE);
	}

	return response;
}
