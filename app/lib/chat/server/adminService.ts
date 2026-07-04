import { getAccountDatabase } from '@/lib/account/server/db';
import { createAccountUserProfile } from '@/lib/account/server/user';
import { listUsersByIds } from '@/lib/account/server/repositories/users';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	IAdminChatConversationBody,
	IAdminChatConversationRecord,
	IAdminChatConversationUpdateBody,
	IAdminChatMessageRecord,
} from '@/lib/chat/shared/types';
import type { TChatConversation } from '@/lib/db/types';
import { publishGlobalChatEvent } from './realtimeService';

const CONVERSATION_TABLE_NAME = TABLE_NAME_MAP.chatConversation;
const MESSAGE_TABLE_NAME = TABLE_NAME_MAP.chatMessage;

const CHAT_SLUG_REGEXP = /^[a-z0-9-]{1,32}$/u;
const ADMIN_CHAT_CONVERSATION_COLUMNS = [
	'archived_at',
	'created_at',
	'description',
	'id',
	'last_message_id',
	'slug',
	'title',
	'updated_at',
] as const;

function normalizeConversationRecord(
	record: Pick<
		TChatConversation,
		| 'archived_at'
		| 'created_at'
		| 'description'
		| 'id'
		| 'last_message_id'
		| 'slug'
		| 'title'
		| 'updated_at'
	>
) {
	return {
		archived_at: record.archived_at,
		description: record.description,
		id: record.id,
		last_message_id: record.last_message_id,
		slug: record.slug,
		title: record.title,
		updated_at: record.updated_at,
	} satisfies IAdminChatConversationRecord;
}

function normalizeMessageRecord(input: {
	body_text: string;
	created_at: number;
	deleted_at: number | null;
	id: number;
	sender_name: string;
	sender_user_id: string;
}) {
	return {
		body_text: input.body_text,
		created_at: input.created_at,
		deleted: input.deleted_at !== null,
		deleted_at: input.deleted_at,
		id: input.id,
		sender_name: input.sender_name,
		sender_user_id: input.sender_user_id,
	} satisfies IAdminChatMessageRecord;
}

function checkChatConversationConflictError(error: unknown) {
	if (error === null || typeof error !== 'object') {
		return false;
	}

	const code = Object.getOwnPropertyDescriptor(error, 'code')
		?.value as unknown;
	return (
		code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
		code === 'SQLITE_CONSTRAINT_UNIQUE'
	);
}

function normalizeSlug(slug: string) {
	const normalized = slug.trim().toLowerCase();
	if (!CHAT_SLUG_REGEXP.test(normalized)) {
		throw new Error('invalid-chat-slug');
	}

	return normalized;
}

function normalizeTitle(title: string) {
	const normalized = title.trim();
	if (normalized === '' || normalized.length > 64) {
		throw new Error('invalid-chat-title');
	}

	return normalized;
}

function normalizeDescription(description: string | undefined) {
	const normalized = (description ?? '').trim();
	if (normalized.length > 200) {
		throw new Error('invalid-chat-description');
	}

	return normalized;
}

export async function listAdminChatConversations() {
	const db = await getAccountDatabase();

	const records = await db
		.selectFrom(CONVERSATION_TABLE_NAME)
		.select(ADMIN_CHAT_CONVERSATION_COLUMNS)
		.orderBy('created_at', 'asc')
		.orderBy('id', 'asc')
		.execute();

	return records.map(normalizeConversationRecord);
}

export async function listAdminChatConversationMessages({
	before,
	conversationId,
	limit,
	query,
}: {
	before?: number | null;
	conversationId: string;
	limit: number;
	query?: string | null;
}) {
	const db = await getAccountDatabase();
	const conversation = await db
		.selectFrom(CONVERSATION_TABLE_NAME)
		.select('id')
		.where('id', '=', conversationId)
		.executeTakeFirst();
	if (conversation === undefined) {
		throw new Error('chat-not-found');
	}

	let messageQuery = db
		.selectFrom(MESSAGE_TABLE_NAME)
		.selectAll()
		.where('conversation_id', '=', conversationId)
		.orderBy('id', 'desc');
	if (before !== null && before !== undefined) {
		messageQuery = messageQuery.where('id', '<', before);
	}

	const normalizedQuery = query?.trim() ?? '';
	if (normalizedQuery !== '') {
		messageQuery = messageQuery.where(
			'body_text',
			'like',
			`%${normalizedQuery}%`
		);
	}

	const rows = await messageQuery.limit(limit + 1).execute();
	const hasMore = rows.length > limit;
	const messages = rows.slice(0, limit);
	const senderProfiles = await listUsersByIds(
		messages.map(({ sender_user_id }) => sender_user_id)
	);
	const senderMap = new Map(
		senderProfiles.map((sender) => [
			sender.id,
			createAccountUserProfile(sender),
		])
	);

	return {
		hasMore,
		messages: messages.map((message) => {
			const sender = senderMap.get(message.sender_user_id);
			return normalizeMessageRecord({
				body_text: message.body_text,
				created_at: message.created_at,
				deleted_at: message.deleted_at,
				id: message.id,
				sender_name:
					sender === undefined
						? message.sender_user_id
						: (sender.nickname ?? sender.username),
				sender_user_id: message.sender_user_id,
			});
		}),
	};
}

