import { type TUser } from '@/lib/db/types';

import { USER_STATUS_MAP } from '../shared/constants';
import { type IAccountUserProfile, type TUserStatus } from '../shared/types';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;

const USERNAME_REGEXP = /^[\p{Script=Han}A-Za-z0-9_.-]+$/u;

export function normalizeUsername(username: string) {
	return username.trim().toLocaleLowerCase();
}

export function checkUsernamePolicy(username: string) {
	const trimmedUsername = username.trim();

	return (
		trimmedUsername.length >= USERNAME_MIN_LENGTH &&
		trimmedUsername.length <= USERNAME_MAX_LENGTH &&
		USERNAME_REGEXP.test(trimmedUsername)
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
