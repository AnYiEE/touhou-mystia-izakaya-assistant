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
	resolveMapAssetAccess,
	resolveMapAssetFilePath,
} from '@/features/maps/server/mapAssetAccess';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';
import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import {
	applyServiceCorsHeaders,
	createServiceCorsPreflightResponse,
} from '@/infrastructure/http/server/cors';
import {
	NO_STORE_HEADERS,
	createNoStoreErrorResponse,
} from '@/infrastructure/http/server/responses';
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

export function OPTIONS(request: NextRequest) {
	return createServiceCorsPreflightResponse(request);
}

export async function GET(request: NextRequest, context: IRouteContext) {
	const { path } = await context.params;
	const access = resolveMapAssetAccess(path);
	if (access === null) {
		return createErrorResponse(request, MAP_ASSET_NOT_FOUND_MESSAGE, 404);
	}

	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return addCorsHeaders(featureResponse, request);
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return addCorsHeaders(sameOriginResponse, request);
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return addCorsHeaders(cookieSecurityResponse, request);
	}

	const accessResult = await requireFeatureAccess(
		request,
		access.isPreview ? 'maps.preview' : 'maps.full'
	);
	if (accessResult.status === 'error') {
		return addCorsHeaders(
			createFeatureAccessGuardErrorResponse(accessResult),
			request
		);
	}

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
			...NO_STORE_HEADERS,
			'Cache-Control': 'private, max-age=31536000, immutable',
			'Content-Length': String(content.byteLength),
			'Content-Type': contentType,
		},
		status: 200,
	});

	return addCorsHeaders(response, request);
}
