import { type NextRequest } from 'next/server';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/lib/api/routeResponses';
import { type IAdminChatConversationUpdateBody } from '@/lib/chat/shared/types';
import {
	checkAdminChatRequest,
	writeAdminChatAuditLog,
} from '@/lib/chat/server/adminRoute';
import { updateAdminChatConversation } from '@/lib/chat/server/adminService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseConversationUpdateBody(data: unknown) {
	if (data === null || Array.isArray(data) || typeof data !== 'object') {
		return null;
	}

	const body = data as Record<string, unknown>;
	if (
		body['slug'] === undefined &&
		body['title'] === undefined &&
		body['description'] === undefined
	) {
		return null;
	}
	if (
		(body['slug'] !== undefined && typeof body['slug'] !== 'string') ||
		(body['title'] !== undefined && typeof body['title'] !== 'string') ||
		(body['description'] !== undefined &&
			typeof body['description'] !== 'string')
	) {
		return null;
	}

	const parsedBody: IAdminChatConversationUpdateBody = {};
	if (typeof body['description'] === 'string') {
		parsedBody.description = body['description'];
	}
	if (typeof body['slug'] === 'string') {
		parsedBody.slug = body['slug'];
	}
	if (typeof body['title'] === 'string') {
		parsedBody.title = body['title'];
	}

	return parsedBody;
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const check = await checkAdminChatRequest(
		request,
		'admin-chat-conversations-update',
		{ csrf: true, parts: [{ name: 'conversation', value: id }] }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const bodyResult = await readJsonBodyResult(request, 16 * 1024);
	if (bodyResult.status !== 'ok') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const body = parseConversationUpdateBody(bodyResult.data);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	try {
		const record = await updateAdminChatConversation(id, body);
		await writeAdminChatAuditLog(request, check.auth.actorId, {
			action: 'admin-chat-conversation-update',
			metadata: { slug: record.slug, title: record.title },
			targetId: record.id,
			targetType: 'chat_conversation',
		});

		return createNoStoreJsonResponse(record);
	} catch (error) {
		if (!(error instanceof Error)) {
			return createNoStoreErrorResponse('chat-internal-error', 500);
		}
		if (error.message === 'chat-not-found') {
			return createNoStoreErrorResponse('chat-not-found', 404);
		}
		if (
			[
				'chat-conversation-conflict',
				'invalid-chat-description',
				'invalid-chat-slug',
				'invalid-chat-title',
			].includes(error.message)
		) {
			return createNoStoreErrorResponse(
				error.message,
				error.message === 'chat-conversation-conflict' ? 409 : 400
			);
		}

		return createNoStoreErrorResponse('chat-internal-error', 500);
	}
}
