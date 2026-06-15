import { authenticateAccountFromRequest, createAccountCsrfToken } from './auth';
import { createCurrentRequest } from './currentRequest';
import {
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
} from './guards';
import { listSsoUserClientGrantsForUser } from './sso';
import { createAccountUserProfile } from './user';
import {
	type IAccountMeSuccessResponse,
	type IAccountSsoGrantInitialData,
} from '../shared/types';
import { getLogSafeErrorCode } from '@/lib/logging';
import { getUserStateSnapshot } from '@/lib/account/server/repositories/userState';

export async function createAccountSsoGrantInitialDataForUser(
	userId: string
): Promise<IAccountSsoGrantInitialData> {
	const grants = await listSsoUserClientGrantsForUser(userId);

	return { grants, user_id: userId };
}

export async function readAccountSsoGrantInitialData(
	pathname = '/account/sso/grants/initial'
): Promise<IAccountSsoGrantInitialData | null> {
	try {
		const accountFeatureResult = await checkAccountFeatureGuard();
		if (accountFeatureResult.status === 'error') {
			return null;
		}

		const request = await createCurrentRequest(pathname);
		const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
		if (cookieSecurityResult.status === 'error') {
			return null;
		}

		const auth = await authenticateAccountFromRequest(request);
		if (auth.status === 'error') {
			return null;
		}

		return await createAccountSsoGrantInitialDataForUser(auth.data.user.id);
	} catch (error) {
		console.warn('Account SSO grant initial data read failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return null;
	}
}

export async function createAccountMeInitialDataForAuthenticatedRequest({
	sessionTokenHash,
	userId,
}: {
	sessionTokenHash: string;
	userId: string;
}): Promise<IAccountMeSuccessResponse | null> {
	const stateSnapshot = await getUserStateSnapshot(userId);
	if (stateSnapshot === null) {
		return null;
	}

	const revisions = stateSnapshot.state.reduce<Record<string, number>>(
		(result, namespace) => {
			result[namespace.namespace] = namespace.revision;
			return result;
		},
		{}
	);

	return {
		csrf_token: createAccountCsrfToken(sessionTokenHash),
		featureEnabled: true,
		isLoggedIn: true,
		password_must_change: false,
		state_epoch: stateSnapshot.user.state_epoch,
		syncMeta: {
			lastAppliedRemoteHash: {},
			revisions,
			state_epoch: stateSnapshot.user.state_epoch,
		},
		user: createAccountUserProfile(stateSnapshot.user),
	};
}
