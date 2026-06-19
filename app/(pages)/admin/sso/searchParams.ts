import type {
	TAdminSsoCallbackDeliveryStatus,
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
	TAdminSsoTicketStatus,
	TUserStatus,
} from '@/lib/account/shared/types';

type TAdminSsoSearchParamValue = string | string[] | undefined;

export interface IAdminSsoSearchParams {
	[key: string]: TAdminSsoSearchParamValue;

	action?: TAdminSsoSearchParamValue;
	actor_id?: TAdminSsoSearchParamValue;
	actor_type?: TAdminSsoSearchParamValue;
	callback?: TAdminSsoSearchParamValue;
	client_id?: TAdminSsoSearchParamValue;
	client_status?: TAdminSsoSearchParamValue;
	end_time?: TAdminSsoSearchParamValue;
	event?: TAdminSsoSearchParamValue;
	has_grants?: TAdminSsoSearchParamValue;
	page?: TAdminSsoSearchParamValue;
	query?: TAdminSsoSearchParamValue;
	scope?: TAdminSsoSearchParamValue;
	start_time?: TAdminSsoSearchParamValue;
	status?: TAdminSsoSearchParamValue;
	target_id?: TAdminSsoSearchParamValue;
	target_type?: TAdminSsoSearchParamValue;
	user_id?: TAdminSsoSearchParamValue;
	user_status?: TAdminSsoSearchParamValue;
}

export type TAdminSsoActorType = 'admin' | 'client' | 'system' | 'user';
export type TAdminSsoCallbackConfig = 'configured' | 'missing';
export type TAdminSsoClientStatus = 'active' | 'disabled';
export type TAdminSsoGrantPresence = 'has' | 'none';

export function getAdminSsoSingleSearchValue(value: TAdminSsoSearchParamValue) {
	return Array.isArray(value) ? value[0] : value;
}

export function getAdminSsoPageFromSearchValue(
	value: TAdminSsoSearchParamValue
) {
	const page = Number.parseInt(getAdminSsoSingleSearchValue(value) ?? '', 10);

	return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10_000) : 1;
}

export function getAdminSsoTrimmedSearchValue(
	value: TAdminSsoSearchParamValue
) {
	const trimmedValue = getAdminSsoSingleSearchValue(value)?.trim() ?? '';

	return trimmedValue === '' ? undefined : trimmedValue;
}

export function getAdminSsoClientStatusFromSearchValue(
	value: TAdminSsoSearchParamValue
): TAdminSsoClientStatus | undefined {
	const searchValue = getAdminSsoSingleSearchValue(value);
	switch (searchValue) {
		case 'active':
		case 'disabled':
			return searchValue;
		default:
			return undefined;
	}
}

export function getAdminSsoCallbackConfigFromSearchValue(
	value: TAdminSsoSearchParamValue
): TAdminSsoCallbackConfig | undefined {
	const searchValue = getAdminSsoSingleSearchValue(value);
	switch (searchValue) {
		case 'configured':
		case 'missing':
			return searchValue;
		default:
			return undefined;
	}
}

export function getAdminSsoGrantPresenceFromSearchValue(
	value: TAdminSsoSearchParamValue
): TAdminSsoGrantPresence | undefined {
	switch (getAdminSsoSingleSearchValue(value)) {
		case '1':
		case 'true':
		case 'has':
			return 'has';
		case '0':
		case 'false':
		case 'none':
			return 'none';
		default:
			return undefined;
	}
}

export function getAdminSsoUserStatusFromSearchValue(
	value: TAdminSsoSearchParamValue
): TUserStatus | undefined {
	const searchValue = getAdminSsoSingleSearchValue(value);
	switch (searchValue) {
		case 'active':
		case 'deleted':
		case 'disabled':
			return searchValue;
		default:
			return undefined;
	}
}

export function getAdminSsoCallbackEventFromSearchValue(
	value: TAdminSsoSearchParamValue
): TAdminSsoCallbackEvent | undefined {
	const searchValue = getAdminSsoSingleSearchValue(value);
	switch (searchValue) {
		case 'client_deleted':
		case 'client_disabled':
		case 'grant_revoked':
		case 'secret_rotated':
		case 'user_deleted':
		case 'user_disabled':
		case 'user_profile_updated':
			return searchValue;
		default:
			return undefined;
	}
}

export function getAdminSsoCallbackQueueStatusFromSearchValue(
	value: TAdminSsoSearchParamValue
): TAdminSsoCallbackQueueStatus | undefined {
	const searchValue = getAdminSsoSingleSearchValue(value);
	switch (searchValue) {
		case 'final_failed':
		case 'pending':
		case 'retrying':
			return searchValue;
		default:
			return undefined;
	}
}

export function getAdminSsoCallbackDeliveryStatusFromSearchValue(
	value: TAdminSsoSearchParamValue
): TAdminSsoCallbackDeliveryStatus | undefined {
	const searchValue = getAdminSsoSingleSearchValue(value);
	switch (searchValue) {
		case 'failed':
		case 'final_failed':
		case 'succeeded':
			return searchValue;
		default:
			return undefined;
	}
}

export function getAdminSsoTicketStatusFromSearchValue(
	value: TAdminSsoSearchParamValue
): TAdminSsoTicketStatus | undefined {
	const searchValue = getAdminSsoSingleSearchValue(value);
	switch (searchValue) {
		case 'expired':
		case 'pending':
		case 'revoked':
		case 'used':
			return searchValue;
		default:
			return undefined;
	}
}

export function getAdminSsoActorTypeFromSearchValue(
	value: TAdminSsoSearchParamValue
): TAdminSsoActorType | undefined {
	const searchValue = getAdminSsoSingleSearchValue(value);
	switch (searchValue) {
		case 'admin':
		case 'client':
		case 'system':
		case 'user':
			return searchValue;
		default:
			return undefined;
	}
}

export function getAdminSsoTimeFromSearchValue(
	value: TAdminSsoSearchParamValue
) {
	const timestamp = Number.parseInt(
		getAdminSsoSingleSearchValue(value) ?? '',
		10
	);

	return Number.isSafeInteger(timestamp) && timestamp >= 0
		? timestamp
		: undefined;
}
