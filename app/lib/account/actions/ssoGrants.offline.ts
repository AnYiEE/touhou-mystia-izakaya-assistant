import { type TAccountActionResult } from '@/lib/account/actions/utils';
import { type IAccountSsoGrantListData } from '@/lib/account/shared/types';

export type TAccountSsoGrantActionResult<TData = Record<string, unknown>> =
	TAccountActionResult<TData>;

function createOfflineAccountActionError<
	TData = Record<string, unknown>,
>(): Extract<TAccountSsoGrantActionResult<TData>, { status: 'error' }> {
	return {
		httpStatus: 503,
		message: 'account-disabled-offline',
		status: 'error',
	};
}

export function refreshAccountSsoGrantsAction() {
	return Promise.resolve(
		createOfflineAccountActionError<IAccountSsoGrantListData>()
	);
}

export function revokeAccountSsoGrantAction(
	clientId: unknown,
	csrfToken: unknown
) {
	void clientId;
	void csrfToken;
	return Promise.resolve(
		createOfflineAccountActionError<{
			client_id: string;
			message: 'sso-grant-revoked';
		}>()
	);
}
