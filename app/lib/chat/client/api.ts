import type {
	IChatConversationListData,
	IChatCreateMessageBody,
	IChatCreateMessageData,
	IChatMessageListData,
	IChatReadBody,
	IChatReadData,
} from '@/lib/chat/shared/types';
import { fetchServiceApi } from '@/lib/api/serviceClient';

function createJsonRequestInit(
	method: 'POST',
	body: unknown,
	csrfToken: string
) {
	return {
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json',
			'X-CSRF-Token': csrfToken,
		},
		method,
	} satisfies RequestInit;
}

export function fetchChatConversations() {
	return fetchServiceApi<IChatConversationListData>(
		'/api/v1/chat/conversations'
	);
}

export function fetchChatMessages({
	after,
	before,
	conversationId,
	limit,
}: {
	after?: number;
	before?: number;
	conversationId: string;
	limit?: number;
}) {
	const searchParams = new URLSearchParams();
	if (before !== undefined) {
		searchParams.set('before', before.toString());
	}
	if (after !== undefined) {
		searchParams.set('after', after.toString());
	}
	if (limit !== undefined) {
		searchParams.set('limit', limit.toString());
	}

	return fetchServiceApi<IChatMessageListData>(
		`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages?${searchParams.toString()}`
	);
}

export function createChatMessage(
	conversationId: string,
	body: IChatCreateMessageBody,
	csrfToken: string
) {
	return fetchServiceApi<IChatCreateMessageData>(
		`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
		createJsonRequestInit('POST', body, csrfToken)
	);
}

export function markChatConversationRead(
	conversationId: string,
	body: IChatReadBody,
	csrfToken: string
) {
	return fetchServiceApi<IChatReadData>(
		`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/read`,
		createJsonRequestInit('POST', body, csrfToken)
	);
}
