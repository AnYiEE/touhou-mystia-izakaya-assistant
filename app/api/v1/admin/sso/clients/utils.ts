import {
	type IAdminSsoClientCreateBody,
	type IAdminSsoClientUpdateBody,
} from '@/lib/account/shared/types';
import {
	checkSsoSecretHash,
	normalizeSsoOptionalUri,
	validateSsoClientConfig,
} from '@/lib/account/server/sso';

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

function parseBaseClientBody(data: Partial<IAdminSsoClientCreateBody> | null) {
	if (
		data === null ||
		typeof data.id !== 'string' ||
		typeof data.name !== 'string'
	) {
		return null;
	}

	const loopbackRedirectPaths = normalizeStringArray(
		data.loopback_redirect_paths
	);
	const customSchemeRedirectUris = normalizeStringArray(
		data.custom_scheme_redirect_uris
	);
	const statusCallbackUrl = normalizeOptionalUri(data.status_callback_url);
	const cancelRedirectUri = normalizeOptionalUri(data.cancel_redirect_uri);
	if (
		loopbackRedirectPaths === null ||
		customSchemeRedirectUris === null ||
		statusCallbackUrl === undefined ||
		cancelRedirectUri === undefined
	) {
		return null;
	}

	return {
		cancel_redirect_uri: cancelRedirectUri,
		custom_scheme_redirect_uris: customSchemeRedirectUris,
		id: normalizeString(data.id),
		loopback_redirect_paths: loopbackRedirectPaths,
		name: normalizeString(data.name),
		status_callback_url: statusCallbackUrl,
	} satisfies IAdminSsoClientCreateBody;
}

export function parseAdminSsoClientCreateBody(
	data: Partial<IAdminSsoClientCreateBody> | null
) {
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

export function parseAdminSsoClientUpdateBody(
	data: Partial<IAdminSsoClientUpdateBody> | null
) {
	const body = parseBaseClientBody(data);
	const secretHashes = normalizeStringArray(data?.secret_hashes);
	if (body === null || secretHashes === null) {
		return null;
	}
	if (secretHashes.some((secretHash) => !checkSsoSecretHash(secretHash))) {
		return null;
	}

	const generateSecret = data?.generate_secret === true;
	const candidateSecretHashes = generateSecret
		? [...secretHashes, DUMMY_SECRET_HASH]
		: secretHashes;
	if (
		!validateSsoClientConfig({
			...body,
			secret_hashes: candidateSecretHashes,
		})
	) {
		return null;
	}

	return {
		...body,
		generate_secret: generateSecret,
		secret_hashes: secretHashes,
	} satisfies IAdminSsoClientUpdateBody;
}
