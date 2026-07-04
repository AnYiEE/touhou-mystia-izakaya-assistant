import { createAccountUserProfile } from '@/lib/account/server/user';
import { listUsersByIds } from '@/lib/account/server/repositories/users';
import { getAccountDatabase } from '@/lib/account/server/db';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TChatConversation,
	TChatMessage,
	TChatMessageNew,
	TChatParticipant,
} from '@/lib/db/types';
import type { IChatMessageItem } from '@/lib/chat/shared/types';
import { ensureParticipant, markParticipantRead } from './participantService';

const CONVERSATION_TABLE_NAME = TABLE_NAME_MAP.chatConversation;
const MESSAGE_TABLE_NAME = TABLE_NAME_MAP.chatMessage;
const MAX_MESSAGE_LENGTH = 4000;

function mapMessage(
	message: TChatMessage,
	sender: ReturnType<typeof createAccountUserProfile>
) {
	return {
		body_text: message.body_text,
		conversation_id: message.conversation_id,
		created_at: message.created_at,
		deleted: message.deleted_at !== null,
		deleted_at: message.deleted_at,
		id: message.id,
		sender: {
			id: sender.id,
			nickname: sender.nickname,
			username: sender.username,
		},
	} satisfies IChatMessageItem;
}

function normalizeMessageBody(bodyText: string) {
	const normalized = bodyText.replaceAll('\r\n', '\n').trim();

	if (normalized === '') {
		throw new Error('empty-message');
	}
	if (normalized.length > MAX_MESSAGE_LENGTH) {
		throw new Error('message-too-long');
	}

	return normalized;
}

export function checkParticipantCanPost(
	participant: TChatParticipant | null,
	now: number
) {
	if (participant === null) {
		return false;
	}
	if (participant.state !== 'active') {
		return false;
	}
	if (participant.banned_until !== null && participant.banned_until > now) {
		return false;
	}
	if (participant.muted_until !== null && participant.muted_until > now) {
		return false;
	}

	return true;
}

export async function listConversationMessages({
	after,
	before,
	conversationId,
	limit,
}: {
	after?: number | null;
	before?: number | null;
	conversationId: string;
	limit: number;
}) {
	const db = await getAccountDatabase();
	let query = db
		.selectFrom(MESSAGE_TABLE_NAME)
		.selectAll()
		.where('conversation_id', '=', conversationId);

	if (after !== null && after !== undefined) {
		query = query
			.where('id', '>', after)
			.orderBy('id', 'asc')
			.limit(limit + 1);
	} else if (before !== null && before !== undefined) {
		query = query
			.where('id', '<', before)
			.orderBy('id', 'desc')
			.limit(limit + 1);
	} else {
		query = query.orderBy('id', 'desc').limit(limit + 1);
	}

	const rows = await query.execute();
	const hasMore = rows.length > limit;
	const trimmedRows = rows.slice(0, limit);
	const messages =
		after !== null && after !== undefined
			? trimmedRows
			: [...trimmedRows].reverse();
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
			if (sender === undefined) {
				throw new Error('chat-message-sender-missing');
			}

			return mapMessage(message, sender);
		}),
	};
}

export async function getConversationLastMessageId(conversationId: string) {
	const db = await getAccountDatabase();
	const conversation = await db
		.selectFrom(CONVERSATION_TABLE_NAME)
		.select(['id', 'last_message_id'])
		.where('id', '=', conversationId)
		.executeTakeFirst();

	return conversation?.last_message_id ?? null;
}

async function checkConversationMessageExists(
	conversationId: string,
	messageId: number
) {
	if (messageId === 0) {
		return true;
	}

	const db = await getAccountDatabase();
	const message = await db
		.selectFrom(MESSAGE_TABLE_NAME)
		.select('id')
		.where('conversation_id', '=', conversationId)
		.where('id', '=', messageId)
		.executeTakeFirst();

	return message !== undefined;
}

export async function createConversationMessage({
	bodyText,
	conversation,
	senderUserId,
}: {
	bodyText: string;
	conversation: Pick<TChatConversation, 'id' | 'last_message_id'>;
	senderUserId: string;
}) {
	const db = await getAccountDatabase();
	const now = Date.now();
	const normalizedBodyText = normalizeMessageBody(bodyText);
	const participant = await ensureParticipant(
		conversation,
		senderUserId,
		now
	);
	if (!checkParticipantCanPost(participant, now)) {
		throw new Error('chat-forbidden');
	}

	const insertedMessage = await db.transaction().execute(async (trx) => {
		const inserted = await trx
			.insertInto(MESSAGE_TABLE_NAME)
			.values({
				body_text: normalizedBodyText,
				conversation_id: conversation.id,
				created_at: now,
				deleted_at: null,
				sender_user_id: senderUserId,
			} satisfies TChatMessageNew)
			.returningAll()
			.executeTakeFirstOrThrow();

		await trx
			.updateTable(CONVERSATION_TABLE_NAME)
			.set({ last_message_id: inserted.id, updated_at: now })
			.where('id', '=', conversation.id)
			.execute();

		await trx
			.updateTable(TABLE_NAME_MAP.chatParticipant)
			.set({ last_read_message_id: inserted.id, last_seen_at: now })
			.where('conversation_id', '=', conversation.id)
			.where('user_id', '=', senderUserId)
			.execute();

		return inserted;
	});

	const [sender] = await listUsersByIds([senderUserId]);
	if (sender === undefined) {
		throw new Error('chat-message-sender-missing');
	}

	return mapMessage(insertedMessage, createAccountUserProfile(sender));
}

export async function markConversationRead({
	conversationId,
	lastReadMessageId,
	userId,
}: {
	conversationId: string;
	lastReadMessageId: number;
	userId: string;
}) {
	const lastMessageId = await getConversationLastMessageId(conversationId);
	if (lastMessageId === null) {
		if (lastReadMessageId !== 0) {
			throw new Error('invalid-last-read-message-id');
		}

		await markParticipantRead(conversationId, userId, lastReadMessageId);
		return;
	}
	if (lastReadMessageId > lastMessageId) {
		throw new Error('invalid-last-read-message-id');
	}
	if (
		lastReadMessageId !== 0 &&
		!(await checkConversationMessageExists(
			conversationId,
			lastReadMessageId
		))
	) {
		throw new Error('invalid-last-read-message-id');
	}

	await markParticipantRead(conversationId, userId, lastReadMessageId);
}
