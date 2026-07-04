import { type NextRequest } from 'next/server';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { readJsonBodyResult } from '@/lib/account/server/routeResponses';
import {
	checkConversationWritable,
	getConversationById,
} from '@/lib/chat/server/conversationService';
import {
	createConversationMessage,
	listConversationMessages,
} from '@/lib/chat/server/messageService';
import { ensureParticipant } from '@/lib/chat/server/participantService';
import { publishGlobalChatEvent } from '@/lib/chat/server/realtimeService';
import {
	checkChatMessageSendRateLimitResponse,
	createChatErrorResponse,
	requireChatAccountAuth,
} from '@/lib/chat/server/requestGuards';
import type {
	IChatCreateMessageBody,
	IChatCreateMessageData,
	IChatMessageListData,
} from '@/lib/chat/shared/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseIntegerParam(value: string | null) {
	if (value === null || value === '') {
		return null;
	}
	if (!/^\d+$/u.test(value)) {
		return null;
	}

	const parsed = Number.parseInt(value, 10);

	return Number.isSafeInteger(parsed) ? parsed : null;
}

async function getReadableConversation(id: string) {
	const conversation = await getConversationById(id);
	if (conversation?.visibility !== 'public_authenticated') {
		throw new Error('chat-not-found');
	}

	return conversation;
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const authResult = await requireChatAccountAuth(request, 'chat-messages');
	if (authResult.status === 'error') {
		return authResult.response;
	}

	const { id } = await params;
	const before = parseIntegerParam(
		request.nextUrl.searchParams.get('before')
	);
	const after = parseIntegerParam(request.nextUrl.searchParams.get('after'));
	const rawLimit = parseIntegerParam(
		request.nextUrl.searchParams.get('limit')
	);
	if (before !== null && after !== null) {
		return createNoStoreErrorResponse('invalid-query', 400);
	}

	const limit = rawLimit ?? (after === null ? 50 : 100);
	if (limit <= 0 || limit > 100) {
		return createNoStoreErrorResponse('invalid-query', 400);
	}

	try {
		const conversation = await getReadableConversation(id);
		await ensureParticipant(conversation, authResult.auth.data.user.id);
		const result = await listConversationMessages({
			after,
			before,
			conversationId: conversation.id,
			limit,
		});

		return createNoStoreJsonResponse({
			conversation_id: conversation.id,
			has_more: result.hasMore,
			messages: result.messages,
		} satisfies IChatMessageListData);
	} catch (error) {
		return createChatErrorResponse(error);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const authResult = await requireChatAccountAuth(
		request,
		'chat-message-create'
	);
	if (authResult.status === 'error') {
		return authResult.response;
	}
	if (
		!authResult.authModule.verifyAccountCsrf(
			request,
			authResult.auth.data.sessionTokenHash
		)
	) {
		return createNoStoreErrorResponse('invalid-csrf-token', 403);
	}

	const sendRateLimitResponse = checkChatMessageSendRateLimitResponse(
		authResult.auth.data.user.id
	);
	if (sendRateLimitResponse !== null) {
		return sendRateLimitResponse;
	}

	const bodyResult =
		await readJsonBodyResult<IChatCreateMessageBody>(request);
	if (bodyResult.status !== 'ok') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	if (typeof bodyResult.data.body_text !== 'string') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const { id } = await params;

	try {
		const conversation = await getReadableConversation(id);
		if (!checkConversationWritable(conversation)) {
			return createNoStoreErrorResponse(
				'chat-conversation-archived',
				403
			);
		}

		const message = await createConversationMessage({
			bodyText: bodyResult.data.body_text,
			conversation,
			senderUserId: authResult.auth.data.user.id,
		});
		publishGlobalChatEvent({
			data: {
				conversationId: conversation.id,
				createdAt: message.created_at,
				messageId: message.id,
				senderId: message.sender.id,
			},
			type: 'chat.message.created',
		});
		publishGlobalChatEvent({
			data: {
				conversationId: conversation.id,
				updatedAt: message.created_at,
			},
			type: 'chat.conversation.updated',
		});

		return createNoStoreJsonResponse({
			message,
		} satisfies IChatCreateMessageData);
	} catch (error) {
		return createChatErrorResponse(error);
	}
}
