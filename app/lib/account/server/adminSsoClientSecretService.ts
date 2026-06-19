import type {
	IAdminSsoClientProfile,
	IAdminSsoClientSecretListData,
	IAdminSsoClientSecretMutationData,
	IAdminSsoClientSecretRecord,
} from '@/lib/account/shared/types';
import type { TSsoClientSecret } from '@/lib/db/types';
import {
	type TSsoClientSecretMutationError,
	createSsoClientSecretForClient,
	listSsoClientSecrets,
	revokeSsoClientSecret,
	updateSsoClientSecret,
} from '@/lib/account/server/repositories/sso';
import { createSsoClientPublicProfile } from '@/lib/account/server/ssoValidation';

export type TAdminSsoClientSecretServiceError =
	| 'client-disabled'
	| 'invalid-object-structure'
	| 'last-active-secret'
	| 'sso-client-not-found'
	| 'sso-client-secret-not-found';

export type TAdminSsoClientSecretServiceResult<TData> =
	| { data: TData; status: 'ok' }
	| { error: TAdminSsoClientSecretServiceError; status: 'error' };

export const ADMIN_SSO_CLIENT_SECRET_SERVICE_ERROR_STATUS_MAP: Record<
	TAdminSsoClientSecretServiceError,
	number
> = {
	'client-disabled': 403,
	'invalid-object-structure': 400,
	'last-active-secret': 409,
	'sso-client-not-found': 404,
	'sso-client-secret-not-found': 404,
};

export interface IAdminSsoClientSecretCreateInput {
	adminId?: string | null;
	label?: string;
}

export interface IAdminSsoClientSecretUpdateInput {
	adminId?: string | null;
	disabled?: boolean;
	ipAddress?: string | null;
	label?: string | null;
	userAgent?: string | null;
}

interface IAdminSsoClientSecretAuditInput {
	adminId?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
}

function normalizeLabel(value: string | null | undefined) {
	const trimmedValue = value?.trim() ?? '';

	return trimmedValue === '' ? null : trimmedValue.slice(0, 80);
}

function createSecretRecord(
	secret: TSsoClientSecret
): IAdminSsoClientSecretRecord {
	let status: IAdminSsoClientSecretRecord['status'] = 'active';
	if (secret.revoked_at !== null) {
		status = 'revoked';
	} else if (secret.disabled_at !== null) {
		status = 'disabled';
	}

	return {
		client_id: secret.client_id,
		created_at: secret.created_at,
		created_by_admin: secret.created_by_admin,
		disabled_at: secret.disabled_at,
		id: secret.id,
		label: secret.label,
		last_used_at: secret.last_used_at,
		position: secret.position,
		revoked_at: secret.revoked_at,
		secret_hash_prefix: secret.secret_hash.slice(0, 12),
		status,
	};
}

async function readPublicClientProfile(
	clientId: string
): Promise<IAdminSsoClientProfile | null> {
	const ssoModule = await import('@/lib/account/server/sso');
	const client = await ssoModule.getSsoClientById(clientId);

	return client === null ? null : createSsoClientPublicProfile(client);
}

async function checkMutableClient(clientId: string) {
	const client = await readPublicClientProfile(clientId);
	if (client === null) {
		return {
			error: 'sso-client-not-found' as const,
			status: 'error' as const,
		};
	}
	if (client.disabled_at !== null) {
		return { error: 'client-disabled' as const, status: 'error' as const };
	}

	return { client, status: 'ok' as const };
}

async function createMutationResult(
	clientId: string,
	secret: TSsoClientSecret,
	message: string,
	clientSecret?: string
): Promise<
	TAdminSsoClientSecretServiceResult<IAdminSsoClientSecretMutationData>
> {
	const client = await readPublicClientProfile(clientId);
	if (client === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}

	return {
		data: {
			client,
			message,
			secret: createSecretRecord(secret),
			...(clientSecret === undefined
				? {}
				: { client_secret: clientSecret }),
		},
		status: 'ok',
	};
}

function mapRepositoryError(error: TSsoClientSecretMutationError) {
	return { error, status: 'error' as const };
}

