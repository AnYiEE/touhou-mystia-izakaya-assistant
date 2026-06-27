import { type TUser } from '@/lib/db/types';

import {
	USERNAME_MAX_LENGTH,
	USER_STATUS_MAP,
	checkUsernamePolicy as checkUsernamePolicyValue,
} from '../shared/constants';
import { type IAccountUserProfile, type TUserStatus } from '../shared/types';

export {
	checkNicknamePolicy,
	checkUsernamePolicy,
	normalizeNickname,
} from '../shared/constants';

export function normalizeUsername(username: string) {
	return username.trim().toLowerCase();
}

export function createAutoAccountUsername(seed: string, attempt = 0) {
	const prefix = 'user_';
	const attemptSuffix = attempt === 0 ? '' : `_${attempt.toString(36)}`;
	const suffix = seed
		.replaceAll(/[^a-z0-9]/giu, '')
		.toLowerCase()
		.slice(0, USERNAME_MAX_LENGTH - prefix.length - attemptSuffix.length);
	const username = `${prefix}${suffix}${attemptSuffix}`;
	if (!checkUsernamePolicyValue(username)) {
		throw new Error('server-misconfigured');
	}

	return username;
}

export function checkUserStatus(value: string): value is TUserStatus {
	return Object.values(USER_STATUS_MAP).includes(value as TUserStatus);
}

export function createAccountUserProfile(user: TUser): IAccountUserProfile {
	return {
		created_at: user.created_at,
		id: user.id,
		last_login_at: user.last_login_at,
		nickname: user.nickname,
		state_epoch: user.state_epoch,
		status: user.status,
		username: user.username,
	};
}
