import { type NextRequest } from 'next/server';

import { setAccountSessionCookie } from './auth';
import {
	type IAccountUserProfile,
	type IAuthLoginSuccessResponse,
} from '@/lib/account/shared/types';
import {
	createNoStoreJsonResponse,
	createNoStoreRedirectResponse,
} from '@/lib/api/routeResponses';
import { createMainSiteUrl } from '@/lib/siteUrl';

const SSO_AUTHORIZE_PATH = '/sso/authorize';

type TAccountLoginSuccessResponse = IAuthLoginSuccessResponse & {
	redirect_to?: string;
};

export function checkJsonResponseRequest(request: NextRequest) {
	return (
		request.headers
			.get('accept')
			?.split(',')
			.some(
				(item) => item.trim().split(';', 1)[0] === 'application/json'
			) === true
	);
}

export async function createAccountLoginSuccessResponse({
	hasPassword,
	passwordMustChange,
	request,
	session,
	user,
}: {
	hasPassword: boolean;
	passwordMustChange: boolean;
	request: NextRequest;
	session: { csrfToken: string; token: string };
	user: IAccountUserProfile;
}) {
	const ssoModule = await import('./sso');
	const ssoContext = ssoModule.getSsoContextCookie(request);
	const ssoAuthorizeUrl = createMainSiteUrl(SSO_AUTHORIZE_PATH);
	if (ssoContext !== null && !checkJsonResponseRequest(request)) {
		const response = createNoStoreRedirectResponse(ssoAuthorizeUrl);
		setAccountSessionCookie(response, session.token, request);

		return response;
	}

	const response = createNoStoreJsonResponse({
		csrf_token: session.csrfToken,
		has_password: hasPassword,
		password_must_change: passwordMustChange,
		...(ssoContext === null
			? {}
			: { redirect_to: ssoAuthorizeUrl.toString() }),
		user,
	} satisfies TAccountLoginSuccessResponse);
	setAccountSessionCookie(response, session.token, request);

	return response;
}
