export interface IAccountSyncTakeoverOptions {
	deleteStartedAt?: number;
	operationId?: string;
}

export interface IAccountSyncLifecyclePort {
	invalidateRuns(userId?: string): void;
	restoreRuntimeState(userId: string): void;
	scheduleFlush(): void;
	stopRuns(): void;
	takeOverLocalData(options?: IAccountSyncTakeoverOptions): Promise<boolean>;
}

const ACCOUNT_SYNC_LIFECYCLE_PORT_INVARIANT =
	'account-sync-lifecycle-port-invariant';

let accountSyncLifecyclePort: IAccountSyncLifecyclePort | null = null;

export function registerAccountSyncLifecyclePort(
	port: IAccountSyncLifecyclePort
): void {
	if (accountSyncLifecyclePort === port) {
		return;
	}
	if (
		accountSyncLifecyclePort !== null &&
		process.env.NODE_ENV !== 'development'
	) {
		throw new Error(ACCOUNT_SYNC_LIFECYCLE_PORT_INVARIANT);
	}

	accountSyncLifecyclePort = port;
}

export function getAccountSyncLifecyclePort(): IAccountSyncLifecyclePort {
	if (accountSyncLifecyclePort === null) {
		throw new Error(ACCOUNT_SYNC_LIFECYCLE_PORT_INVARIANT);
	}

	return accountSyncLifecyclePort;
}