export async function createAdminChatConversation(
	body: IAdminChatConversationBody,
	actorId: string
) {
	const db = await getAccountDatabase();
	const now = Date.now();
	const slug = normalizeSlug(body.slug);
	const title = normalizeTitle(body.title);
	const description = normalizeDescription(body.description);
	const id = `chat-public-${slug}`;

	try {
		await db
			.insertInto(CONVERSATION_TABLE_NAME)
			.values({
				archived_at: null,
				created_at: now,
				created_by_user_id: actorId,
				description,
				id,
				join_policy: 'auto',
				last_message_id: null,
				slug,
				title,
				type: 'public_channel',
				updated_at: now,
				visibility: 'public_authenticated',
			})
			.execute();
	} catch (error) {
		if (checkChatConversationConflictError(error)) {
			throw new Error('chat-conversation-conflict');
		}

		throw error;
	}

	const record = await db
		.selectFrom(CONVERSATION_TABLE_NAME)
		.select(ADMIN_CHAT_CONVERSATION_COLUMNS)
		.where('id', '=', id)
		.executeTakeFirstOrThrow();
	publishGlobalChatEvent({
		data: { conversationId: id, updatedAt: now },
		type: 'chat.conversation.updated',
	});

	return normalizeConversationRecord(record);
}

export async function updateAdminChatConversation(
	id: string,
	body: IAdminChatConversationUpdateBody
) {
	const db = await getAccountDatabase();
	const existing = await db
		.selectFrom(CONVERSATION_TABLE_NAME)
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirst();
	if (existing === undefined) {
		throw new Error('chat-not-found');
	}

	const now = Date.now();
	const nextSlug =
		body.slug === undefined ? existing.slug : normalizeSlug(body.slug);
	const nextTitle =
		body.title === undefined ? existing.title : normalizeTitle(body.title);
	const nextDescription =
		body.description === undefined
			? existing.description
			: normalizeDescription(body.description);

	try {
		await db
			.updateTable(CONVERSATION_TABLE_NAME)
			.set({
				description: nextDescription,
				slug: nextSlug,
				title: nextTitle,
				updated_at: now,
			})
			.where('id', '=', id)
			.execute();
	} catch (error) {
		if (checkChatConversationConflictError(error)) {
			throw new Error('chat-conversation-conflict');
		}

		throw error;
	}

	const record = await db
		.selectFrom(CONVERSATION_TABLE_NAME)
		.select(ADMIN_CHAT_CONVERSATION_COLUMNS)
		.where('id', '=', id)
		.executeTakeFirstOrThrow();
	publishGlobalChatEvent({
		data: { conversationId: id, updatedAt: now },
		type: 'chat.conversation.updated',
	});

	return normalizeConversationRecord(record);
}

export async function archiveAdminChatConversation(id: string) {
	const db = await getAccountDatabase();
	const existing = await db
		.selectFrom(CONVERSATION_TABLE_NAME)
		.select('id')
		.where('id', '=', id)
		.executeTakeFirst();
	if (existing === undefined) {
		throw new Error('chat-not-found');
	}

	const now = Date.now();
	await db
		.updateTable(CONVERSATION_TABLE_NAME)
		.set({ archived_at: now, updated_at: now })
		.where('id', '=', id)
		.execute();
	publishGlobalChatEvent({
		data: { conversationId: id, updatedAt: now },
		type: 'chat.conversation.updated',
	});
}

export async function restoreAdminChatConversation(id: string) {
	const db = await getAccountDatabase();
	const existing = await db
		.selectFrom(CONVERSATION_TABLE_NAME)
		.select('id')
		.where('id', '=', id)
		.executeTakeFirst();
	if (existing === undefined) {
		throw new Error('chat-not-found');
	}

	const now = Date.now();
	await db
		.updateTable(CONVERSATION_TABLE_NAME)
		.set({ archived_at: null, updated_at: now })
		.where('id', '=', id)
		.execute();
	publishGlobalChatEvent({
		data: { conversationId: id, updatedAt: now },
		type: 'chat.conversation.updated',
	});
}

export async function deleteAdminChatMessage(messageId: number) {
	const db = await getAccountDatabase();
	const message = await db
		.selectFrom(MESSAGE_TABLE_NAME)
		.selectAll()
		.where('id', '=', messageId)
		.executeTakeFirst();
	if (message === undefined) {
		throw new Error('chat-not-found');
	}

	const now = Date.now();
	await db
		.updateTable(MESSAGE_TABLE_NAME)
		.set({ deleted_at: now })
		.where('id', '=', messageId)
		.execute();
	await db
		.updateTable(CONVERSATION_TABLE_NAME)
		.set({ updated_at: now })
		.where('id', '=', message.conversation_id)
		.execute();
	publishGlobalChatEvent({
		data: {
			conversationId: message.conversation_id,
			deletedAt: now,
			messageId,
		},
		type: 'chat.message.deleted',
	});

	return { conversationId: message.conversation_id };
}
