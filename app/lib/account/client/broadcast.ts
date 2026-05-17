import { BroadcastChannel } from 'broadcast-channel';

import { type IAccountSyncBroadcastMessage } from '@/lib/account/sync';

export const ACCOUNT_SYNC_CHANNEL_NAME = 'account-sync';

let channel: BroadcastChannel<IAccountSyncBroadcastMessage> | null = null;

export function getAccountSyncBroadcastChannel() {
	return (channel ??= new BroadcastChannel<IAccountSyncBroadcastMessage>(
		ACCOUNT_SYNC_CHANNEL_NAME,
		{ webWorkerSupport: false }
	));
}

export function postAccountSyncBroadcastMessage(
	message: IAccountSyncBroadcastMessage
) {
	return getAccountSyncBroadcastChannel().postMessage(message);
}

export function subscribeAccountSyncBroadcastMessage(
	callback: (message: IAccountSyncBroadcastMessage) => void
) {
	const broadcastChannel = getAccountSyncBroadcastChannel();
	broadcastChannel.addEventListener('message', callback);

	return () => {
		broadcastChannel.removeEventListener('message', callback);
	};
}
