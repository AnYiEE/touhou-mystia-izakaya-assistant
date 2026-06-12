import { cookies } from 'next/headers';

import { createAdminCsrfToken } from '@/lib/account/server/admin';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	authenticateAdminSession,
	checkAccountCookieSecurity,
	checkAccountFeature,
	checkAdminFeature,
} from '@/lib/account/server/guards';
import { ACCOUNT_COOKIE_NAME_MAP } from '@/lib/account/shared/constants';
import { type IAdminMeData } from '@/lib/account/shared/types';

export interface IAdminSsoAuthInitialData {
	admin: IAdminMeData | null;
	message: string | null;
}

export async function readAdminSsoAuthInitialData(
	pathname: string
): Promise<IAdminSsoAuthInitialData> {
	const accountFeatureResult = await checkAccountFeature();
	if (accountFeatureResult.status === 'error') {
		return { admin: null, message: accountFeatureResult.message };
	}

	const adminFeatureResult = checkAdminFeature();
	if (adminFeatureResult.status === 'error') {
		return { admin: null, message: adminFeatureResult.message };
	}

	const request = await createCurrentRequest(pathname);
	const cookieSecurityResult = checkAccountCookieSecurity(request);
	if (cookieSecurityResult.status === 'error') {
		return { admin: null, message: cookieSecurityResult.message };
	}

	const cookieStore = await cookies();
	const adminSessionToken =
		cookieStore.get(ACCOUNT_COOKIE_NAME_MAP.adminSession)?.value ?? null;
	const adminAuthResult = authenticateAdminSession(adminSessionToken);
	if (adminAuthResult.status === 'error') {
		return {
			admin: null,
			message:
				adminAuthResult.message === 'unauthorized'
					? null
					: adminAuthResult.message,
		};
	}

	return {
		admin: {
			csrf_token: createAdminCsrfToken(adminAuthResult.data.token),
			username: adminAuthResult.data.payload.username,
		},
		message: null,
	};
}
