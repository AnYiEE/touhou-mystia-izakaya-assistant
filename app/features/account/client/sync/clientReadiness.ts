import { type TAccountBootstrapStatus } from '@/features/account/client/state/accountStore';
import { type TAccountWorkspacePhase } from '@/features/account/client/workspace/contracts';

interface IAccountSyncClientReadiness {
	bootstrapStatus: TAccountBootstrapStatus;
	isAuthReconciled: boolean;
	isBootstrapped: boolean;
	isWorkspaceReady: boolean;
	phase: TAccountWorkspacePhase;
}

export function checkAccountSyncClientReady({
	bootstrapStatus,
	isAuthReconciled,
	isBootstrapped,
	isWorkspaceReady,
	phase,
}: IAccountSyncClientReadiness) {
	return (
		isWorkspaceReady &&
		isAuthReconciled &&
		phase === 'ready' &&
		isBootstrapped &&
		(bootstrapStatus === 'anonymous' || bootstrapStatus === 'loggedIn')
	);
}
