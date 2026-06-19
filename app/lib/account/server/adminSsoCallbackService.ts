import type {
	IAdminSsoCallbackDeliveryCleanupData,
	IAdminSsoCallbackDeliveryListData,
	IAdminSsoCallbackQueueListData,
	IAdminSsoCallbackQueueMutationData,
	IAdminSsoCallbackQueueRecord,
	TAdminSsoCallbackDeliveryStatus,
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
} from '@/lib/account/shared/types';
import type { TSsoCallbackQueue } from '@/lib/db/types';
import { SSO_CALLBACK_EVENT_LIST } from '@/lib/account/shared/constants';
import {
	SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT,
	discardSsoCallbackQueueRecord,
	listAdminSsoCallbackQueue,
	retrySsoCallbackQueueRecord,
} from '@/lib/account/server/repositories/sso';
import {
	cleanupSsoCallbackDeliveries,
	listSsoCallbackDeliveries,
} from '@/lib/account/server/repositories/ssoCallbackDeliveries';
import {
	checkAdminSsoPagination,
	getReachableAdminSsoTotalCount,
} from '@/lib/account/server/adminSsoPagination';

export const ADMIN_SSO_CALLBACK_DELIVERY_RETENTION_MS =
	30 * 24 * 60 * 60 * 1000;
export const ADMIN_SSO_CALLBACK_DELIVERY_MAX_ROWS = 10_000;
const ADMIN_SSO_CALLBACK_DELIVERY_CLEANUP_GRACE_MS = 60 * 1000;
const ADMIN_SSO_CALLBACK_METADATA_MAX_KEYS = 24;
const ADMIN_SSO_CALLBACK_METADATA_MAX_STRING_LENGTH = 256;
const ADMIN_SSO_CALLBACK_ERROR_MAX_LENGTH = 160;
const SENSITIVE_ADMIN_SSO_CALLBACK_KEY_PATTERN =
	/(secret|token|ticket|hash|password|credential|authorization|cookie|session)/iu;

export type TAdminSsoCallbackServiceError =
	| 'invalid-object-structure'
	| 'sso-callback-queue-busy'
	| 'sso-callback-queue-not-found';

export type TAdminSsoCallbackServiceResult<TData> =
	| { data: TData; status: 'ok' }
	| { error: TAdminSsoCallbackServiceError; status: 'error' };

export const ADMIN_SSO_CALLBACK_SERVICE_ERROR_STATUS_MAP: Record<
	TAdminSsoCallbackServiceError,
	number
> = {
	'invalid-object-structure': 400,
	'sso-callback-queue-busy': 409,
	'sso-callback-queue-not-found': 404,
};

export interface IAdminSsoCallbackQueueListOptions {
	clientId?: string;
	endTime?: number;
	event?: TAdminSsoCallbackEvent;
	page: number;
	pageSize: number;
	query?: string;
	startTime?: number;
	status?: TAdminSsoCallbackQueueStatus;
	userId?: string;
}

export interface IAdminSsoCallbackDeliveryListOptions {
	clientId?: string;
	endTime?: number;
	event?: TAdminSsoCallbackEvent;
	page: number;
	pageSize: number;
	query?: string;
	startTime?: number;
	status?: TAdminSsoCallbackDeliveryStatus;
	userId?: string;
}

export interface IAdminSsoCallbackDeliveryCleanupOptions {
	adminId?: string | null;
	before?: number;
	ipAddress?: string | null;
	maxRows?: number;
	userAgent?: string | null;
}

interface IAdminSsoCallbackMutationInput {
	adminId?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
}

function checkPagination(options: { page: number; pageSize: number }) {
	return checkAdminSsoPagination(options);
}

function checkCallbackEvent(value: TAdminSsoCallbackEvent | undefined) {
	return value === undefined || SSO_CALLBACK_EVENT_LIST.includes(value);
}

function parseAdminSsoMetadata(value: string): Record<string, unknown> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return {};
	}

	return parsed !== null &&
		typeof parsed === 'object' &&
		!Array.isArray(parsed)
		? (parsed as Record<string, unknown>)
		: {};
}

