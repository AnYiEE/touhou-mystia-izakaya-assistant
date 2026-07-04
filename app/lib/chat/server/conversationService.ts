import { getAccountDatabase } from '@/lib/account/server/db';
import { createAccountUserProfile } from '@/lib/account/server/user';
import { listUsersByIds } from '@/lib/account/server/repositories/users';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TChatConversation,
	TChatMessage,
	TChatParticipant,
} from '@/lib/db/types';
import type {
	IChatConversationLastMessage,
	IChatConversationListItem,
} from '@/lib/chat/shared/types';
import { listParticipantsForConversations } from './participantService';

const CONVERSATION_TABLE_NAME = TABLE_NAME_MAP.chatConversation;
const MESSAGE_TABLE_NAME = TABLE_NAME_MAP.chatMessage;

function createPreviewText(bodyText: string) {
	const normalized = bodyText.replaceAll(/\s+/gu, ' ').trim();

	return normalized.length <= 80
		? normalized
		: `${normalized.slice(0, 80)}...`;
}

function createLastMessageItem(
	message: TChatMessage | null,
	participantUser: ReturnType<typeof createAccountUserProfile> | null
) {
	if (message === null || participantUser === null) {
		return null;
	}

	return {
		created_at: message.created_at,
		deleted: message.deleted_at !== null,
		id: message.id,
		preview_text:
			message.deleted_at === null
				? createPreviewText(message.body_text)
				: '消息已删除',
		sender_name: participantUser.nickname ?? participantUser.username,
		sender_user_id: participantUser.id,
	} satisfies IChatConversationLastMessage;
}

export async function getConversationById(id: string) {
	const db = await getAccountDatabase();

	return (
		(await db
			.selectFrom(CONVERSATION_TABLE_NAME)
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst()) ?? null
	);
}

async function countUnreadMessages(
	conversationId: string,
	participant: TChatParticipant | null
) {
	if (participant === null) {
		return 0;
	}

	const db = await getAccountDatabase();
	let query = db
		.selectFrom(MESSAGE_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('count'))
		.where('conversation_id', '=', conversationId)
		.where('deleted_at', 'is', null);

	if (participant.last_read_message_id !== null) {
		query = query.where('id', '>', participant.last_read_message_id);
	}

	const row = await query.executeTakeFirstOrThrow();

	return row.count;
}

export async function listPublicConversationsForUser(
	userId: string
): Promise<IChatConversationListItem[]> {
	const db = await getAccountDatabase();
	const conversations = await db
		.selectFrom(CONVERSATION_TABLE_NAME)
		.selectAll()
		.where('visibility', '=', 'public_authenticated')
		.orderBy('created_at', 'asc')
		.orderBy('id', 'asc')
		.execute();

	const participants = await listParticipantsForConversations(
		conversations.map(({ id }) => id),
		userId
	);
	const participantMap = new Map(
		participants.map((participant) => [
			participant.conversation_id,
			participant,
		])
	);

	const lastMessageIds = conversations
		.map(({ last_message_id }) => last_message_id)
		.filter((messageId): messageId is number => messageId !== null);
	const lastMessages =
		lastMessageIds.length === 0
			? []
			: await db
					.selectFrom(MESSAGE_TABLE_NAME)
					.selectAll()
					.where('id', 'in', lastMessageIds)
					.execute();
	const lastMessageMap = new Map(
		lastMessages.map((message) => [message.id, message])
	);

	const senderProfiles = await listUsersByIds(
		lastMessages.map(({ sender_user_id }) => sender_user_id)
	);
	const senderMap = new Map(
		senderProfiles.map((user) => [user.id, createAccountUserProfile(user)])
	);

	const unreadCounts = new Map<string, number>(
		await Promise.all(
			conversations.map(
				async (conversation): Promise<readonly [string, number]> => [
					conversation.id,
					await countUnreadMessages(
						conversation.id,
						participantMap.get(conversation.id) ?? null
					),
				]
			)
		)
	);

	return conversations.map((conversation) => {
		const participant = participantMap.get(conversation.id) ?? null;
		const lastMessage =
			conversation.last_message_id === null
				? null
				: (lastMessageMap.get(conversation.last_message_id) ?? null);
		const sender =
			lastMessage === null
				? null
				: (senderMap.get(lastMessage.sender_user_id) ?? null);

		return {
			archived_at: conversation.archived_at,
			description: conversation.description,
			id: conversation.id,
			last_message: createLastMessageItem(lastMessage, sender),
			last_read_message_id: participant?.last_read_message_id ?? null,
			slug: conversation.slug,
			title: conversation.title,
			type: conversation.type,
			unread_count: unreadCounts.get(conversation.id) ?? 0,
			updated_at: conversation.updated_at,
		} satisfies IChatConversationListItem;
	});
}

export function checkConversationWritable(
	conversation: Pick<TChatConversation, 'archived_at'>
) {
	return conversation.archived_at === null;
}
