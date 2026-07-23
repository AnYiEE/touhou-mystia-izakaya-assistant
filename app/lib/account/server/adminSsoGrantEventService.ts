import type {
	IAccountUserProfile,
	IAdminSsoGrantEventListData,
	IAdminSsoGrantEventRecord,
	TAdminSsoGrantEvent,
} from '@/lib/account/shared/types';
import type { TSsoActorType } from '@/lib/db/types';
import { createAccountUserProfile } from '@/lib/account/server/user';
import {
	type IAdminSsoGrantEventListOptions as IRepositoryAdminSsoGrantEventListOptions,
	cleanupSsoGrantEvents,
	listAdminSsoGrantEvents,
} from '@/lib/account/server/repositories/sso';
import {
	checkAdminSsoPagination,
	getReachableAdminSsoTotalCount,
} from '@/lib/account/server/adminSsoPagination';
import { getLogSafeErrorCode } from '@/lib/logging';

export type TAdminSsoGrantEventServiceError = 'invalid-object-structure';

export type TAdminSsoGrantEventServiceResult<TData> =
	| { data: TData; status: 'ok' }
	| { error: TAdminSsoGrantEventServiceError; status: 'error' };

export const ADMIN_SSO_GRANT_EVENT_SERVICE_ERROR_STATUS_MAP: Record<
	TAdminSsoGrantEventServiceError,
	number
> = { 'invalid-object-structure': 400 };

export const ADMIN_SSO_GRANT_EVENT_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
export const ADMIN_SSO_GRANT_EVENT_MAX_ROWS = 100_000;
const ADMIN_SSO_GRANT_EVENT_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let lastAdminSsoGrantEventCleanupAt = 0;

export interface IAdminSsoGrantEventListOptions {
	actorId?: string;
	actorType?: TSsoActorType;
	clientId?: string;
	endTime?: number;
	event?: TAdminSsoGrantEvent;
	page: number;
	pageSize: number;
	query?: string;
	startTime?: number;
	userId?: string;
}

function checkPagination(options: IAdminSsoGrantEventListOptions) {
	return checkAdminSsoPagination(options);
}

function checkGrantEvent(value: TAdminSsoGrantEvent | undefined) {
	return [
		undefined,
		'admin_revoked',
		'client_deleted',
		'grant_created',
		'grant_refreshed',
		'user_revoked',
	].includes(value);
}

function checkActorType(value: TSsoActorType | undefined) {
	return [undefined, 'admin', 'client', 'system', 'user'].includes(value);
}

function checkTimeRange(options: IAdminSsoGrantEventListOptions) {
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

function checkListOptions(options: IAdminSsoGrantEventListOptions) {
	return (
		checkPagination(options) &&
		checkGrantEvent(options.event) &&
		checkActorType(options.actorType) &&
		checkTimeRange(options)
	);
}

function createNullableUserProfile(
	event: Awaited<ReturnType<typeof listAdminSsoGrantEvents>>['events'][number]
): IAccountUserProfile | null {
	if (
		event.user_id === null ||
		event.user_created_at === null ||
		event.user_state_epoch === null ||
		event.user_status === null ||
		event.user_sync_generation === null ||
		event.user_sync_status === null ||
		event.username === null ||
		event.username_normalized === null
	) {
		return null;
	}

	return createAccountUserProfile({
		created_at: event.user_created_at,
		deleted_at: event.user_deleted_at,
		id: event.user_id,
		last_login_at: event.user_last_login_at,
		nickname: event.user_nickname,
		state_epoch: event.user_state_epoch,
		status: event.user_status,
		sync_generation: event.user_sync_generation,
		sync_status: event.user_sync_status,
		updated_at: event.event_created_at,
		username: event.username,
		username_normalized: event.username_normalized,
	});
}

function createGrantEventRecord(
	event: Awaited<ReturnType<typeof listAdminSsoGrantEvents>>['events'][number]
): IAdminSsoGrantEventRecord {
	return {
		actor_id: event.actor_id,
		actor_type: event.actor_type,
		client:
			event.client_id === null ||
			event.client_name === null ||
			event.client_updated_at === null
				? null
				: {
						disabled_at: event.client_disabled_at,
						id: event.client_id,
						name: event.client_name,
						updated_at: event.client_updated_at,
					},
		created_at: event.event_created_at,
		event: event.event,
		id: event.event_id,
		reason: event.reason,
		user: createNullableUserProfile(event),
	};
}

function createRepositoryListOptions(
	options: IAdminSsoGrantEventListOptions
): IRepositoryAdminSsoGrantEventListOptions {
	return {
		limit: options.pageSize,
		offset: (options.page - 1) * options.pageSize,
		...(options.actorId === undefined ? {} : { actorId: options.actorId }),
		...(options.actorType === undefined
			? {}
			: { actorType: options.actorType }),
		...(options.clientId === undefined
			? {}
			: { clientId: options.clientId }),
		...(options.endTime === undefined ? {} : { endTime: options.endTime }),
		...(options.event === undefined ? {} : { event: options.event }),
		...(options.query === undefined ? {} : { query: options.query }),
		...(options.startTime === undefined
			? {}
			: { startTime: options.startTime }),
		...(options.userId === undefined ? {} : { userId: options.userId }),
	};
}

export async function cleanupAdminSsoGrantEventsBestEffort(now = Date.now()) {
	if (
		now - lastAdminSsoGrantEventCleanupAt <
		ADMIN_SSO_GRANT_EVENT_CLEANUP_INTERVAL_MS
	) {
		return;
	}

	lastAdminSsoGrantEventCleanupAt = now;
	try {
		await cleanupSsoGrantEvents({
			before: now - ADMIN_SSO_GRANT_EVENT_RETENTION_MS,
			maxRows: ADMIN_SSO_GRANT_EVENT_MAX_ROWS,
		});
	} catch (error) {
		console.warn('Failed to clean up SSO grant events.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

export async function listAdminSsoGrantEventRecords(
	options: IAdminSsoGrantEventListOptions
): Promise<TAdminSsoGrantEventServiceResult<IAdminSsoGrantEventListData>> {
	if (!checkListOptions(options)) {
		return { error: 'invalid-object-structure', status: 'error' };
	}
	void cleanupAdminSsoGrantEventsBestEffort();

	const { events, totalCount } = await listAdminSsoGrantEvents(
		createRepositoryListOptions(options)
	);
	const reachableTotalCount = getReachableAdminSsoTotalCount(
		totalCount,
		options.pageSize
	);

	return {
		data: {
			events: events.map(createGrantEventRecord),
			page: options.page,
			page_size: options.pageSize,
			total_count: reachableTotalCount,
			total_pages: Math.ceil(reachableTotalCount / options.pageSize),
		},
		status: 'ok',
	};
}
