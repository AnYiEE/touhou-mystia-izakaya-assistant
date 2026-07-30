import { type NextRequest } from 'next/server';

import { checkEnvironmentFlag } from '@/infrastructure/environment/flags';
import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import { checkSecureRequest } from '@/infrastructure/http/server/requestContext';

export function checkInsecureAccountCookiesAllowed() {
	return (
		process.env.NODE_ENV !== 'production' ||
		checkEnvironmentFlag(process.env.ALLOW_INSECURE_COOKIES)
	);
}

export function getAccountCookieSecureFlag(request: NextRequest) {
	if (checkSecureRequest(request)) {
		return true;
	}
	if (checkInsecureAccountCookiesAllowed()) {
		return false;
	}

	throw new Error(SERVER_MISCONFIGURED_MESSAGE);
}
