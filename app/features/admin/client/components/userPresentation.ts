import type { IAccountUserProfile } from '@/features/account/contracts';

export function createAdminUserDisplayName(
	user: Pick<IAccountUserProfile, 'nickname' | 'username'>
) {
	return user.nickname === null
		? user.username
		: `${user.username}（${user.nickname}）`;
}
