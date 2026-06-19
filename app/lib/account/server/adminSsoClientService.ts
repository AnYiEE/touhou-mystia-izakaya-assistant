import {
	type IAdminSsoClientCreateBody,
	type IAdminSsoClientDetailData,
	type IAdminSsoClientListData,
	type IAdminSsoClientListRecord,
	type IAdminSsoClientMutationData,
	type IAdminSsoClientUpdateBody,
} from '@/lib/account/shared/types';
import {
	createSsoClient,
	deleteSsoClient,
	listAdminSsoClientSummaries,
	updateSsoClientConfig,
	updateSsoClientConfigWithCallback,
} from '@/lib/account/server/repositories/sso';
import {
	checkAdminSsoPagination,
	getReachableAdminSsoTotalCount,
} from '@/lib/account/server/adminSsoPagination';
import {
	createSsoClientPublicProfile,
	validateSsoClientConfig,
} from '@/lib/account/server/ssoValidation';

const DUMMY_SECRET_HASH = '0'.repeat(64);

export type TAdminSsoClientServiceError =
	| 'client-disabled'
	| 'invalid-object-structure'
	| 'sso-client-conflict'
	| 'sso-client-not-found';

export type TAdminSsoClientServiceResult<TData> =
	| { data: TData; status: 'ok' }
	| { error: TAdminSsoClientServiceError; status: 'error' };

export type TAdminSsoClientStatusFilter = 'active' | 'disabled';
export type TAdminSsoClientCallbackFilter = 'configured' | 'missing';

export interface IAdminSsoClientListOptions {
	callback?: TAdminSsoClientCallbackFilter;
	hasGrants?: boolean;
	page: number;
	pageSize: number;
	query?: string;
	status?: TAdminSsoClientStatusFilter;
}

export interface IAdminSsoClientMutationInput {
	adminId?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
}

type TAdminSsoClientListInputOptions = Omit<
	IAdminSsoClientListOptions,
	'page' | 'pageSize'
> &
	Partial<Pick<IAdminSsoClientListOptions, 'page' | 'pageSize'>>;

export const ADMIN_SSO_CLIENT_SERVICE_ERROR_STATUS_MAP: Record<
	TAdminSsoClientServiceError,
	number
> = {
	'client-disabled': 403,
	'invalid-object-structure': 400,
	'sso-client-conflict': 409,
	'sso-client-not-found': 404,
};

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

function checkPagination(options: IAdminSsoClientListOptions) {
	return checkAdminSsoPagination(options);
}

function checkListOptions(options: IAdminSsoClientListOptions) {
	return (
		checkPagination(options) &&
		[undefined, 'active', 'disabled'].includes(options.status) &&
		[undefined, 'configured', 'missing'].includes(options.callback)
	);
}

async function readPublicClientProfile(id: string) {
	const ssoModule = await import('@/lib/account/server/sso');
	const client = await ssoModule.getSsoClientById(id);

	return client === null ? null : createSsoClientPublicProfile(client);
}

export async function listAdminSsoClients(
	options: TAdminSsoClientListInputOptions = {}
): Promise<TAdminSsoClientServiceResult<IAdminSsoClientListData>> {
	const resolvedOptions: IAdminSsoClientListOptions = {
		...options,
		page: options.page ?? 1,
		pageSize: options.pageSize ?? 20,
	};
	if (!checkListOptions(resolvedOptions)) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const { callback, hasGrants, page, pageSize, query, status } =
		resolvedOptions;
	const result = await listAdminSsoClientSummaries({
		limit: pageSize,
		offset: (page - 1) * pageSize,
		...(callback === undefined ? {} : { callback }),
		...(hasGrants === undefined ? {} : { hasGrants }),
		...(query === undefined ? {} : { query }),
		...(status === undefined ? {} : { status }),
	});
	const records: IAdminSsoClientListRecord[] = result.clients.map(
		(client) => ({
			active_secret_count: client.active_secret_count,
			cancel_redirect_uri: client.cancel_redirect_uri,
			created_at: client.created_at,
			custom_scheme_redirect_uris: JSON.parse(
				client.custom_scheme_redirect_uris
			) as string[],
			disabled_at: client.disabled_at,
			failed_callback_count: client.failed_callback_count,
			grant_count: client.grant_count,
			https_redirect_uris: JSON.parse(
				client.https_redirect_uris
			) as string[],
			id: client.id,
			last_secret_used_at: client.last_secret_used_at,
			loopback_redirect_paths: JSON.parse(
				client.loopback_redirect_paths
			) as string[],
			name: client.name,
			pending_callback_count: client.pending_callback_count,
			pending_ticket_count: client.pending_ticket_count,
			status_callback_url: client.status_callback_url,
			updated_at: client.updated_at,
		})
	);
	const reachableTotalCount = getReachableAdminSsoTotalCount(
		result.totalCount,
		pageSize
	);

	return {
		data: {
			clients: records,
			metrics: result.metrics,
			page,
			page_size: pageSize,
			total_count: reachableTotalCount,
			total_pages: Math.ceil(reachableTotalCount / pageSize),
		},
		status: 'ok',
	};
}

