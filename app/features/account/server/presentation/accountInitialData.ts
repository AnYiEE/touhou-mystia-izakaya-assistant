import type { IAccountMeSuccessResponse } from '@/features/account/contracts';
import { createAccountCsrfToken } from '@/features/account/server/auth/accountCsrf';

import type {
	TUser,
	TUserCredential,
	TUserState,
} from '@/infrastructure/database/schema';

import { createAccountUserProfile } from './user';

export function createAccountMeInitialData({
	credential,
	records,
	sessionTokenHash,
	user,
}: {
	credential: TUserCredential;
	records: TUserState[];
	sessionTokenHash: string;
	user: TUser;
}): IAccountMeSuccessResponse {
	const revisions = records.reduce<Record<string, number>>(
		(result, namespace) => {
			result[namespace.namespace] = namespace.revision;
			return result;
		},
		{}
	);

	return {
		csrf_token: createAccountCsrfToken(sessionTokenHash),
		featureEnabled: true,
		has_password: credential.password_set === 1,
		isLoggedIn: true,
		password_must_change: credential.password_must_change === 1,
		state_epoch: user.state_epoch,
		syncMeta: {
			lastAppliedRemoteHash: {},
			revisions,
			state_epoch: user.state_epoch,
			sync_generation: user.sync_generation,
			sync_status: user.sync_status,
		},
		user: createAccountUserProfile(user),
	};
}
