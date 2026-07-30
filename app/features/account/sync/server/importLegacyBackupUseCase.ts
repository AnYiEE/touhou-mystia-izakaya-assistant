import { type NextRequest } from 'next/server';

import {
	ACCOUNT_SYNC_STATUS_MAP,
	type TAccountSyncStatus,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import {
	ACCOUNT_AUDIT_ACTION_MAP,
	createAccountAuditValueDigest,
	createAccountUserAuditLogInput,
	writeAccountAuditLog,
	writeAccountAuditLogInTransaction,
} from '@/features/account/server/audit/service';
import type { ISyncImportBackupCodeResponse } from '@/features/account/sync/types';
import * as lockModule from '@/features/legacyBackup/server/backupCodeLock';

import type { TSession, TUser } from '@/infrastructure/database/schema';

import { AccountSyncCapacityExceededError } from './capacity';
import {
	cleanupImportedBackupFile,
	importBackupData,
} from './importLegacyBackup';

export interface IImportLegacyBackupStateSnapshot {
	stateEpoch: number;
	syncGeneration: number;
	syncStatus: TAccountSyncStatus;
}

export interface IImportLegacyBackupCapacityDetails {
	candidateBytes: number;
	currentBytes: number;
	limitBytes: number;
	namespaces: TSyncNamespace[];
}

export interface IImportLegacyBackupUseCaseInput {
	code: string;
	request: NextRequest;
	session: Pick<TSession, 'id' | 'token_hash'>;
	user: Pick<TUser, 'id' | 'state_epoch' | 'sync_generation' | 'sync_status'>;
}

type TImportLegacyBackupSimpleError =
	| 'backup-code-lock-lost'
	| 'backup-code-lock-timeout'
	| 'backup-code-not-found'
	| 'invalid-backup-file'
	| 'server-misconfigured'
	| 'sync-conflict'
	| 'unauthorized';

type TImportLegacyBackupStateError =
	| 'state-epoch-mismatch'
	| 'sync-generation-mismatch'
	| 'sync-paused';

export type TImportLegacyBackupUseCaseResult =
	| {
			error: 'sync-account-capacity-exceeded';
			details: IImportLegacyBackupCapacityDetails;
			status: 'error';
	  }
	| { error: TImportLegacyBackupSimpleError; status: 'error' }
	| {
			error: TImportLegacyBackupStateError;
			state: IImportLegacyBackupStateSnapshot;
			status: 'error';
	  }
	| { results: ISyncImportBackupCodeResponse['results']; status: 'ok' };

function createStateErrorResult(
	error: TImportLegacyBackupStateError,
	state: {
		state_epoch: number;
		sync_generation: number;
		sync_status: TAccountSyncStatus;
	}
): TImportLegacyBackupUseCaseResult {
	return {
		error,
		state: {
			stateEpoch: state.state_epoch,
			syncGeneration: state.sync_generation,
			syncStatus: state.sync_status,
		},
		status: 'error',
	};
}

function createImportErrorResult(
	error: unknown
): TImportLegacyBackupUseCaseResult | null {
	if (error instanceof AccountSyncCapacityExceededError) {
		return {
			details: error.details,
			error: 'sync-account-capacity-exceeded',
			status: 'error',
		};
	}
	if (!(error instanceof Error)) {
		return null;
	}

	if (error.message === 'unauthorized') {
		return { error: 'unauthorized', status: 'error' };
	}
	if (error.message === 'backup-code-not-found') {
		return { error: 'backup-code-not-found', status: 'error' };
	}
	if (error.message === 'invalid-backup-file') {
		return { error: 'invalid-backup-file', status: 'error' };
	}
	if (error.message === 'server-misconfigured') {
		return { error: 'server-misconfigured', status: 'error' };
	}
	if (error.message === 'sync-conflict') {
		return { error: 'sync-conflict', status: 'error' };
	}
	if (error.message === 'backup-code-lock-lost') {
		return { error: 'backup-code-lock-lost', status: 'error' };
	}

	return null;
}

export async function importLegacyBackupUseCase({
	code,
	request,
	session,
	user,
}: IImportLegacyBackupUseCaseInput): Promise<TImportLegacyBackupUseCaseResult> {
	if (user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty) {
		return createStateErrorResult('sync-paused', {
			state_epoch: user.state_epoch,
			sync_generation: user.sync_generation,
			sync_status: user.sync_status,
		});
	}

	const codeDigest = createAccountAuditValueDigest(code);
	const createAuditInput = (
		result: 'already-imported' | 'imported',
		namespaceCount: number,
		stateEpoch: number
	) =>
		createAccountUserAuditLogInput({
			action: ACCOUNT_AUDIT_ACTION_MAP.accountDataImported,
			metadata: {
				backup_code_digest: codeDigest,
				namespace_count: namespaceCount,
				result,
				state_epoch: stateEpoch,
			},
			request,
			userId: user.id,
		});

	try {
		let importedBackupFileName: string | null | undefined;
		const result =
			await lockModule.withBackupCodeLock<TImportLegacyBackupUseCaseResult>(
				code,
				async (signal) => {
					let importResult;
					try {
						importResult = await importBackupData({
							code,
							expectedStateEpoch: user.state_epoch,
							expectedSyncGeneration: user.sync_generation,
							lockModule,
							session,
							signal,
							userId: user.id,
							writeAuditLog: (trx, now, auditResult) =>
								writeAccountAuditLogInTransaction(
									trx,
									createAuditInput(
										'imported',
										auditResult.namespaceCount,
										auditResult.stateEpoch
									),
									now
								),
						});
					} catch (error) {
						const errorResult = createImportErrorResult(error);
						if (errorResult !== null) {
							return errorResult;
						}
						throw error;
					}
					if (importResult.status === 'not-found') {
						return {
							error: 'backup-code-not-found',
							status: 'error',
						};
					}
					if (importResult.status === 'state-epoch-mismatch') {
						return createStateErrorResult(
							'state-epoch-mismatch',
							importResult
						);
					}
					if (importResult.status === 'sync-generation-mismatch') {
						return createStateErrorResult(
							'sync-generation-mismatch',
							importResult
						);
					}
					if (importResult.status === 'sync-paused') {
						return createStateErrorResult(
							'sync-paused',
							importResult
						);
					}
					if (importResult.status === 'already-imported') {
						await writeAccountAuditLog(
							createAuditInput(
								'already-imported',
								importResult.results.length,
								user.state_epoch
							)
						);
						return { results: importResult.results, status: 'ok' };
					}

					lockModule.markBackupCodeLockCommitted(signal);
					importedBackupFileName = importResult.fileName;

					return { results: importResult.results, status: 'ok' };
				}
			);
		if (importedBackupFileName !== undefined) {
			void cleanupImportedBackupFile(code, importedBackupFileName);
		}

		return result;
	} catch (error) {
		if (lockModule.checkBackupCodeLockLostError(error)) {
			return { error: 'backup-code-lock-lost', status: 'error' };
		}
		if (lockModule.checkBackupCodeLockTimeoutError(error)) {
			return { error: 'backup-code-lock-timeout', status: 'error' };
		}

		throw error;
	}
}
