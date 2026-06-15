import {
	type IAdminSsoClientCreateBody,
	type IAdminSsoClientMutationData,
	type IAdminSsoClientUpdateBody,
} from '@/lib/account/shared/types';
import {
	createSsoClient,
	createSsoClientSecret,
	deleteSsoClient,
	updateSsoClient,
} from '@/lib/account/server/repositories/sso';
import {
	createSsoClientPublicProfile,
	validateSsoClientConfig,
} from '@/lib/account/server/ssoValidation';

export type TAdminSsoClientServiceError =
	| 'client-disabled'
	| 'invalid-object-structure'
	| 'sso-client-conflict'
	| 'sso-client-not-found';

export type TAdminSsoClientServiceResult<TData> =
	| { data: TData; status: 'ok' }
	| { error: TAdminSsoClientServiceError; status: 'error' };

export const ADMIN_SSO_CLIENT_SERVICE_ERROR_STATUS_MAP: Record<
	TAdminSsoClientServiceError,
	number
> = {
	'client-disabled': 403,
	'invalid-object-structure': 400,
	'sso-client-conflict': 409,
	'sso-client-not-found': 404,
};

export interface IAdminSsoClientUpdateOverrides {
	disabled?: boolean;
	generateSecret?: boolean;
}

function checkSsoClientConflictError(error: unknown) {
	if (error === null || typeof error !== 'object') {
		return false;
	}

	const code = Object.getOwnPropertyDescriptor(error, 'code')
		?.value as unknown;
	return (
		code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
		code === 'SQLITE_CONSTRAINT_UNIQUE'
	);
}

function checkStringArrayEqual(left: string[], right: string[]) {
	return (
		left.length === right.length &&
		left.every((value, index) => value === right[index])
	);
}

function mergeStringArrays(...arrays: string[][]) {
	return [...new Set(arrays.flat())];
}

async function readPublicClientProfile(id: string) {
	const ssoModule = await import('@/lib/account/server/sso');
	const client = await ssoModule.getSsoClientById(id);

	return client === null ? null : createSsoClientPublicProfile(client);
}

async function createMutationSuccessResult(
	id: string,
	clientSecret?: string
): Promise<TAdminSsoClientServiceResult<IAdminSsoClientMutationData>> {
	const client = await readPublicClientProfile(id);
	if (client === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}

	return {
		data: {
			client,
			...(clientSecret === undefined
				? {}
				: { client_secret: clientSecret }),
		},
		status: 'ok',
	};
}

export async function createAdminSsoClient(
	body: IAdminSsoClientCreateBody
): Promise<TAdminSsoClientServiceResult<IAdminSsoClientMutationData>> {
	try {
		const result = await createSsoClient(body);

		return await createMutationSuccessResult(
			result.client.id,
			result.client_secret
		);
	} catch (error) {
		if (checkSsoClientConflictError(error)) {
			return { error: 'sso-client-conflict', status: 'error' };
		}

		throw error;
	}
}

export async function updateAdminSsoClient(
	id: string,
	body: IAdminSsoClientUpdateBody,
	overrides: IAdminSsoClientUpdateOverrides = {}
): Promise<TAdminSsoClientServiceResult<IAdminSsoClientMutationData>> {
	if (body.id !== id) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const ssoModule = await import('@/lib/account/server/sso');
	const currentClient = await ssoModule.getSsoClientById(id);
	if (currentClient === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}

	const shouldGenerateSecret =
		overrides.generateSecret ?? body.generate_secret;
	const shouldDisableClient = overrides.disabled ?? body.disabled;
	const isSecretMutation =
		(shouldGenerateSecret ?? false) ||
		!checkStringArrayEqual(body.secret_hashes, currentClient.secret_hashes);
	if (
		(currentClient.disabled_at !== null || shouldDisableClient) &&
		isSecretMutation
	) {
		return { error: 'client-disabled', status: 'error' };
	}

	const nextDisabledAt = shouldDisableClient
		? (currentClient.disabled_at ?? Date.now())
		: null;
	const secret = shouldGenerateSecret ? createSsoClientSecret() : null;
	const secretHashes =
		secret === null
			? body.secret_hashes
			: mergeStringArrays(
					currentClient.secret_hashes,
					body.secret_hashes,
					[secret.secret_hash]
				);
	if (
		!validateSsoClientConfig({
			cancel_redirect_uri: body.cancel_redirect_uri,
			custom_scheme_redirect_uris: body.custom_scheme_redirect_uris,
			https_redirect_uris: body.https_redirect_uris,
			id: body.id,
			loopback_redirect_paths: body.loopback_redirect_paths,
			name: body.name,
			secret_hashes: secretHashes,
			status_callback_url: body.status_callback_url,
		})
	) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const updated = await updateSsoClient({
		cancel_redirect_uri: body.cancel_redirect_uri,
		custom_scheme_redirect_uris: body.custom_scheme_redirect_uris,
		disabled_at: nextDisabledAt,
		https_redirect_uris: body.https_redirect_uris,
		id: body.id,
		loopback_redirect_paths: body.loopback_redirect_paths,
		name: body.name,
		secret_hashes: secretHashes,
		status_callback_url: body.status_callback_url,
	});
	if (updated === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}

	return createMutationSuccessResult(id, secret?.client_secret);
}

export async function deleteAdminSsoClient(id: string) {
	const isDeleted = await deleteSsoClient(id);

	return isDeleted
		? ({ data: { message: 'sso-client-deleted' }, status: 'ok' } as const)
		: ({ error: 'sso-client-not-found', status: 'error' } as const);
}
