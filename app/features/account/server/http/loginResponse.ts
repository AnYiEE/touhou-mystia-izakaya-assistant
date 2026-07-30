import { type NextRequest } from 'next/server';

import type {
	IAccountUserProfile,
	IAuthLoginSuccessResponse,
} from '@/features/account/contracts';
import { setAccountSessionCookie } from '@/features/account/server/auth/sessionLifecycle';

import { FILE_TYPE_JSON } from '@/infrastructure/http/mediaTypes';
import {
	createNoStoreJsonResponse,
	createNoStoreRedirectResponse,
} from '@/infrastructure/http/server/responses';
import { createMainSiteUrl } from '@/infrastructure/http/siteUrl';

const SSO_AUTHORIZE_PATH = '/sso/authorize';

type TAccountLoginSuccessResponse = IAuthLoginSuccessResponse & {
	redirect_to?: string;
};

export function checkJsonResponseRequest(request: NextRequest) {
	return (
		request.headers
			.get('accept')
			?.split(',')
			.some((item) => item.trim().split(';', 1)[0] === FILE_TYPE_JSON) ===
		true
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
	const ssoModule = await import('@/features/account/sso/server/context');
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
