import { type Transaction, sql } from 'kysely';

import { createAccountHmac } from '@/lib/account/server/crypto';
import { getAccountDatabase } from '@/lib/account/server/db';
import { TABLE_NAME_MAP } from '@/lib/db';
import {
	type TAccountAuditLog,
	type TAccountAuditLogNew,
	type TDatabase,
	type TSsoActorType,
} from '@/lib/db/types';

const AUDIT_LOG_TABLE_NAME = TABLE_NAME_MAP.accountAuditLog;
const AUDIT_METADATA_MAX_KEYS = 24;
const AUDIT_METADATA_MAX_STRING_LENGTH = 256;
const AUDIT_METADATA_JSON_MAX_LENGTH = 4096;
const SENSITIVE_AUDIT_METADATA_KEY_PATTERN =
	/(secret|token|ticket|hash|password|credential|authorization|cookie|session)/iu;

export interface IAuditLogWriteInput {
	action: string;
	actorId: string | null;
	actorType: TSsoActorType;
	ipAddress?: string | null;
	metadata?: Record<string, unknown>;
	scope: string;
	targetId: string | null;
	targetType: string;
	userAgent?: string | null;
}

export interface IAuditLogListOptions {
	action?: string;
	actorId?: string;
	actorType?: TSsoActorType;
	endTime?: number;
	limit: number;
	offset: number;
	query?: string;
	scope?: string;
	startTime?: number;
	targetId?: string;
	targetType?: string;
}

export interface IAuditLogCleanupOptions {
	before?: number;
	maxRows?: number;
	scope?: string;
}

export interface IAuditLogCleanupResult {
	deletedByAge: number;
	deletedByCap: number;
}

export interface IListAuditLogsResult {
	logs: TAccountAuditLog[];
	totalCount: number;
}

function createAuditHash(value: string | null | undefined) {
	const trimmedValue = value?.trim() ?? '';

	return trimmedValue === ''
		? null
		: `hmac-sha256:${createAccountHmac(
				'audit-value:v1',
				trimmedValue
			).slice(0, 32)}`;
}

function normalizeTotalCount(value: number | string | bigint) {
	const totalCount = Number(value);

	if (!Number.isSafeInteger(totalCount) || totalCount < 0) {
		throw new Error('invalid-audit-log-count');
	}

	return totalCount;
}

function sanitizeAuditMetadataValue(
	value: unknown
): boolean | null | number | string | undefined {
	if (value === null || typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : String(value);
	}
	if (typeof value === 'string') {
		return value.slice(0, AUDIT_METADATA_MAX_STRING_LENGTH);
	}

	return undefined;
}

function serializeAuditMetadata(metadata: Record<string, unknown> | undefined) {
	const sanitizedMetadata: Record<string, boolean | null | number | string> =
		{};
	for (const [key, value] of Object.entries(metadata ?? {}).slice(
		0,
		AUDIT_METADATA_MAX_KEYS
	)) {
		if (SENSITIVE_AUDIT_METADATA_KEY_PATTERN.test(key)) {
			continue;
		}

		const sanitizedValue = sanitizeAuditMetadataValue(value);
		if (sanitizedValue !== undefined) {
			sanitizedMetadata[key.slice(0, 64)] = sanitizedValue;
		}
	}

	const serializedValue = JSON.stringify(sanitizedMetadata);
	if (serializedValue.length > AUDIT_METADATA_JSON_MAX_LENGTH) {
		throw new Error('invalid-audit-log-metadata');
	}

	return serializedValue;
}

function createAuditLogRecord(
	input: IAuditLogWriteInput,
	now: number
): TAccountAuditLogNew {
	return {
		action: input.action,
		actor_id: input.actorId,
		actor_type: input.actorType,
		created_at: now,
		ip_hash: createAuditHash(input.ipAddress),
		metadata_json: serializeAuditMetadata(input.metadata),
		scope: input.scope,
		target_id: input.targetId,
		target_type: input.targetType,
		user_agent_hash: createAuditHash(input.userAgent),
	};
}

function escapeLikePattern(pattern: string) {
	return pattern.replaceAll(/[\\%_]/gu, (character) => `\\${character}`);
}

export async function writeAuditLog(
	input: IAuditLogWriteInput,
	now = Date.now()
) {
	const db = await getAccountDatabase();

	await db
		.insertInto(AUDIT_LOG_TABLE_NAME)
		.values(createAuditLogRecord(input, now))
		.execute();
}

export async function writeAuditLogInTransaction(
	trx: Transaction<TDatabase>,
	input: IAuditLogWriteInput,
	now = Date.now()
) {
	await trx
		.insertInto(AUDIT_LOG_TABLE_NAME)
		.values(createAuditLogRecord(input, now))
		.execute();
}

