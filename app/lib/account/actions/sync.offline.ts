import { type TAccountActionResult } from '@/lib/account/actions/utils';
import {
	type ISyncImportBackupCodeResponse,
	type ISyncStateGetResponse,
	type ISyncStatePutResponse,
} from '@/lib/account/sync';

export type TAccountSyncActionResult<TData = Record<string, unknown>> =
	TAccountActionResult<TData>;

function createOfflineAccountActionError<
	TData = Record<string, unknown>,
>(): Extract<TAccountSyncActionResult<TData>, { status: 'error' }> {
	return {
		httpStatus: 503,
		message: 'account-disabled-offline',
		status: 'error',
	};
}

export function fetchSyncStateAction(namespaces: unknown = []) {
	void namespaces;
	return Promise.resolve(
		createOfflineAccountActionError<ISyncStateGetResponse>()
	);
}

export function putSyncStateAction(body: unknown, csrfToken: unknown) {
	void body;
	void csrfToken;
	return Promise.resolve(
		createOfflineAccountActionError<ISyncStatePutResponse>()
	);
}

export function importBackupCodeAction(code: unknown, csrfToken: unknown) {
	void code;
	void csrfToken;
	return Promise.resolve(
		createOfflineAccountActionError<ISyncImportBackupCodeResponse>()
	);
}
