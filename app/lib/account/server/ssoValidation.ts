export const SSO_FIELD_MAX_LENGTH = 2048;
export const SSO_CLIENT_ID_MAX_LENGTH = 128;
export const SSO_STATE_MAX_LENGTH = 1024;
export const SSO_CODE_VERIFIER_MAX_LENGTH = 256;
export const SSO_CODE_CHALLENGE_LENGTH = 43;
export const SSO_CONTEXT_TRANSACTION_ID_LENGTH = 22;
export const SSO_TICKET_LENGTH = 43;

const DANGEROUS_CUSTOM_REDIRECT_SCHEME_SET = new Set([
	'about',
	'blob',
	'data',
	'file',
	'javascript',
	'vbscript',
]);

interface ISsoClientStatusInput {
	disabled_at: number | null;
}

interface ISsoClientPublicProfileInput extends ISsoClientStatusInput {
	cancel_redirect_uri: string | null;
	created_at: number;
	custom_scheme_redirect_uris: string[];
	https_redirect_uris: string[];
	id: string;
	loopback_redirect_paths: string[];
	name: string;
	secret_hashes: string[];
	status_callback_url: string | null;
	updated_at: number;
}

export function normalizeNullableString(value: string | null) {
	const trimmed = value?.trim() ?? '';

	return trimmed === '' ? null : trimmed;
}

function checkBase64Url(value: string) {
	return /^[A-Za-z0-9_-]+$/u.test(value);
}

function hasControlCharacter(value: string) {
	for (let index = 0; index < value.length; index++) {
		const codePoint = value.codePointAt(index);
		if (
			codePoint !== undefined &&
			((codePoint >= 0 && codePoint <= 0x1f) || codePoint === 0x7f)
		) {
			return true;
		}
	}

	return false;
}

export function checkSsoCallbackEvent(
	value: string
): value is 'user_deleted' | 'user_disabled' {
	return value === 'user_deleted' || value === 'user_disabled';
}

export function checkSsoClientId(value: string) {
	return (
		value.length > 0 &&
		value.length <= SSO_CLIENT_ID_MAX_LENGTH &&
		/^[A-Za-z0-9._:-]+$/u.test(value)
	);
}

export function checkSsoClientName(value: string) {
	return value.trim().length > 0 && value.length <= 80;
}

export function checkSsoSecretHash(value: string) {
	return /^[a-f0-9]{64}$/u.test(value);
}

export function checkSsoClientSecret(value: string) {
	return value.length > 0 && value.length <= SSO_FIELD_MAX_LENGTH;
}

export function checkSsoState(value: string) {
	return (
		value.length > 0 &&
		value.length <= SSO_STATE_MAX_LENGTH &&
		!hasControlCharacter(value)
	);
}

export function checkSsoCodeChallenge(value: string) {
	return value.length === SSO_CODE_CHALLENGE_LENGTH && checkBase64Url(value);
}

export function checkSsoCodeVerifier(value: string) {
	return (
		value.length > 0 &&
		value.length <= SSO_CODE_VERIFIER_MAX_LENGTH &&
		checkBase64Url(value)
	);
}

export function checkSsoContextTransactionId(value: string) {
	return (
		value.length === SSO_CONTEXT_TRANSACTION_ID_LENGTH &&
		checkBase64Url(value)
	);
}

export function checkSsoTicketFormat(value: string) {
	return value.length === SSO_TICKET_LENGTH && checkBase64Url(value);
}

