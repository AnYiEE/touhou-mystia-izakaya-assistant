import { type NextRequest } from 'next/server';

import { createNoStoreJsonResponse } from '@/lib/api/routeResponses';
import { listPublicConversationsForUser } from '@/lib/chat/server/conversationService';
import {
	createChatErrorResponse,
	requireChatAccountAuth,
} from '@/lib/chat/server/requestGuards';
import { type IChatConversationListData } from '@/lib/chat/shared/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	const authResult = await requireChatAccountAuth(
		request,
		'chat-conversations'
	);
	if (authResult.status === 'error') {
		return authResult.response;
	}

	try {
		return createNoStoreJsonResponse({
			conversations: await listPublicConversationsForUser(
				authResult.auth.data.user.id
			),
		} satisfies IChatConversationListData);
	} catch (error) {
		return createChatErrorResponse(error);
	}
}
