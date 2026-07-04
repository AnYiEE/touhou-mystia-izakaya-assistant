'use client';

import { BroadcastChannel } from 'broadcast-channel';

export const CHAT_RUNTIME_CHANNEL_NAME = 'chat-runtime';

export type TChatRouteKind = 'chat-page' | 'other';

export type TChatRuntimeBroadcastMessage =
	| {
			currentConversationId: string | null;
			leaseExpiresAt: number;
			leaderTabId: string;
			tabId: string;
			type: 'leader-changed';
			userId: string;
	  }
	| {
			conversationId: string;
			tabId: string;
			type: 'conversation-updated';
			updatedAt: number;
			userId: string;
	  }
	| {
			conversationId: string;
			createdAt: number;
			messageId: number;
			senderId: string;
			tabId: string;
			type: 'message-created';
			userId: string;
	  }
	| {
			conversationId: string;
			deletedAt: number;
			messageId: number;
			tabId: string;
			type: 'message-deleted';
			userId: string;
	  }
	| {
			enabled: boolean;
			nativeNotifications: boolean;
			pageNotifications: boolean;
			tabId: string;
			type: 'preferences-updated';
			updatedAt: number;
			userId: string;
	  }
	| {
			conversationId: string;
			lastReadMessageId: number;
			tabId: string;
			type: 'read-updated';
			updatedAt: number;
			userId: string;
	  }
	| {
			currentConversationId: string | null;
			panelExpanded: boolean;
			routeKind: TChatRouteKind;
			tabId: string;
			type: 'tab-presence';
			updatedAt: number;
			userId: string;
			visible: boolean;
	  };

let channel: BroadcastChannel<TChatRuntimeBroadcastMessage> | null = null;

function getChatRuntimeBroadcastChannel() {
	try {
		return (channel ??= new BroadcastChannel<TChatRuntimeBroadcastMessage>(
			CHAT_RUNTIME_CHANNEL_NAME,
			{ webWorkerSupport: false }
		));
	} catch (error) {
		console.warn('Chat runtime broadcast channel is unavailable.', error);
		return null;
	}
}

export function postChatRuntimeBroadcastMessage(
	message: TChatRuntimeBroadcastMessage
) {
	const broadcastChannel = getChatRuntimeBroadcastChannel();
	if (broadcastChannel === null) {
		return Promise.resolve(false);
	}

	try {
		return broadcastChannel
			.postMessage(message)
			.then(() => true)
			.catch((error: unknown) => {
				console.warn('Chat runtime broadcast failed.', error);
				return false;
			});
	} catch (error) {
		console.warn('Chat runtime broadcast failed.', error);
		return Promise.resolve(false);
	}
}

export function subscribeChatRuntimeBroadcastMessage(
	callback: (message: TChatRuntimeBroadcastMessage) => void
) {
	const broadcastChannel = getChatRuntimeBroadcastChannel();
	if (broadcastChannel === null) {
		return () => {};
	}

	try {
		broadcastChannel.addEventListener('message', callback);
	} catch (error) {
		console.warn('Chat runtime broadcast subscription failed.', error);
		return () => {};
	}

	return () => {
		try {
			broadcastChannel.removeEventListener('message', callback);
		} catch (error) {
			console.warn(
				'Chat runtime broadcast unsubscription failed.',
				error
			);
		}
	};
}
