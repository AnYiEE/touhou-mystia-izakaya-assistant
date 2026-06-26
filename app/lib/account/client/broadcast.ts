import { BroadcastChannel } from 'broadcast-channel';

import { type IAccountSyncBroadcastMessage } from '@/lib/account/sync';

export const ACCOUNT_SYNC_CHANNEL_NAME = 'account-sync';

let channel: BroadcastChannel<IAccountSyncBroadcastMessage> | null = null;

export function getAccountSyncBroadcastChannel() {
	try {
		return (channel ??= new BroadcastChannel<IAccountSyncBroadcastMessage>(
			ACCOUNT_SYNC_CHANNEL_NAME,
			{ webWorkerSupport: false }
		));
	} catch (error) {
		console.warn('Account sync broadcast channel is unavailable.', error);
		return null;
	}
}

export function checkAccountSyncBroadcastSupported() {
	return getAccountSyncBroadcastChannel() !== null;
}

export function postAccountSyncBroadcastMessage(
	message: IAccountSyncBroadcastMessage
) {
	const broadcastChannel = getAccountSyncBroadcastChannel();
	if (broadcastChannel === null) {
		return Promise.resolve(false);
	}

	try {
		return broadcastChannel
			.postMessage(message)
			.then(() => true)
			.catch((error: unknown) => {
				console.warn('Account sync broadcast failed.', error);
				return false;
			});
	} catch (error) {
		console.warn('Account sync broadcast failed.', error);
		return Promise.resolve(false);
	}
}

export function subscribeAccountSyncBroadcastMessage(
	callback: (message: IAccountSyncBroadcastMessage) => void
) {
	const broadcastChannel = getAccountSyncBroadcastChannel();
	if (broadcastChannel === null) {
		return () => {};
	}

	try {
		broadcastChannel.addEventListener('message', callback);
	} catch (error) {
		console.warn('Account sync broadcast subscription failed.', error);
		return () => {};
	}

	return () => {
		try {
			broadcastChannel.removeEventListener('message', callback);
		} catch (error) {
			console.warn(
				'Account sync broadcast unsubscription failed.',
				error
			);
		}
	};
}

export const ACCOUNT_WEBAUTHN_CHANNEL_NAME = 'account-webauthn';

export interface IAccountWebauthnBroadcastMessage {
	tabId: string;
	userId: string;
}

let webauthnChannel: BroadcastChannel<IAccountWebauthnBroadcastMessage> | null =
	null;

function getAccountWebauthnBroadcastChannel() {
	try {
		return (webauthnChannel ??=
			new BroadcastChannel<IAccountWebauthnBroadcastMessage>(
				ACCOUNT_WEBAUTHN_CHANNEL_NAME,
				{ webWorkerSupport: false }
			));
	} catch (error) {
		console.warn(
			'Account WebAuthn broadcast channel is unavailable.',
			error
		);
		return null;
	}
}

export function postAccountWebauthnBroadcastMessage(
	message: IAccountWebauthnBroadcastMessage
) {
	const broadcastChannel = getAccountWebauthnBroadcastChannel();
	if (broadcastChannel === null) {
		return Promise.resolve(false);
	}

	try {
		return broadcastChannel
			.postMessage(message)
			.then(() => true)
			.catch((error: unknown) => {
				console.warn('Account WebAuthn broadcast failed.', error);
				return false;
			});
	} catch (error) {
		console.warn('Account WebAuthn broadcast failed.', error);
		return Promise.resolve(false);
	}
}

export function subscribeAccountWebauthnBroadcastMessage(
	callback: (message: IAccountWebauthnBroadcastMessage) => void
) {
	const broadcastChannel = getAccountWebauthnBroadcastChannel();
	if (broadcastChannel === null) {
		return () => {};
	}

	try {
		broadcastChannel.addEventListener('message', callback);
	} catch (error) {
		console.warn('Account WebAuthn broadcast subscription failed.', error);
		return () => {};
	}

	return () => {
		try {
			broadcastChannel.removeEventListener('message', callback);
		} catch (error) {
			console.warn(
				'Account WebAuthn broadcast unsubscription failed.',
				error
			);
		}
	};
}