export async function listAuditLogs({
	action,
	actorId,
	actorType,
	endTime,
	limit,
	offset,
	query: searchQuery,
	scope,
	startTime,
	targetId,
	targetType,
}: IAuditLogListOptions): Promise<IListAuditLogsResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let logsQuery = db.selectFrom(AUDIT_LOG_TABLE_NAME).selectAll();
	let totalCountQuery = db
		.selectFrom(AUDIT_LOG_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('total_count'));

	if (scope !== undefined) {
		logsQuery = logsQuery.where('scope', '=', scope);
		totalCountQuery = totalCountQuery.where('scope', '=', scope);
	}
	if (action !== undefined) {
		logsQuery = logsQuery.where('action', '=', action);
		totalCountQuery = totalCountQuery.where('action', '=', action);
	}
	if (actorId !== undefined) {
		logsQuery = logsQuery.where('actor_id', '=', actorId);
		totalCountQuery = totalCountQuery.where('actor_id', '=', actorId);
	}
	if (actorType !== undefined) {
		logsQuery = logsQuery.where('actor_type', '=', actorType);
		totalCountQuery = totalCountQuery.where('actor_type', '=', actorType);
	}
	if (targetId !== undefined) {
		logsQuery = logsQuery.where('target_id', '=', targetId);
		totalCountQuery = totalCountQuery.where('target_id', '=', targetId);
	}
	if (targetType !== undefined) {
		logsQuery = logsQuery.where('target_type', '=', targetType);
		totalCountQuery = totalCountQuery.where('target_type', '=', targetType);
	}
	if (startTime !== undefined) {
		logsQuery = logsQuery.where('created_at', '>=', startTime);
		totalCountQuery = totalCountQuery.where('created_at', '>=', startTime);
	}
	if (endTime !== undefined) {
		logsQuery = logsQuery.where('created_at', '<=', endTime);
		totalCountQuery = totalCountQuery.where('created_at', '<=', endTime);
	}
	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const likePattern = `%${escapeLikePattern(normalizedSearchQuery)}%`;
		logsQuery = logsQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('scope')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('action')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('actor_id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('target_type')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('target_id')} like ${likePattern} escape '\\'`,
			])
		);
		totalCountQuery = totalCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('scope')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('action')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('actor_id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('target_type')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('target_id')} like ${likePattern} escape '\\'`,
			])
		);
	}

	const [logs, totalCountRecord] = await Promise.all([
		logsQuery
			.orderBy('created_at', 'desc')
			.orderBy('id', 'desc')
			.limit(limit)
			.offset(offset)
			.execute(),
		totalCountQuery.executeTakeFirstOrThrow(),
	]);

	return {
		logs,
		totalCount: normalizeTotalCount(totalCountRecord.total_count),
	};
}

export async function cleanupAuditLogs({
	before,
	maxRows,
	scope,
}: IAuditLogCleanupOptions): Promise<IAuditLogCleanupResult> {
	const db = await getAccountDatabase();
	let deletedByAge = 0;
	let deletedByCap = 0;

	if (before !== undefined) {
		let deleteQuery = db
			.deleteFrom(AUDIT_LOG_TABLE_NAME)
			.where('created_at', '<', before);
		if (scope !== undefined) {
			deleteQuery = deleteQuery.where('scope', '=', scope);
		}

		const result = await deleteQuery.executeTakeFirst();
		deletedByAge = Number(result.numDeletedRows);
	}

	if (maxRows !== undefined && maxRows >= 0) {
		let cutoffQuery = db.selectFrom(AUDIT_LOG_TABLE_NAME);
		if (scope !== undefined) {
			cutoffQuery = cutoffQuery.where('scope', '=', scope);
		}
		const cutoff = await cutoffQuery
			.select(['created_at', 'id'])
			.orderBy('created_at', 'desc')
			.orderBy('id', 'desc')
			.offset(maxRows)
			.limit(1)
			.executeTakeFirst();

		if (cutoff !== undefined) {
			let deleteQuery = db
				.deleteFrom(AUDIT_LOG_TABLE_NAME)
				.where((eb) =>
					eb.or([
						eb('created_at', '<', cutoff.created_at),
						eb.and([
							eb('created_at', '=', cutoff.created_at),
							eb('id', '<=', cutoff.id),
						]),
					])
				);
			if (scope !== undefined) {
				deleteQuery = deleteQuery.where('scope', '=', scope);
			}

			const result = await deleteQuery.executeTakeFirst();
			deletedByCap = Number(result.numDeletedRows);
		}
	}

	return { deletedByAge, deletedByCap };
}
