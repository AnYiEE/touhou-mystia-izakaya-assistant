import { type NextRequest } from 'next/server';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/lib/api/routeResponses';
import {
	type IAdminChatConversationBody,
	type IAdminChatConversationListData,
} from '@/lib/chat/shared/types';
import {
	checkAdminChatRequest,
	writeAdminChatAuditLog,
} from '@/lib/chat/server/adminRoute';
import {
	createAdminChatConversation,
	listAdminChatConversations,
} from '@/lib/chat/server/adminService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseConversationBody(data: unknown) {
	if (data === null || Array.isArray(data) || typeof data !== 'object') {
		return null;
	}

	const body = data as Record<string, unknown>;
	if (
		typeof body['slug'] !== 'string' ||
		typeof body['title'] !== 'string' ||
		(body['description'] !== undefined &&
			typeof body['description'] !== 'string')
	) {
		return null;
	}

	const parsedBody: IAdminChatConversationBody = {
		slug: body['slug'],
		title: body['title'],
	};
	if (typeof body['description'] === 'string') {
		parsedBody.description = body['description'];
	}

	return parsedBody;
}

export async function GET(request: NextRequest) {
	const check = await checkAdminChatRequest(
		request,
		'admin-chat-conversations'
	);
	if (check.status === 'error') {
		return check.response;
	}

	return createNoStoreJsonResponse({
		conversations: await listAdminChatConversations(),
	} satisfies IAdminChatConversationListData);
}

export async function POST(request: NextRequest) {
	const check = await checkAdminChatRequest(
		request,
		'admin-chat-conversations-create',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const bodyResult = await readJsonBodyResult(request, 16 * 1024);
	if (bodyResult.status !== 'ok') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const body = parseConversationBody(bodyResult.data);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	try {
		const record = await createAdminChatConversation(
			body,
			check.auth.actorId
		);
		await writeAdminChatAuditLog(request, check.auth.actorId, {
			action: 'admin-chat-conversation-create',
			metadata: { slug: record.slug, title: record.title },
			targetId: record.id,
			targetType: 'chat_conversation',
		});

		return createNoStoreJsonResponse(record, 201);
	} catch (error) {
		if (
			error instanceof Error &&
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
