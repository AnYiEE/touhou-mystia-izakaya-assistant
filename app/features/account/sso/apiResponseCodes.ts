export const ACCOUNT_SSO_API_RESPONSE_CODE_MAP = {
	clientDisabled: 'client-disabled',
	grantNotFound: 'sso-grant-not-found',
	invalidClient: 'invalid-client',
	invalidRedirectUri: 'invalid-redirect-uri',
	invalidSecret: 'invalid-secret',
	invalidTicket: 'invalid-ticket',
	userNotFound: 'user-not-found',
} as const;

export const SSO_AUTHORIZE_PAGE_STATUS_MAP = {
	cancelled: 'cancelled',
	expired: 'expired',
	invalid: 'invalid',
} as const;
