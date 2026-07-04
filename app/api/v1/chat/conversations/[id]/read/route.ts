import { type NextRequest } from 'next/server';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { readJsonBodyResult } from '@/lib/account/server/routeResponses';
import { getConversationById } from '@/lib/chat/server/conversationService';
import { markConversationRead } from '@/lib/chat/server/messageService';
import { ensureParticipant } from '@/lib/chat/server/participantService';
import { publishUserScopedChatEvent } from '@/lib/chat/server/realtimeService';
import {
	createChatErrorResponse,
	requireChatAccountAuth,
} from '@/lib/chat/server/requestGuards';
import type { IChatReadBody, IChatReadData } from '@/lib/chat/shared/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const authResult = await requireChatAccountAuth(request, 'chat-read');
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

	const bodyResult = await readJsonBodyResult<IChatReadBody>(request);
	if (bodyResult.status !== 'ok') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	if (
		typeof bodyResult.data.last_read_message_id !== 'number' ||
		!Number.isSafeInteger(bodyResult.data.last_read_message_id) ||
		bodyResult.data.last_read_message_id < 0
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const { id } = await params;

	try {
		const conversation = await getConversationById(id);
		if (conversation?.visibility !== 'public_authenticated') {
			return createNoStoreErrorResponse('chat-not-found', 404);
		}

		await ensureParticipant(conversation, authResult.auth.data.user.id);
		await markConversationRead({
			conversationId: conversation.id,
			lastReadMessageId: bodyResult.data.last_read_message_id,
			userId: authResult.auth.data.user.id,
		});
		publishUserScopedChatEvent(authResult.auth.data.user.id, {
			data: {
				conversationId: conversation.id,
				lastReadMessageId: bodyResult.data.last_read_message_id,
				updatedAt: Date.now(),
			},
			type: 'chat.participant.updated',
		});

		return createNoStoreJsonResponse({
			conversation_id: conversation.id,
			last_read_message_id: bodyResult.data.last_read_message_id,
		} satisfies IChatReadData);
	} catch (error) {
		return createChatErrorResponse(error);
	}
}
