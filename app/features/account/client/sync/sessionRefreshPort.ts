export interface IAccountSessionRefreshPort {
	refreshFromInvalidation(): Promise<void>;
}

const ACCOUNT_SESSION_REFRESH_PORT_INVARIANT =
	'account-session-refresh-port-invariant';

let accountSessionRefreshPort: IAccountSessionRefreshPort | null = null;

export function registerAccountSessionRefreshPort(
	port: IAccountSessionRefreshPort
): void {
	if (accountSessionRefreshPort === port) {
		return;
	}
	if (
		accountSessionRefreshPort !== null &&
		process.env.NODE_ENV !== 'development'
	) {
		throw new Error(ACCOUNT_SESSION_REFRESH_PORT_INVARIANT);
	}

	accountSessionRefreshPort = port;
}

export function getAccountSessionRefreshPort(): IAccountSessionRefreshPort {
	if (accountSessionRefreshPort === null) {
		throw new Error(ACCOUNT_SESSION_REFRESH_PORT_INVARIANT);
	}

	return accountSessionRefreshPort;
}
