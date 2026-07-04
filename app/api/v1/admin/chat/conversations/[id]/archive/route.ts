import { type NextRequest } from 'next/server';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import {
	checkAdminChatRequest,
	writeAdminChatAuditLog,
} from '@/lib/chat/server/adminRoute';
import { archiveAdminChatConversation } from '@/lib/chat/server/adminService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const check = await checkAdminChatRequest(
		request,
		'admin-chat-conversations-archive',
		{ csrf: true, parts: [{ name: 'conversation', value: id }] }
	);
	if (check.status === 'error') {
		return check.response;
	}

	try {
		await archiveAdminChatConversation(id);
		await writeAdminChatAuditLog(request, check.auth.actorId, {
			action: 'admin-chat-conversation-archive',
			targetId: id,
			targetType: 'chat_conversation',
		});

		return createNoStoreJsonResponse({
			conversation_id: id,
			status: 'archived',
		});
	} catch (error) {
		if (error instanceof Error && error.message === 'chat-not-found') {
			return createNoStoreErrorResponse('chat-not-found', 404);
		}

		return createNoStoreErrorResponse('chat-internal-error', 500);
	}
}
