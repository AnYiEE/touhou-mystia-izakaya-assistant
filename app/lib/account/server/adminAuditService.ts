import { type Transaction } from 'kysely';

import {
	type IAdminAuditLogListData,
	type IAdminAuditLogRecord,
} from '@/lib/account/shared/types';
import { type TDatabase, type TSsoActorType } from '@/lib/db/types';
import {
	type IAuditLogWriteInput,
	cleanupAuditLogs,
	listAuditLogs,
	writeAuditLog,
	writeAuditLogInTransaction,
} from '@/lib/account/server/repositories/auditLogs';
import { getLogSafeErrorCode } from '@/lib/logging';

export const ADMIN_AUDIT_LOG_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
export const ADMIN_AUDIT_LOG_MAX_ROWS = 100_000;
const ADMIN_AUDIT_LOG_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
export const ADMIN_AUDIT_LOG_MAX_OFFSET = 5000;
const ADMIN_AUDIT_LOG_MIN_QUERY_LENGTH = 2;

let lastAdminAuditLogCleanupAt = 0;

export type TAdminAuditServiceError = 'invalid-object-structure';

export type TAdminAuditServiceResult<TData> =
	| { data: TData; status: 'ok' }
	| { error: TAdminAuditServiceError; status: 'error' };

export const ADMIN_AUDIT_SERVICE_ERROR_STATUS_MAP: Record<
	TAdminAuditServiceError,
	number
> = { 'invalid-object-structure': 400 };

export interface IAdminAuditLogListOptions {
	action?: string;
	actorId?: string;
	actorType?: TSsoActorType;
	endTime?: number;
	page: number;
	pageSize: number;
	query?: string;
	scope?: string;
	startTime?: number;
	targetId?: string;
	targetType?: string;
}

function checkPagination(options: IAdminAuditLogListOptions) {
	return (
		Number.isSafeInteger(options.page) &&
		options.page >= 1 &&
		Number.isSafeInteger(options.pageSize) &&
		options.pageSize >= 1 &&
		options.pageSize <= 100 &&
		(options.page - 1) * options.pageSize <= ADMIN_AUDIT_LOG_MAX_OFFSET
	);
}

function checkSearchQuery(value: string | undefined) {
	return (
		value === undefined ||
		value.trim().length >= ADMIN_AUDIT_LOG_MIN_QUERY_LENGTH
	);
}

function checkActorType(value: TSsoActorType | undefined) {
	return [undefined, 'admin', 'client', 'system', 'user'].includes(value);
}

function checkTimeRange(options: IAdminAuditLogListOptions) {
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

function checkListOptions(options: IAdminAuditLogListOptions) {
	return (
		checkPagination(options) &&
		checkActorType(options.actorType) &&
		checkSearchQuery(options.query) &&
		checkTimeRange(options)
	);
}

function parseMetadataJson(value: string): Record<string, unknown> {
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

function createAuditLogRecord(
	log: Awaited<ReturnType<typeof listAuditLogs>>['logs'][number]
): IAdminAuditLogRecord {
	return {
		action: log.action,
		actor_id: log.actor_id,
		actor_type: log.actor_type,
		created_at: log.created_at,
		id: log.id,
		ip_hash: log.ip_hash,
		metadata: parseMetadataJson(log.metadata_json),
		scope: log.scope,
		target_id: log.target_id,
		target_type: log.target_type,
		user_agent_hash: log.user_agent_hash,
	};
}

export async function listAdminAuditLogs(
	options: IAdminAuditLogListOptions
): Promise<TAdminAuditServiceResult<IAdminAuditLogListData>> {
	if (!checkListOptions(options)) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const { logs, totalCount } = await listAuditLogs({
		limit: options.pageSize,
		offset: (options.page - 1) * options.pageSize,
		...(options.action === undefined ? {} : { action: options.action }),
		...(options.actorId === undefined ? {} : { actorId: options.actorId }),
		...(options.actorType === undefined
			? {}
			: { actorType: options.actorType }),
		...(options.endTime === undefined ? {} : { endTime: options.endTime }),
		...(options.query === undefined ? {} : { query: options.query }),
		...(options.scope === undefined ? {} : { scope: options.scope }),
		...(options.startTime === undefined
			? {}
			: { startTime: options.startTime }),
		...(options.targetId === undefined
			? {}
			: { targetId: options.targetId }),
		...(options.targetType === undefined
			? {}
			: { targetType: options.targetType }),
	});
	const reachableTotalCount = Math.min(
		totalCount,
		ADMIN_AUDIT_LOG_MAX_OFFSET + options.pageSize
	);

	return {
		data: {
			logs: logs.map(createAuditLogRecord),
			page: options.page,
			page_size: options.pageSize,
			total_count: reachableTotalCount,
			total_pages: Math.ceil(reachableTotalCount / options.pageSize),
		},
		status: 'ok',
	};
}

export async function cleanupAdminAuditLogsBestEffort(now = Date.now()) {
	if (
		now - lastAdminAuditLogCleanupAt <
		ADMIN_AUDIT_LOG_CLEANUP_INTERVAL_MS
	) {
		return;
	}

	lastAdminAuditLogCleanupAt = now;
	try {
		await cleanupAuditLogs({
			before: now - ADMIN_AUDIT_LOG_RETENTION_MS,
			maxRows: ADMIN_AUDIT_LOG_MAX_ROWS,
		});
	} catch (error) {
		console.warn('Failed to clean up admin audit logs.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

export async function writeAdminAuditLogInTransaction(
	trx: Transaction<TDatabase>,
	input: IAuditLogWriteInput,
	now = Date.now()
) {
	await writeAuditLogInTransaction(trx, input, now);
}

export async function writeAdminAuditLog(input: IAuditLogWriteInput) {
	try {
		await writeAuditLog(input);
		void cleanupAdminAuditLogsBestEffort();
		return {
			data: { message: 'audit-log-written' },
			status: 'ok',
		} as const;
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === 'invalid-audit-log-metadata'
		) {
			return {
				error: 'invalid-object-structure',
				status: 'error',
			} as const;
		}

		throw error;
	}
}

export async function writeAdminAuditLogBestEffort(input: IAuditLogWriteInput) {
	try {
		await writeAuditLog(input);
		void cleanupAdminAuditLogsBestEffort();
	} catch (error) {
		console.warn('Failed to write admin audit log.', {
			action: input.action,
			errorCode: getLogSafeErrorCode(error),
			scope: input.scope,
			targetType: input.targetType,
		});
	}
}
