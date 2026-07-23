import {
	type ISyncStateChange,
	type ISyncStateItemConflict,
	type ISyncStatePutBody,
	type ISyncStateRecord,
	type TSyncNamespace,
	type TSyncStatePutResult,
	checkSupportedSyncSchemaVersion,
} from '@/lib/account/sync';
import {
	checkSyncNamespace,
	validateSyncStateData,
} from '@/lib/account/sync/validation';
import { isNonNegativeSafeInteger } from '@/lib/account/sync/serializers/utils';
import { getLogSafeErrorCode } from '@/lib/logging';
import {
	type TSession,
	type TUser,
	type TUserState,
	type TUserStateNew,
} from '@/lib/db/types';

export type TSyncConflictParseMode = 'fail' | 'item-error';

type TUserSyncState = Pick<
	TUser,
	'state_epoch' | 'sync_generation' | 'sync_status'
>;

type TPutSyncStateChangesResult =
	| { results: TSyncStatePutResult[]; status: 'ok' }
	| { status: 'corrupt-user-state' }
	| { status: 'unauthorized' }
	| (TUserSyncState & { status: 'sync-paused' })
	| (TUserSyncState & { status: 'sync-generation-mismatch' })
	| (TUserSyncState & { status: 'state-epoch-mismatch' });

export function createUserStateRecord(
	userId: string,
	change: ISyncStateChange,
	revision: number,
	updatedAt: number
): TUserStateNew | null {
	try {
		return {
			data: JSON.stringify(change.data),
			namespace: change.namespace,
			revision,
			schema_version: change.schema_version,
			updated_at: updatedAt,
			user_id: userId,
		};
	} catch {
		return null;
	}
}

export function parseUserStateData(
	record: Pick<TUserState, 'data' | 'namespace' | 'schema_version'>
) {
	if (
		!checkSyncNamespace(record.namespace) ||
		!checkSupportedSyncSchemaVersion(
			record.namespace,
			record.schema_version
		)
	) {
		throw new Error('invalid-user-state-data');
	}

	const data: unknown = JSON.parse(record.data);
	const change = {
		data,
		namespace: record.namespace,
		revision: 0,
		schema_version: record.schema_version,
	} satisfies ISyncStateChange;
	if (!validateSyncStateData(change)) {
		throw new Error('invalid-user-state-data');
	}

	return data;
}

export function parseUserStateRecord(record: TUserState): ISyncStateRecord {
	if (
		!isNonNegativeSafeInteger(record.revision) ||
		record.revision >= Number.MAX_SAFE_INTEGER ||
		!isNonNegativeSafeInteger(record.updated_at)
	) {
		throw new Error('invalid-user-state-data');
	}

	return {
		data: parseUserStateData(record),
		namespace: record.namespace,
		revision: record.revision,
		schema_version: record.schema_version,
		updated_at: record.updated_at,
	};
}

export function createConflictResult(
	namespace: ISyncStateItemConflict['namespace'],
	current: TUserState | null
): ISyncStateItemConflict {
	const record = current === null ? null : parseUserStateRecord(current);

	return {
		data: record?.data ?? null,
		namespace,
		revision: record?.revision ?? 0,
		schema_version: record?.schema_version ?? 0,
		status: 'conflict',
		updated_at: record?.updated_at ?? 0,
	};
}

export async function putSyncStateChanges({
	body,
	conflictParseMode,
	session,
	userId,
}: {
	body: ISyncStatePutBody;
	conflictParseMode: TSyncConflictParseMode;
	session: Pick<TSession, 'id' | 'token_hash'>;
	userId: TUser['id'];
}): Promise<TPutSyncStateChangesResult> {
	const userStateModule =
		await import('@/lib/account/server/repositories/userState');
	const results: TSyncStatePutResult[] = [];
	const batchUpdatedAt = Date.now();
	const preparedChanges = body.changes.map((change) => {
		const nextRevision = change.revision + 1;
		const record = createUserStateRecord(
			userId,
			change,
			nextRevision,
			batchUpdatedAt
		);
		if (record === null) {
			return {
				result: {
					message: 'internal-write-error',
					namespace: change.namespace,
					status: 'error',
				} satisfies TSyncStatePutResult,
				status: 'error' as const,
			};
		}

		return { change, record, status: 'ready' as const };
	});
	const readyChanges = preparedChanges.filter(
		(
			change
		): change is Extract<
			(typeof preparedChanges)[number],
			{ status: 'ready' }
		> => change.status === 'ready'
	);
	const writeResult = await userStateModule.putUserStateEntriesIfRevision(
		readyChanges.map((change) => ({
			entry: change.record,
			expectedRevision: change.change.revision,
		})),
		body.state_epoch,
		body.sync_generation,
		session,
		userId
	);
	if (writeResult.status === 'unauthorized') {
		return { status: 'unauthorized' };
	}
	if (writeResult.status === 'state-epoch-mismatch') {
		return writeResult;
	}
	if (
		writeResult.status === 'sync-paused' ||
		writeResult.status === 'sync-generation-mismatch'
	) {
		return writeResult;
	}
	if (writeResult.status === 'corrupt-user-state') {
		return { status: 'corrupt-user-state' };
	}

	let writeResultIndex = 0;
	for (const preparedChange of preparedChanges) {
		if (preparedChange.status === 'error') {
			results.push(preparedChange.result);
			continue;
		}

		const result = writeResult.results[writeResultIndex++];
		if (result === undefined) {
			results.push({
				message: 'internal-write-error',
				namespace: preparedChange.change.namespace,
				status: 'error',
			});
			continue;
		}
		if (result.status === 'capacity-exceeded') {
			results.push({
				candidate_bytes: result.candidate_bytes,
				candidate_namespace_bytes: result.candidate_namespace_bytes,
				current_bytes: result.current_bytes,
				current_namespace_bytes: result.current_namespace_bytes,
				limit_bytes: result.limit_bytes,
				message: 'sync-account-capacity-exceeded',
				namespace: preparedChange.change.namespace,
				namespaces: result.namespaces,
				status: 'error',
			});
			continue;
		}
		if (result.status === 'schema-version-downgrade') {
			results.push({
				current_schema_version: result.current_schema_version,
				message: 'sync-schema-update-required',
				namespace: preparedChange.change.namespace,
				status: 'error',
			});
			continue;
		}
		if (result.status === 'conflict') {
			try {
				results.push(
					createConflictResult(
						preparedChange.change.namespace,
						result.current
					)
				);
			} catch (error) {
				console.warn('Failed to parse conflicting sync state.', {
					errorCode: getLogSafeErrorCode(error),
				});
				if (conflictParseMode === 'fail') {
					return { status: 'corrupt-user-state' };
				}

				results.push({
					message: 'corrupt-user-state',
					namespace: preparedChange.change.namespace,
					status: 'error',
				});
			}
			continue;
		}

		results.push({
			namespace: preparedChange.change.namespace,
			revision: result.entry.revision,
			status: 'ok',
			updated_at: result.entry.updated_at,
		});
	}

	return { results, status: 'ok' };
}

export function isSyncStateNamespace(value: unknown): value is TSyncNamespace {
	return checkSyncNamespace(value);
}
