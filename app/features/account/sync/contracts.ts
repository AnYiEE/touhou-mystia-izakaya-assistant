import {
	type TAccountSyncStatus,
	type TSyncNamespace,
} from '@/domain/account/contracts';

export interface IAccountSyncMeta {
	clearedStateEpoch?: number;
	lastAppliedRemoteHash: Partial<Record<TSyncNamespace, string>>;
	revisions: Partial<Record<TSyncNamespace, number>>;
	state_epoch: number;
	sync_generation: number;
	sync_status: TAccountSyncStatus;
}
