import { type NextRequest } from 'next/server';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { listAdminChatConversationMessages } from '@/lib/chat/server/adminService';
import { checkAdminChatRequest } from '@/lib/chat/server/adminRoute';
import { type IAdminChatMessageListData } from '@/lib/chat/shared/types';

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

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const check = await checkAdminChatRequest(
		request,
		'admin-chat-conversation-messages',
		{ parts: [{ name: 'conversation', value: id }] }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const before = parseIntegerParam(
		request.nextUrl.searchParams.get('before')
	);
	const rawLimit = parseIntegerParam(
		request.nextUrl.searchParams.get('limit')
	);
	if (
		request.nextUrl.searchParams.get('before') !== null &&
		before === null
	) {
		return createNoStoreErrorResponse('invalid-query', 400);
	}
	if (
		request.nextUrl.searchParams.get('limit') !== null &&
		rawLimit === null
	) {
		return createNoStoreErrorResponse('invalid-query', 400);
	}

	const limit = rawLimit ?? 50;
	if (limit <= 0 || limit > 100) {
		return createNoStoreErrorResponse('invalid-query', 400);
	}

	try {
		const result = await listAdminChatConversationMessages({
			before,
			conversationId: id,
			limit,
			query: request.nextUrl.searchParams.get('query'),
		});

		return createNoStoreJsonResponse({
			conversation_id: id,
			has_more: result.hasMore,
			messages: result.messages,
		} satisfies IAdminChatMessageListData);
	} catch (error) {
		if (error instanceof Error && error.message === 'chat-not-found') {
			return createNoStoreErrorResponse('chat-not-found', 404);
		}

		return createNoStoreErrorResponse('chat-internal-error', 500);
	}
}