export async function getAdminSsoClient(
	id: string
): Promise<TAdminSsoClientServiceResult<IAdminSsoClientDetailData>> {
	const client = await readPublicClientProfile(id);
	if (client === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}

	return { data: { client }, status: 'ok' };
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

function createClientAuditLogInput(
	auditModule: typeof import('@/lib/account/server/adminAuditService'),
	action: string,
	targetId: string,
	input: IAdminSsoClientMutationInput | undefined,
	metadata: Record<string, unknown> = {}
) {
	return {
		action,
		actorId: input?.adminId ?? null,
		actorType: 'admin',
		metadata,
		scope: 'sso',
		targetId,
		targetType: 'sso_client',
		...(input?.ipAddress === undefined
			? {}
			: { ipAddress: input.ipAddress }),
		...(input?.userAgent === undefined
			? {}
			: { userAgent: input.userAgent }),
	} satisfies Parameters<typeof auditModule.writeAdminAuditLog>[0];
}

export async function createAdminSsoClient(
	body: IAdminSsoClientCreateBody,
	input: IAdminSsoClientMutationInput = {}
): Promise<TAdminSsoClientServiceResult<IAdminSsoClientMutationData>> {
	try {
		const auditModule =
			await import('@/lib/account/server/adminAuditService');
		const result = await createSsoClient(
			body,
			(trx, auditNow, createdResult) =>
				auditModule.writeAdminAuditLogInTransaction(
					trx,
					createClientAuditLogInput(
						auditModule,
						'admin-create-sso-client',
						createdResult.client.id,
						input,
						{
							callback_configured:
								body.status_callback_url !== null,
							client_id: createdResult.client.id,
							client_name: body.name,
						}
					),
					auditNow
				)
		);

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
	input: IAdminSsoClientMutationInput = {}
): Promise<TAdminSsoClientServiceResult<IAdminSsoClientMutationData>> {
	if (body.id !== id) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const ssoModule = await import('@/lib/account/server/sso');
	const currentClient = await ssoModule.getSsoClientById(id);
	if (currentClient === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}

	const nextDisabledAt = body.disabled
		? (currentClient.disabled_at ?? Date.now())
		: null;
	if (
		!validateSsoClientConfig({
			cancel_redirect_uri: body.cancel_redirect_uri,
			custom_scheme_redirect_uris: body.custom_scheme_redirect_uris,
			https_redirect_uris: body.https_redirect_uris,
			id: body.id,
			loopback_redirect_paths: body.loopback_redirect_paths,
			name: body.name,
			secret_hashes: [DUMMY_SECRET_HASH],
			status_callback_url: body.status_callback_url,
		})
	) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const updateInput = {
		cancel_redirect_uri: body.cancel_redirect_uri,
		custom_scheme_redirect_uris: body.custom_scheme_redirect_uris,
		disabled_at: nextDisabledAt,
		https_redirect_uris: body.https_redirect_uris,
		id: body.id,
		loopback_redirect_paths: body.loopback_redirect_paths,
		name: body.name,
		status_callback_url: body.status_callback_url,
	};
	const auditModule = await import('@/lib/account/server/adminAuditService');
	const writeUpdateAuditLog = (
		trx: Parameters<typeof auditModule.writeAdminAuditLogInTransaction>[0],
		auditNow: number,
		updatedClient: NonNullable<
			Awaited<ReturnType<typeof updateSsoClientConfig>>
		>
	) =>
		auditModule.writeAdminAuditLogInTransaction(
			trx,
			createClientAuditLogInput(
				auditModule,
				'admin-update-sso-client',
				id,
				input,
				{
					callback_configured: body.status_callback_url !== null,
					client_id: id,
					client_name: body.name,
					disabled: updatedClient.disabled_at !== null,
				}
			),
			auditNow
		);
	const updated =
		currentClient.disabled_at === null && nextDisabledAt !== null
			? await updateSsoClientConfigWithCallback(
					{
						...updateInput,
						callback: {
							event: 'client_disabled',
							metadata: { reason: 'admin-disable-client' },
							timestamp: nextDisabledAt,
						},
					},
					writeUpdateAuditLog
				)
			: await updateSsoClientConfig(updateInput, writeUpdateAuditLog);
	if (updated === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}

	return createMutationSuccessResult(id);
}

export async function deleteAdminSsoClient(
	id: string,
	input: IAdminSsoClientMutationInput = {}
) {
	const auditModule = await import('@/lib/account/server/adminAuditService');
	const result = await deleteSsoClient(
		id,
		{
			actor: {
				actorId: input.adminId ?? null,
				actorType: 'admin',
				reason: 'admin-delete-client',
			},
		},
		(trx, auditNow, deleteResult) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createClientAuditLogInput(
					auditModule,
					'admin-delete-sso-client',
					id,
					input,
					{
						client_id: id,
						revoked_grant_count: deleteResult.revokedGrantCount,
						revoked_ticket_count: deleteResult.revokedTicketCount,
					}
				),
				auditNow
			)
	);

	return result === null
		? ({ error: 'sso-client-not-found', status: 'error' } as const)
		: ({ data: { message: 'sso-client-deleted' }, status: 'ok' } as const);
}
