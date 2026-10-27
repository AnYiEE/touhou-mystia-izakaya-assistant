'use client';

import type { TFeatureAccessReason } from '@/domain/featureAccess/contracts';

import { FEATURE_ACCESS_API_RESPONSE_CODE_MAP } from '@/features/featureAccess/apiResponseCodes';

import {
	FILE_TYPE_PNG,
	FILE_TYPE_WEBP,
	normalizeMediaType,
} from '@/infrastructure/http/mediaTypes';

import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

import {
	MapAssetLoadError,
	type TMapAssetFailureKind,
	checkAbortError,
} from './mapAssetErrors';

const IMAGE_MEDIA_TYPES: ReadonlySet<string> = new Set([
	FILE_TYPE_PNG,
	FILE_TYPE_WEBP,
]);
const FEATURE_ACCESS_REASONS: ReadonlySet<TFeatureAccessReason> = new Set([
	'denied',
	'grant-required',
	'login-required',
	'unavailable',
]);
const RETRYABLE_FAILURE_KINDS: ReadonlySet<TMapAssetFailureKind> = new Set([
	'network',
	'not-found',
	'server',
]);

function checkFeatureAccessReason(
	value: unknown
): value is Exclude<TFeatureAccessReason, 'allowed'> {
	return FEATURE_ACCESS_REASONS.has(value as TFeatureAccessReason);
}

async function readErrorBody(response: Response) {
	if (
		normalizeMediaType(response.headers.get('content-type')) !==
		'application/json'
	) {
		return null;
	}
	try {
		const body: unknown = await response.json();
		return checkIsRecord(body) ? body : null;
	} catch {
		return null;
	}
}

function createStatusError(
	kind: TMapAssetFailureKind,
	status: number,
	reason: Exclude<TFeatureAccessReason, 'allowed'> | null = null
) {
	return new MapAssetLoadError(`map-asset-${kind}`, {
		kind,
		reason,
		retryable: RETRYABLE_FAILURE_KINDS.has(kind),
		status,
	});
}

async function createResponseError(response: Response) {
	const body = await readErrorBody(response);
	const message =
		typeof body?.['message'] === 'string' ? body['message'] : '';
	const data = checkIsRecord(body?.['data']) ? body['data'] : null;
	const reason = checkFeatureAccessReason(data?.['reason'])
		? data['reason']
		: null;

	if (response.status === 401) {
		return createStatusError(
			'unauthorized',
			response.status,
			'login-required'
		);
	}
	if (
		response.status === 403 &&
		message === FEATURE_ACCESS_API_RESPONSE_CODE_MAP.denied
	) {
		return createStatusError(
			'feature-access-denied',
			response.status,
			reason ?? 'unavailable'
		);
	}
	if (response.status === 403) {
		return createStatusError(
			'account-unavailable',
			response.status,
			reason ?? 'unavailable'
		);
	}
	if (response.status === 404) {
		return createStatusError('not-found', response.status);
	}
	return createStatusError('server', response.status);
}

function readImage(objectUrl: string, signal: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		const image = new Image();
		function handleAbort() {
			reject(
				new DOMException(
					'The map asset request was aborted.',
					'AbortError'
				)
			);
		}
		function handleError() {
			reject(new Error('map-asset-decode-failed'));
		}
		function handleLoad() {
			resolve();
		}

		image.decoding = 'async';
		image.addEventListener('load', handleLoad, { once: true });
		image.addEventListener('error', handleError, { once: true });
		signal.addEventListener('abort', handleAbort, { once: true });
		image.src = objectUrl;
	});
}

/** @description Fetch and decode one map image before exposing its object URL. */
export async function loadMapAsset(url: string, signal: AbortSignal) {
	let response: Response;
	try {
		response = await fetch(url, {
			credentials: 'include',
			headers: { Accept: `${FILE_TYPE_PNG}, ${FILE_TYPE_WEBP}` },
			signal,
		});
	} catch (error) {
		if (signal.aborted || checkAbortError(error)) {
			throw error;
		}
		throw new MapAssetLoadError('map-asset-network-error', {
			cause: error,
			kind: 'network',
			retryable: true,
		});
	}

	if (!response.ok) {
		throw await createResponseError(response);
	}

	const contentType = normalizeMediaType(
		response.headers.get('content-type')
	);
	if (contentType === null || !IMAGE_MEDIA_TYPES.has(contentType)) {
		throw new MapAssetLoadError('map-asset-invalid-response', {
			kind: 'invalid-response',
			status: response.status,
		});
	}

	let blob: Blob;
	try {
		blob = await response.blob();
	} catch (error) {
		if (signal.aborted || checkAbortError(error)) {
			throw error;
		}
		throw new MapAssetLoadError('map-asset-network-error', {
			cause: error,
			kind: 'network',
			retryable: true,
		});
	}

	const objectUrl = URL.createObjectURL(blob);
	try {
		await readImage(objectUrl, signal);
		return objectUrl;
	} catch (error) {
		URL.revokeObjectURL(objectUrl);
		if (signal.aborted || checkAbortError(error)) {
			throw error;
		}
		throw new MapAssetLoadError('map-asset-decode-error', {
			cause: error,
			kind: 'decode',
		});
	}
}
