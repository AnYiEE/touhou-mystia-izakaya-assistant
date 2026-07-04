import { createAdminCsrfToken } from '@/lib/account/server/admin';
import { authenticateAdminFromRequest } from '@/lib/account/server/adminRouteResponses';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
	checkAdminFeatureGuard,
} from '@/lib/account/server/guards';
import { type IAdminMeData } from '@/lib/account/shared/types';

export interface IAdminAnnouncementAuthInitialData {
	admin: IAdminMeData | null;
	message: string | null;
}

export async function readAdminAnnouncementAuthInitialData(
	pathname: string
): Promise<IAdminAnnouncementAuthInitialData> {
	const accountFeatureResult = await checkAccountFeatureGuard();
	if (accountFeatureResult.status === 'error') {
		return { admin: null, message: accountFeatureResult.message };
	}

	const adminFeatureResult = checkAdminFeatureGuard();
	if (adminFeatureResult.status === 'error') {
		return { admin: null, message: adminFeatureResult.message };
	}

	const request = await createCurrentRequest(pathname);
	const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
	if (cookieSecurityResult.status === 'error') {
		return { admin: null, message: cookieSecurityResult.message };
	}

	const adminAuthResult = await authenticateAdminFromRequest(request);
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
			auth_source: adminAuthResult.source,
			csrf_token: createAdminCsrfToken(adminAuthResult.token),
			username: adminAuthResult.payload.username,
		},
		message: null,
	};
}
