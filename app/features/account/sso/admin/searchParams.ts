import { type TUserStatus } from '@/domain/account/contracts';

import type {
	TAdminSsoCallbackDeliveryStatus,
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
	TAdminSsoTicketStatus,
} from '@/features/account/contracts';
import {
	type IAdminSearchParams,
	type TAdminSearchParamValue,
	getAdminSingleSearchValue,
} from '@/features/admin/searchParams';

export interface IAdminSsoSearchParams extends IAdminSearchParams {
	callback?: TAdminSearchParamValue;
	client_id?: TAdminSearchParamValue;
	client_status?: TAdminSearchParamValue;
	event?: TAdminSearchParamValue;
	has_grants?: TAdminSearchParamValue;
	user_id?: TAdminSearchParamValue;
	user_status?: TAdminSearchParamValue;
}

export type TAdminSsoCallbackConfig = 'configured' | 'missing';
export type TAdminSsoClientStatus = 'active' | 'disabled';
export type TAdminSsoGrantPresence = 'has' | 'none';

export function getAdminSsoClientStatusFromSearchValue(
	value: TAdminSearchParamValue
): TAdminSsoClientStatus | undefined {
	const searchValue = getAdminSingleSearchValue(value);
	switch (searchValue) {
		case 'active':
		case 'disabled':
			return searchValue;
		default:
			return undefined;
	}
}

export function getAdminSsoCallbackConfigFromSearchValue(
	value: TAdminSearchParamValue
): TAdminSsoCallbackConfig | undefined {
	const searchValue = getAdminSingleSearchValue(value);
	switch (searchValue) {
		case 'configured':
		case 'missing':
			return searchValue;
		default:
			return undefined;
	}
}

export function getAdminSsoGrantPresenceFromSearchValue(
	value: TAdminSearchParamValue
): TAdminSsoGrantPresence | undefined {
	switch (getAdminSingleSearchValue(value)) {
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
	value: TAdminSearchParamValue
): TUserStatus | undefined {
	const searchValue = getAdminSingleSearchValue(value);
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
	value: TAdminSearchParamValue
): TAdminSsoCallbackEvent | undefined {
	const searchValue = getAdminSingleSearchValue(value);
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
	value: TAdminSearchParamValue
): TAdminSsoCallbackQueueStatus | undefined {
	const searchValue = getAdminSingleSearchValue(value);
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
	value: TAdminSearchParamValue
): TAdminSsoCallbackDeliveryStatus | undefined {
	const searchValue = getAdminSingleSearchValue(value);
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
	value: TAdminSearchParamValue
): TAdminSsoTicketStatus | undefined {
	const searchValue = getAdminSingleSearchValue(value);
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
