import { createInMemoryChatStorage } from './chatStorage';

export type TChatSseEventType =
	| 'chat.connected'
	| 'chat.conversation.updated'
	| 'chat.message.created'
	| 'chat.message.deleted'
	| 'chat.participant.updated';

export interface IChatSseEvent {
	data: Record<string, unknown>;
	type: TChatSseEventType;
}

type TChatListener = (event: IChatSseEvent) => void;

const chatStorage = createInMemoryChatStorage<IChatSseEvent>();

export function subscribeChatEvents(
	userId: string,
	listenerId: string,
	listener: TChatListener
) {
	return chatStorage.subscribe({ listenerId, notify: listener, userId });
}

export function publishGlobalChatEvent(event: IChatSseEvent) {
	chatStorage.publishGlobal(event);
}

export function publishUserScopedChatEvent(
	userId: string,
	event: IChatSseEvent
) {
	chatStorage.publishToUser(userId, event);
}
