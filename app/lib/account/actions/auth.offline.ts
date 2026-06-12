import { type TAccountActionResult } from '@/lib/account/actions/utils';
import {
	type IAccountExportData,
	type IAuthLoginSuccessResponse,
	type TAccountMeResponse,
} from '@/lib/account/shared/types';

export type TAuthLoginSuccessActionData = IAuthLoginSuccessResponse & {
	redirect_to?: string;
};

export type TAccountAuthActionResult<TData = Record<string, unknown>> =
	TAccountActionResult<TData>;

function createOfflineAccountActionError<
	TData = Record<string, unknown>,
>(): Extract<TAccountActionResult<TData>, { status: 'error' }> {
	return {
		httpStatus: 503,
		message: 'account-disabled-offline',
		status: 'error',
	};
}

export function loginAccountAction(body: unknown) {
	void body;
	return Promise.resolve(
		createOfflineAccountActionError<TAuthLoginSuccessActionData>()
	);
}

export function fetchAccountMeAction() {
	return Promise.resolve(
		createOfflineAccountActionError<TAccountMeResponse>()
	);
}

export function registerAccountAction(body: unknown) {
	void body;
	return Promise.resolve(
		createOfflineAccountActionError<TAuthLoginSuccessActionData>()
	);
}

export function changeAccountPasswordAction(body: unknown, csrfToken: unknown) {
	void body;
	void csrfToken;
	return Promise.resolve(createOfflineAccountActionError());
}

export function logoutAccountAction(csrfToken: unknown) {
	void csrfToken;
	return Promise.resolve(createOfflineAccountActionError());
}

export function logoutAllAccountAction(csrfToken: unknown) {
	void csrfToken;
	return Promise.resolve(createOfflineAccountActionError());
}

export function exportAccountDataAction() {
	return Promise.resolve(
		createOfflineAccountActionError<IAccountExportData>()
	);
}

export function deleteAccountDataAction(csrfToken: unknown) {
	void csrfToken;
	return Promise.resolve(createOfflineAccountActionError());
}

export function deleteAccountAction(csrfToken: unknown) {
	void csrfToken;
	return Promise.resolve(createOfflineAccountActionError());
}