function sanitizeAdminSsoCallbackMetadataValue(
	value: unknown
): boolean | null | number | string | undefined {
	if (value === null || typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : String(value);
	}
	if (typeof value === 'string') {
		return value.slice(0, ADMIN_SSO_CALLBACK_METADATA_MAX_STRING_LENGTH);
	}

	return undefined;
}

function sanitizeAdminSsoCallbackMetadata(value: string) {
	const parsedMetadata = parseAdminSsoMetadata(value);
	const sanitizedMetadata: Record<string, boolean | null | number | string> =
		{};
	for (const [key, metadataValue] of Object.entries(parsedMetadata).slice(
		0,
		ADMIN_SSO_CALLBACK_METADATA_MAX_KEYS
	)) {
		if (SENSITIVE_ADMIN_SSO_CALLBACK_KEY_PATTERN.test(key)) {
			continue;
		}

		const sanitizedValue =
			sanitizeAdminSsoCallbackMetadataValue(metadataValue);
		if (sanitizedValue !== undefined) {
			sanitizedMetadata[key.slice(0, 64)] = sanitizedValue;
		}
	}

	return sanitizedMetadata;
}

function sanitizeAdminSsoCallbackError(value: string | null) {
	if (value === null) {
		return null;
	}

	const strippedValue = value.replaceAll(
		/([?&](?:[^=&#]*?(?:secret|token|ticket|hash|password|credential|authorization|cookie|session)[^=&#]*?)=)[^&#\s]*/giu,
		'$1[redacted]'
	);

	return strippedValue.slice(0, ADMIN_SSO_CALLBACK_ERROR_MAX_LENGTH);
}

function checkDeliveryStatus(
	value: TAdminSsoCallbackDeliveryStatus | undefined
) {
	return [undefined, 'failed', 'final_failed', 'succeeded'].includes(value);
}

function checkQueueStatus(value: TAdminSsoCallbackQueueStatus | undefined) {
	return [undefined, 'final_failed', 'pending', 'retrying'].includes(value);
}

function checkTimeRange(options: { endTime?: number; startTime?: number }) {
	return (
		(options.startTime === undefined ||
			(Number.isSafeInteger(options.startTime) &&
				options.startTime >= 0)) &&
		(options.endTime === undefined ||
			(Number.isSafeInteger(options.endTime) && options.endTime >= 0)) &&
		(options.startTime === undefined ||
			options.endTime === undefined ||
			options.startTime <= options.endTime)
	);
}

function checkListOptions(options: IAdminSsoCallbackDeliveryListOptions) {
	return (
		checkPagination(options) &&
		checkCallbackEvent(options.event) &&
		checkDeliveryStatus(options.status) &&
		checkTimeRange(options)
	);
}

function checkQueueListOptions(options: IAdminSsoCallbackQueueListOptions) {
	return (
		checkPagination(options) &&
		checkCallbackEvent(options.event) &&
		checkQueueStatus(options.status) &&
		checkTimeRange(options)
	);
}

function checkCleanupOptions(options: IAdminSsoCallbackDeliveryCleanupOptions) {
	const now = Date.now();
	return (
		(options.before === undefined ||
			(Number.isSafeInteger(options.before) &&
				options.before >= 0 &&
				options.before <=
					now - ADMIN_SSO_CALLBACK_DELIVERY_CLEANUP_GRACE_MS)) &&
		(options.maxRows === undefined ||
			(Number.isSafeInteger(options.maxRows) &&
				options.maxRows >= 1 &&
				options.maxRows <= ADMIN_SSO_CALLBACK_DELIVERY_MAX_ROWS))
	);
}

function createDefaultCleanupOptions(now = Date.now()) {
	return {
		before: now - ADMIN_SSO_CALLBACK_DELIVERY_RETENTION_MS,
		maxRows: ADMIN_SSO_CALLBACK_DELIVERY_MAX_ROWS,
	};
}

function getCallbackQueueStatus(
	callback: TSsoCallbackQueue
): TAdminSsoCallbackQueueStatus {
	if (callback.next_retry_at === SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT) {
		return 'final_failed';
	}
	if (callback.attempts > 0) {
		return 'retrying';
	}

	return 'pending';
}

function createCallbackQueueRecord(
	callback: TSsoCallbackQueue
): IAdminSsoCallbackQueueRecord {
	return {
		attempts: callback.attempts,
		client_id: callback.client_id,
		created_at: callback.created_at,
		event: callback.event,
		id: callback.id,
		last_error: sanitizeAdminSsoCallbackError(callback.last_error),
		metadata: sanitizeAdminSsoCallbackMetadata(callback.metadata_json),
		next_retry_at: callback.next_retry_at,
		status: getCallbackQueueStatus(callback),
		timestamp: callback.timestamp,
		user_id: callback.user_id,
	};
}

function createCallbackQueueMutationData(
	message: string,
	callback: TSsoCallbackQueue
): IAdminSsoCallbackQueueMutationData {
	return { callback: createCallbackQueueRecord(callback), message };
}

function createCallbackAuditLogInput(
	auditModule: typeof import('@/lib/account/server/adminAuditService'),
	action: string,
	callback: TSsoCallbackQueue | null,
	input: IAdminSsoCallbackMutationInput,
	metadata: Record<string, unknown> = {}
) {
	return {
		action,
		actorId: input.adminId ?? null,
		actorType: 'admin',
		metadata: {
			...(callback === null
				? {}
				: {
						callback_id: callback.id,
						client_id: callback.client_id,
						event: callback.event,
						user_id: callback.user_id,
					}),
			...metadata,
		},
		scope: 'sso',
		targetId: callback === null ? null : String(callback.id),
		targetType: 'sso_callback_queue',
		...(input.ipAddress === undefined
			? {}
			: { ipAddress: input.ipAddress }),
		...(input.userAgent === undefined
			? {}
			: { userAgent: input.userAgent }),
	} satisfies Parameters<typeof auditModule.writeAdminAuditLog>[0];
}

export async function listAdminSsoCallbackQueueRecords(
	options: IAdminSsoCallbackQueueListOptions
): Promise<TAdminSsoCallbackServiceResult<IAdminSsoCallbackQueueListData>> {
	if (!checkQueueListOptions(options)) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const { callbacks, totalCount } = await listAdminSsoCallbackQueue({
		limit: options.pageSize,
		offset: (options.page - 1) * options.pageSize,
		...(options.clientId === undefined
			? {}
			: { clientId: options.clientId }),
		...(options.endTime === undefined ? {} : { endTime: options.endTime }),
		...(options.event === undefined ? {} : { event: options.event }),
		...(options.query === undefined ? {} : { query: options.query }),
		...(options.startTime === undefined
			? {}
			: { startTime: options.startTime }),
		...(options.status === undefined ? {} : { status: options.status }),
		...(options.userId === undefined ? {} : { userId: options.userId }),
	});
	const reachableTotalCount = getReachableAdminSsoTotalCount(
		totalCount,
		options.pageSize
	);

	return {
		data: {
			callbacks: callbacks.map(createCallbackQueueRecord),
			page: options.page,
			page_size: options.pageSize,
			total_count: reachableTotalCount,
			total_pages: Math.ceil(reachableTotalCount / options.pageSize),
		},
		status: 'ok',
	};
}

export async function retryAdminSsoCallbackQueueItem(
	id: number,
	input: IAdminSsoCallbackMutationInput = {}
): Promise<TAdminSsoCallbackServiceResult<IAdminSsoCallbackQueueMutationData>> {
	const auditModule = await import('@/lib/account/server/adminAuditService');
	const result = await retrySsoCallbackQueueRecord(
		id,
		Date.now(),
		(trx, auditNow, callback) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createCallbackAuditLogInput(
					auditModule,
					'admin-retry-sso-callback',
					callback,
					input
				),
				auditNow
			)
	);
	if (result.status === 'error') {
		return { error: result.error, status: 'error' };
	}

	return {
		data: createCallbackQueueMutationData(
			'sso-callback-queue-retried',
			result.callback
		),
		status: 'ok',
	};
}

export async function discardAdminSsoCallbackQueueItem(
	id: number,
	input: IAdminSsoCallbackMutationInput = {}
): Promise<TAdminSsoCallbackServiceResult<IAdminSsoCallbackQueueMutationData>> {
	const auditModule = await import('@/lib/account/server/adminAuditService');
	const result = await discardSsoCallbackQueueRecord(
		id,
		Date.now(),
		(trx, auditNow, callback) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createCallbackAuditLogInput(
					auditModule,
					'admin-discard-sso-callback',
					callback,
					input
				),
				auditNow
			)
	);
	if (result.status === 'error') {
		return { error: result.error, status: 'error' };
	}

	return {
		data: createCallbackQueueMutationData(
			'sso-callback-queue-discarded',
			result.callback
		),
		status: 'ok',
	};
}

export async function listAdminSsoCallbackDeliveries(
	options: IAdminSsoCallbackDeliveryListOptions
): Promise<TAdminSsoCallbackServiceResult<IAdminSsoCallbackDeliveryListData>> {
	if (!checkListOptions(options)) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const { deliveries, totalCount } = await listSsoCallbackDeliveries({
		limit: options.pageSize,
		offset: (options.page - 1) * options.pageSize,
		...(options.clientId === undefined
			? {}
			: { clientId: options.clientId }),
		...(options.endTime === undefined ? {} : { endTime: options.endTime }),
		...(options.event === undefined ? {} : { event: options.event }),
		...(options.query === undefined ? {} : { query: options.query }),
		...(options.startTime === undefined
			? {}
			: { startTime: options.startTime }),
		...(options.status === undefined ? {} : { status: options.status }),
		...(options.userId === undefined ? {} : { userId: options.userId }),
	});
	const reachableTotalCount = getReachableAdminSsoTotalCount(
		totalCount,
		options.pageSize
	);

	return {
		data: {
			deliveries: deliveries.map((delivery) => {
				const { metadata_json: metadataJson, ...deliveryRecord } =
					delivery;

				return {
					...deliveryRecord,
					error: sanitizeAdminSsoCallbackError(delivery.error),
					metadata: sanitizeAdminSsoCallbackMetadata(metadataJson),
				};
			}),
			page: options.page,
			page_size: options.pageSize,
			total_count: reachableTotalCount,
			total_pages: Math.ceil(reachableTotalCount / options.pageSize),
		},
		status: 'ok',
	};
}

export async function cleanupAdminSsoCallbackDeliveries(
	options?: IAdminSsoCallbackDeliveryCleanupOptions
): Promise<
	TAdminSsoCallbackServiceResult<IAdminSsoCallbackDeliveryCleanupData>
> {
	const resolvedOptions = { ...createDefaultCleanupOptions(), ...options };
	if (!checkCleanupOptions(resolvedOptions)) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const auditModule = await import('@/lib/account/server/adminAuditService');
	const cleanupResult = await cleanupSsoCallbackDeliveries(
		resolvedOptions,
		(trx, auditNow, cleanupResultInTransaction) => {
			const deletedCountInTransaction =
				cleanupResultInTransaction.deletedByAge +
				cleanupResultInTransaction.deletedByCap;

			return auditModule.writeAdminAuditLogInTransaction(
				trx,
				createCallbackAuditLogInput(
					auditModule,
					'admin-cleanup-sso-callback-deliveries',
					null,
					resolvedOptions,
					{
						before: resolvedOptions.before,
						deleted_by_age: cleanupResultInTransaction.deletedByAge,
						deleted_by_cap: cleanupResultInTransaction.deletedByCap,
						deleted_count: deletedCountInTransaction,
						max_rows: resolvedOptions.maxRows,
					}
				),
				auditNow
			);
		}
	);
	const deletedCount =
		cleanupResult.deletedByAge + cleanupResult.deletedByCap;

	return {
		data: {
			deleted_by_age: cleanupResult.deletedByAge,
			deleted_by_cap: cleanupResult.deletedByCap,
			deleted_count: deletedCount,
			message: 'sso-callback-deliveries-cleaned',
		},
		status: 'ok',
	};
}
