import type {
	IAdminSsoClientCreateBody,
	IAdminSsoClientUpdateBody,
} from '@/lib/account/shared/types';
import {
	normalizeSsoOptionalUri,
	validateSsoClientConfig,
} from '@/lib/account/server/ssoValidation';

const DUMMY_SECRET_HASH = '0'.repeat(64);
const MAX_SSO_CLIENT_ARRAY_ITEMS = 20;

function normalizeString(value: string) {
	return value.trim();
}

function normalizeStringArray(value: unknown) {
	if (!Array.isArray(value) || value.length > MAX_SSO_CLIENT_ARRAY_ITEMS) {
		return null;
	}

	const result: string[] = [];
	for (const item of value) {
		if (typeof item !== 'string') {
			return null;
		}
		const normalized = normalizeString(item);
		if (normalized !== '' && !result.includes(normalized)) {
			result.push(normalized);
		}
	}

	return result;
}

function normalizeOptionalUri(value: unknown) {
	if (value !== null && typeof value !== 'string') {
		return;
	}

	return normalizeSsoOptionalUri(value);
}

function normalizeInputObject(value: unknown) {
	return value !== null && typeof value === 'object'
		? (value as Record<string, unknown>)
		: null;
}

function parseBaseClientBody(data: unknown) {
	const input = normalizeInputObject(data);
	if (
		input === null ||
		typeof input['id'] !== 'string' ||
		typeof input['name'] !== 'string'
	) {
		return null;
	}

	const loopbackRedirectPaths = normalizeStringArray(
		input['loopback_redirect_paths']
	);
	const customSchemeRedirectUris = normalizeStringArray(
		input['custom_scheme_redirect_uris']
	);
	const httpsRedirectUris = normalizeStringArray(
		input['https_redirect_uris']
	);
	const statusCallbackUrl = normalizeOptionalUri(
		input['status_callback_url']
	);
	const cancelRedirectUri = normalizeOptionalUri(
		input['cancel_redirect_uri']
	);
	if (
		loopbackRedirectPaths === null ||
		customSchemeRedirectUris === null ||
		httpsRedirectUris === null ||
		statusCallbackUrl === undefined ||
		cancelRedirectUri === undefined
	) {
		return null;
	}

	return {
		cancel_redirect_uri: cancelRedirectUri,
		custom_scheme_redirect_uris: customSchemeRedirectUris,
		https_redirect_uris: httpsRedirectUris,
		id: normalizeString(input['id']),
		loopback_redirect_paths: loopbackRedirectPaths,
		name: normalizeString(input['name']),
		status_callback_url: statusCallbackUrl,
	} satisfies IAdminSsoClientCreateBody;
}

export function parseAdminSsoClientCreateBody(data: unknown) {
	const body = parseBaseClientBody(data);
	if (body === null) {
		return null;
	}

	return validateSsoClientConfig({
		...body,
		secret_hashes: [DUMMY_SECRET_HASH],
	})
		? body
		: null;
}

export function parseAdminSsoClientUpdateBody(data: unknown) {
	const body = parseBaseClientBody(data);
	const input = normalizeInputObject(data);
	const disabled = input?.['disabled'];
	if (body === null || typeof disabled !== 'boolean') {
		return null;
	}
	if (
		!validateSsoClientConfig({
			...body,
			secret_hashes: [DUMMY_SECRET_HASH],
		})
	) {
		return null;
	}

	return { ...body, disabled } satisfies IAdminSsoClientUpdateBody;
}
