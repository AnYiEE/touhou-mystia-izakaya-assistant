import { type NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import {
	createFeatureAccessGuardErrorResponse,
	requireFeatureAccess,
} from '@/features/featureAccess/server/requireFeatureAccess';
import {
	type IMapAssetAccess,
	resolveMapAssetAccess,
	resolveMapAssetFilePath,
} from '@/features/maps/server/mapAssetAccess';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';
import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import {
	applyServiceCorsHeaders,
	createServiceCorsPreflightResponse,
} from '@/infrastructure/http/server/cors';
import { createNoStoreErrorResponse } from '@/infrastructure/http/server/responses';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAP_ASSET_NOT_FOUND_MESSAGE = 'map-asset-not-found';
const MAP_ASSET_CONTENT_TYPES = {
	png: 'image/png',
	webp: 'image/webp',
} as const;

interface IRouteContext {
	params: Promise<{ path: string[] }>;
}

type TMapAssetAuthorizationResult =
	| { access: IMapAssetAccess; status: 'ok' }
	| { response: NextResponse; status: 'error' };

function addCorsHeaders(response: NextResponse, request: NextRequest) {
	applyServiceCorsHeaders(response.headers, request);
	return response;
}

function createErrorResponse(
	request: NextRequest,
	message: string,
	status: number
) {
	return addCorsHeaders(createNoStoreErrorResponse(message, status), request);
}

function getMapAssetDirectory() {
	if (PUBLIC_RUNTIME_CONFIG.isProduction) {
		const [, serverEntryPath] = process.argv;
		return serverEntryPath === undefined
			? null
			: join(dirname(resolve(serverEntryPath)), 'app', 'assets', 'maps');
	}
	return resolve(process.cwd(), 'app/assets/maps');
}

function getContentType(path: string) {
	return path.endsWith('.webp')
		? MAP_ASSET_CONTENT_TYPES.webp
		: path.endsWith('.png')
			? MAP_ASSET_CONTENT_TYPES.png
			: null;
}

async function authorizeMapAssetRequest(
	request: NextRequest,
	context: IRouteContext
): Promise<TMapAssetAuthorizationResult> {
	const { path } = await context.params;
	const access = resolveMapAssetAccess(path);
	if (access === null) {
		return {
			response: createErrorResponse(
				request,
				MAP_ASSET_NOT_FOUND_MESSAGE,
				404
			),
			status: 'error',
		};
	}

	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return {
			response: addCorsHeaders(featureResponse, request),
			status: 'error',
		};
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return {
			response: addCorsHeaders(sameOriginResponse, request),
			status: 'error',
		};
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return {
			response: addCorsHeaders(cookieSecurityResponse, request),
			status: 'error',
		};
	}

	const accessResult = await requireFeatureAccess(
		request,
		access.isPreview ? 'maps.preview' : 'maps.full'
	);
	if (accessResult.status === 'error') {
		return {
			response: addCorsHeaders(
				createFeatureAccessGuardErrorResponse(accessResult),
				request
			),
			status: 'error',
		};
	}

	return { access, status: 'ok' };
}

export function OPTIONS(request: NextRequest) {
	return createServiceCorsPreflightResponse(request);
}

export async function HEAD(request: NextRequest, context: IRouteContext) {
	const authorization = await authorizeMapAssetRequest(request, context);
	if (authorization.status === 'error') {
		return authorization.response;
	}

	return addCorsHeaders(
		new NextResponse(null, {
			headers: { 'Cache-Control': 'no-store' },
			status: 200,
		}),
		request
	);
}

export async function GET(request: NextRequest, context: IRouteContext) {
	const authorization = await authorizeMapAssetRequest(request, context);
	if (authorization.status === 'error') {
		return authorization.response;
	}
	const { access } = authorization;

	const mapAssetDirectory = getMapAssetDirectory();
	const filePath =
		mapAssetDirectory === null
			? null
			: resolveMapAssetFilePath(mapAssetDirectory, access.relativePath);
	const contentType = getContentType(access.relativePath);
	if (filePath === null || contentType === null) {
		return createErrorResponse(request, SERVER_MISCONFIGURED_MESSAGE, 500);
	}

	let content: Buffer;
	try {
		content = await readFile(filePath);
	} catch (error) {
		if (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			error.code === 'ENOENT'
		) {
			return createErrorResponse(
				request,
				MAP_ASSET_NOT_FOUND_MESSAGE,
				404
			);
		}
		console.warn('Map asset read failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return createErrorResponse(request, 'map-asset-read-failed', 500);
	}

	const response = new NextResponse(new Uint8Array(content), {
		headers: {
			'Cache-Control': 'private, max-age=31536000, immutable',
			'Content-Length': String(content.byteLength),
			'Content-Type': contentType,
		},
		status: 200,
	});

	return addCorsHeaders(response, request);
}
