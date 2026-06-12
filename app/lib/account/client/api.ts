import {
	type TAccountSyncActionResult,
	fetchSyncStateAction,
	importBackupCodeAction,
	putSyncStateAction,
} from '@/lib/account/actions/sync';
import {
	type ISyncImportBackupCodeResponse,
	type ISyncStateGetResponse,
	type ISyncStatePingBody,
	type ISyncStatePutBody,
	type ISyncStatePutResponse,
} from '@/lib/account/sync';

export class AccountApiError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = 'AccountApiError';
		this.status = status;
	}
}

function readAccountActionResult<T>(result: TAccountSyncActionResult<T>) {
	if (result.status === 'error') {
		throw new AccountApiError(result.message, result.httpStatus);
	}

	return result.data;
}

export async function fetchSyncState(namespaces: string[] = []) {
	return readAccountActionResult<ISyncStateGetResponse>(
		await fetchSyncStateAction(namespaces)
	);
}

export async function putSyncState(body: ISyncStatePutBody, csrfToken: string) {
	return readAccountActionResult<ISyncStatePutResponse>(
		await putSyncStateAction(body, csrfToken)
	);
}

export async function importBackupCode(code: string, csrfToken: string) {
	return readAccountActionResult<ISyncImportBackupCodeResponse>(
		await importBackupCodeAction(code, csrfToken)
	);
}

export function sendSyncPing(body: ISyncStatePingBody) {
	if (
		typeof navigator === 'undefined' ||
		typeof navigator.sendBeacon !== 'function'
	) {
		return false;
	}

	try {
		return navigator.sendBeacon(
			'/api/v1/sync/ping',
			new Blob([JSON.stringify(body)], { type: 'application/json' })
		);
	} catch {
		return false;
	}
}
