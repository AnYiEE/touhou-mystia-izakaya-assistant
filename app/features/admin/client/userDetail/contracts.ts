export type TAdminUserDetailConfirmAction =
	| 'clear-data'
	| 'delete-sessions'
	| 'disable'
	| 'revoke-all-sso'
	| `revoke-sso:${string}`
	| null;