export function checkSsoLoopbackRedirectPath(value: string) {
	return (
		value.length > 0 &&
		value.length <= 256 &&
		value.startsWith('/') &&
		!value.startsWith('//') &&
		!hasControlCharacter(value) &&
		!/[?#]/u.test(value)
	);
}

export function checkSsoCustomSchemeRedirectUri(value: string) {
	if (value.length === 0 || value.length > SSO_FIELD_MAX_LENGTH) {
		return false;
	}

	try {
		const url = new URL(value);
		const scheme = url.protocol.slice(0, -1).toLowerCase();
		const protocolPrefix = `${url.protocol}//`;

		return (
			/^[a-z][a-z0-9+.-]{1,63}$/u.test(scheme) &&
			!DANGEROUS_CUSTOM_REDIRECT_SCHEME_SET.has(scheme) &&
			url.protocol !== 'http:' &&
			url.protocol !== 'https:' &&
			value.toLowerCase().startsWith(protocolPrefix) &&
			url.hostname !== '' &&
			url.username === '' &&
			url.password === '' &&
			url.hash === ''
		);
	} catch {
		return false;
	}
}

export function checkSsoStatusCallbackUrl(value: string | null) {
	if (value === null) {
		return true;
	}

	try {
		const url = new URL(value);
		return (
			value.length <= SSO_FIELD_MAX_LENGTH &&
			url.protocol === 'https:' &&
			url.username === '' &&
			url.password === '' &&
			url.hash === ''
		);
	} catch {
		return false;
	}
}

export function checkSsoHttpsRedirectUri(value: string) {
	if (value.length === 0 || value.length > SSO_FIELD_MAX_LENGTH) {
		return false;
	}

	try {
		const url = new URL(value);
		return (
			url.protocol === 'https:' &&
			url.hostname !== '' &&
			url.username === '' &&
			url.password === '' &&
			url.hash === ''
		);
	} catch {
		return false;
	}
}

export function checkSsoRedirectUriFormat(value: string) {
	if (value.length === 0 || value.length > SSO_FIELD_MAX_LENGTH) {
		return false;
	}

	try {
		const url = new URL(value);
		if (url.protocol === 'http:') {
			return (
				['127.0.0.1', '[::1]', '::1'].includes(url.hostname) &&
				url.username === '' &&
				url.password === '' &&
				url.hash === '' &&
				checkSsoLoopbackRedirectPath(url.pathname)
			);
		}
		if (url.protocol === 'https:') {
			return checkSsoHttpsRedirectUri(value);
		}

		return checkSsoCustomSchemeRedirectUri(value);
	} catch {
		return false;
	}
}

export function normalizeSsoOptionalUri(value: string | null | undefined) {
	return normalizeNullableString(value ?? null);
}

export function validateSsoClientConfig(input: {
	cancel_redirect_uri: string | null;
	custom_scheme_redirect_uris: string[];
	https_redirect_uris: string[];
	id: string;
	loopback_redirect_paths: string[];
	name: string;
	secret_hashes: string[];
	status_callback_url: string | null;
}) {
	if (!checkSsoClientId(input.id) || !checkSsoClientName(input.name)) {
		return false;
	}
	if (
		input.secret_hashes.length === 0 ||
		input.secret_hashes.some(
			(secretHash) => !checkSsoSecretHash(secretHash)
		)
	) {
		return false;
	}
	if (
		input.loopback_redirect_paths.some(
			(path) => !checkSsoLoopbackRedirectPath(path)
		) ||
		input.custom_scheme_redirect_uris.some(
			(uri) => !checkSsoCustomSchemeRedirectUri(uri)
		) ||
		input.https_redirect_uris.some((uri) => !checkSsoHttpsRedirectUri(uri))
	) {
		return false;
	}
	if (
		input.loopback_redirect_paths.length === 0 &&
		input.custom_scheme_redirect_uris.length === 0 &&
		input.https_redirect_uris.length === 0
	) {
		return false;
	}
	if (!checkSsoStatusCallbackUrl(input.status_callback_url)) {
		return false;
	}
	if (
		input.cancel_redirect_uri !== null &&
		!checkSsoRedirectUriFormat(input.cancel_redirect_uri)
	) {
		return false;
	}

	return true;
}

export function checkSsoClientEnabled(client: ISsoClientStatusInput) {
	return client.disabled_at === null;
}

export function createSsoClientPublicProfile(
	client: ISsoClientPublicProfileInput
) {
	return {
		cancel_redirect_uri: client.cancel_redirect_uri,
		created_at: client.created_at,
		custom_scheme_redirect_uris: client.custom_scheme_redirect_uris,
		disabled_at: client.disabled_at,
		https_redirect_uris: client.https_redirect_uris,
		id: client.id,
		loopback_redirect_paths: client.loopback_redirect_paths,
		name: client.name,
		secret_hashes: client.secret_hashes,
		status_callback_url: client.status_callback_url,
		updated_at: client.updated_at,
	};
}
