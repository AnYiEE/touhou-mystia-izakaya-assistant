import { type TUser } from '@/lib/db/types';

import {
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	USER_STATUS_MAP,
} from '../shared/constants';
import { type IAccountUserProfile, type TUserStatus } from '../shared/types';

const USERNAME_REGEXP = /^[\p{Script=Han}A-Za-z0-9_.-]+$/u;
const NEW_USERNAME_SEPARATOR_REGEXP = /(^[.-]|[.-]$|[.-]{2,})/u;

export function normalizeUsername(username: string) {
	return username.trim().toLowerCase();
}

export function checkUsernamePolicy(username: string) {
	const trimmedUsername = username.trim();

	return (
		trimmedUsername.length >= USERNAME_MIN_LENGTH &&
		trimmedUsername.length <= USERNAME_MAX_LENGTH &&
		USERNAME_REGEXP.test(trimmedUsername)
	);
}

export function checkNewUsernamePolicy(username: string) {
	const trimmedUsername = username.trim();

	return (
		checkUsernamePolicy(trimmedUsername) &&
		!NEW_USERNAME_SEPARATOR_REGEXP.test(trimmedUsername)
	);
}

export function checkUserStatus(value: string): value is TUserStatus {
	return Object.values(USER_STATUS_MAP).includes(value as TUserStatus);
}

export function createAccountUserProfile(user: TUser): IAccountUserProfile {
	return {
		created_at: user.created_at,
		id: user.id,
		last_login_at: user.last_login_at,
		state_epoch: user.state_epoch,
		status: user.status,
		username: user.username,
	};
}
