import { type Transaction } from 'kysely';

import { type TSsoActorType } from '@/domain/account/contracts';

import type {
	IAdminAuditLogListData,
	IAdminAuditLogRecord,
} from '@/features/account/contracts';
import type { IAuditLogWriteInput } from '@/features/account/server/audit/contracts';
import {
	cleanupAuditLogs,
	listAuditLogs,
	writeAuditLog,
	writeAuditLogInTransaction,
} from '@/features/account/server/audit/repository';
import {
	checkAdminPagination,
	getReachableAdminTotalCount,
} from '@/features/admin/server/pagination';
import { checkAdminTimeRange } from '@/features/admin/server/validation/timeRange';

import type { TDatabase } from '@/infrastructure/database/schema';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	isNonNegativeSafeInteger,
	isPositiveSafeInteger,
} from '@/shared/utilities/numbers/check';
import { parseJsonObjectOrEmpty } from '@/shared/utilities/objects/parseJsonObjectOrEmpty';

export const ADMIN_AUDIT_LOG_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
export const ADMIN_AUDIT_LOG_MAX_ROWS = 100_000;
const ADMIN_AUDIT_LOG_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
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
	return checkAdminPagination(options);
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

function checkListOptions(options: IAdminAuditLogListOptions) {
	return (
		checkPagination(options) &&
		checkActorType(options.actorType) &&
		checkSearchQuery(options.query) &&
		checkAdminTimeRange(options)
	);
}

function createAuditLogRecord(
	log: Awaited<ReturnType<typeof listAuditLogs>>['logs'][number]
): IAdminAuditLogRecord {
	if (
		!isPositiveSafeInteger(log.id) ||
		!isNonNegativeSafeInteger(log.created_at)
	) {
		throw new Error('invalid-admin-audit-log-record');
	}

	return {
		action: log.action,
		actor_id: log.actor_id,
		actor_type: log.actor_type,
		created_at: log.created_at,
		id: log.id,
		ip_hash: log.ip_hash,
		metadata: parseJsonObjectOrEmpty(log.metadata_json),
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
	const reachableTotalCount = getReachableAdminTotalCount(
		totalCount,
		options.pageSize
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
			Error.isError(error) &&
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
