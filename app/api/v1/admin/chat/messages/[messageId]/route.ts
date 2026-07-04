import { type NextRequest } from 'next/server';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import {
	checkAdminChatRequest,
	writeAdminChatAuditLog,
} from '@/lib/chat/server/adminRoute';
import { deleteAdminChatMessage } from '@/lib/chat/server/adminService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseMessageId(value: string) {
	if (!/^\d+$/u.test(value)) {
		return null;
	}

	const parsed = Number.parseInt(value, 10);

	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ messageId: string }> }
) {
	const { messageId: rawMessageId } = await params;
	const messageId = parseMessageId(rawMessageId);
	if (messageId === null) {
		return createNoStoreErrorResponse('invalid-message-id', 400);
	}

	const check = await checkAdminChatRequest(
		request,
		'admin-chat-messages-delete',
		{ csrf: true, parts: [{ name: 'message', value: rawMessageId }] }
	);
	if (check.status === 'error') {
		return check.response;
	}

	try {
		const { conversationId } = await deleteAdminChatMessage(messageId);
		await writeAdminChatAuditLog(request, check.auth.actorId, {
			action: 'admin-chat-message-delete',
			metadata: { conversation_id: conversationId },
			targetId: String(messageId),
			targetType: 'chat_message',
		});

		return createNoStoreJsonResponse({
			message_id: messageId,
			status: 'deleted',
		});
	} catch (error) {
		if (error instanceof Error && error.message === 'chat-not-found') {
			return createNoStoreErrorResponse('chat-not-found', 404);
		}

		return createNoStoreErrorResponse('chat-internal-error', 500);
	}
}
