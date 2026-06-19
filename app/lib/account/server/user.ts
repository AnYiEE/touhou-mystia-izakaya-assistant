import { type TUser } from '@/lib/db/types';

import { USER_STATUS_MAP } from '../shared/constants';
import { type IAccountUserProfile, type TUserStatus } from '../shared/types';

export {
	checkNicknamePolicy,
	checkUsernamePolicy,
	normalizeNickname,
} from '../shared/constants';

export function normalizeUsername(username: string) {
	return username.trim().toLowerCase();
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