function createSecretAuditLogInput(
	auditModule: typeof import('@/lib/account/server/adminAuditService'),
	action: string,
	clientId: string,
	secret: TSsoClientSecret,
	input: IAdminSsoClientSecretAuditInput,
	metadata: Record<string, unknown> = {}
) {
	return {
		action,
		actorId: input.adminId ?? null,
		actorType: 'admin',
		metadata: {
			client_id: clientId,
			target_record_status:
				secret.revoked_at === null
					? secret.disabled_at === null
						? 'active'
						: 'disabled'
					: 'revoked',
			...metadata,
		},
		scope: 'sso',
		targetId: secret.id,
		targetType: 'sso_client_secret',
		...(input.ipAddress === undefined
			? {}
			: { ipAddress: input.ipAddress }),
		...(input.userAgent === undefined
			? {}
			: { userAgent: input.userAgent }),
	} satisfies Parameters<typeof auditModule.writeAdminAuditLog>[0];
}

export async function listAdminSsoClientSecrets(
	clientId: string
): Promise<TAdminSsoClientSecretServiceResult<IAdminSsoClientSecretListData>> {
	const client = await readPublicClientProfile(clientId);
	if (client === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}

	const secrets = await listSsoClientSecrets(clientId);

	return {
		data: { client, secrets: secrets.map(createSecretRecord) },
		status: 'ok',
	};
}

export async function createAdminSsoClientSecret(
	clientId: string,
	input: IAdminSsoClientSecretCreateInput = {}
): Promise<
	TAdminSsoClientSecretServiceResult<IAdminSsoClientSecretMutationData>
> {
	const clientResult = await checkMutableClient(clientId);
	if (clientResult.status === 'error') {
		return clientResult;
	}

	const auditModule = await import('@/lib/account/server/adminAuditService');
	const result = await createSsoClientSecretForClient(
		clientId,
		{
			createdByAdmin: input.adminId ?? null,
			label: normalizeLabel(input.label),
		},
		(trx, auditNow, createResult) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createSecretAuditLogInput(
					auditModule,
					'admin-create-sso-client-secret',
					clientId,
					createResult.secret,
					input,
					{ label_configured: normalizeLabel(input.label) !== null }
				),
				auditNow
			)
	);
	if (result.status === 'error') {
		return mapRepositoryError(result.error);
	}

	return createMutationResult(
		clientId,
		result.secret,
		'sso-client-secret-created',
		result.client_secret
	);
}

export async function updateAdminSsoClientSecret(
	clientId: string,
	secretId: string,
	input: IAdminSsoClientSecretUpdateInput
): Promise<
	TAdminSsoClientSecretServiceResult<IAdminSsoClientSecretMutationData>
> {
	const clientResult = await checkMutableClient(clientId);
	if (clientResult.status === 'error') {
		return clientResult;
	}
	if (input.disabled === undefined && input.label === undefined) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const auditModule = await import('@/lib/account/server/adminAuditService');
	const result = await updateSsoClientSecret(
		clientId,
		secretId,
		{
			...(input.disabled === undefined
				? {}
				: { disabled: input.disabled }),
			...(input.label === undefined
				? {}
				: { label: normalizeLabel(input.label) }),
		},
		(trx, auditNow, secret) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createSecretAuditLogInput(
					auditModule,
					'admin-update-sso-client-secret',
					clientId,
					secret,
					input,
					{
						disabled_changed: input.disabled !== undefined,
						label_changed: input.label !== undefined,
					}
				),
				auditNow
			)
	);
	if (result.status === 'error') {
		return mapRepositoryError(result.error);
	}

	return createMutationResult(
		clientId,
		result.secret,
		'sso-client-secret-updated'
	);
}

export async function revokeAdminSsoClientSecret(
	clientId: string,
	secretId: string,
	input: IAdminSsoClientSecretAuditInput = {}
): Promise<
	TAdminSsoClientSecretServiceResult<IAdminSsoClientSecretMutationData>
> {
	const clientResult = await checkMutableClient(clientId);
	if (clientResult.status === 'error') {
		return clientResult;
	}

	const auditModule = await import('@/lib/account/server/adminAuditService');
	const result = await revokeSsoClientSecret(
		clientId,
		secretId,
		(trx, auditNow, secret) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createSecretAuditLogInput(
					auditModule,
					'admin-revoke-sso-client-secret',
					clientId,
					secret,
					input
				),
				auditNow
			)
	);
	if (result.status === 'error') {
		return mapRepositoryError(result.error);
	}

	return createMutationResult(
		clientId,
		result.secret,
		'sso-client-secret-revoked'
	);
}
