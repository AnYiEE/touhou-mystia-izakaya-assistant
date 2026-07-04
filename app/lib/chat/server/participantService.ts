import { getAccountDatabase } from '@/lib/account/server/db';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TChatConversation,
	TChatParticipant,
	TChatParticipantNew,
} from '@/lib/db/types';

const PARTICIPANT_TABLE_NAME = TABLE_NAME_MAP.chatParticipant;

function createParticipantRecord(
	conversation: Pick<TChatConversation, 'id' | 'last_message_id'>,
	userId: string,
	now: number
) {
	return {
		banned_until: null,
		conversation_id: conversation.id,
		joined_at: now,
		last_read_message_id: conversation.last_message_id,
		last_seen_at: now,
		muted_until: null,
		role: 'member',
		state: 'active',
		user_id: userId,
	} satisfies TChatParticipantNew;
}

export async function getParticipant(conversationId: string, userId: string) {
	const db = await getAccountDatabase();

	return (
		(await db
			.selectFrom(PARTICIPANT_TABLE_NAME)
			.selectAll()
			.where('conversation_id', '=', conversationId)
			.where('user_id', '=', userId)
			.executeTakeFirst()) ?? null
	);
}

export async function listParticipantsForConversations(
	conversationIds: ReadonlyArray<string>,
	userId: string
) {
	if (conversationIds.length === 0) {
		return [];
	}

	const db = await getAccountDatabase();

	return db
		.selectFrom(PARTICIPANT_TABLE_NAME)
		.selectAll()
		.where('conversation_id', 'in', conversationIds)
		.where('user_id', '=', userId)
		.execute();
}

export async function ensureParticipant(
	conversation: Pick<TChatConversation, 'id'>,
	userId: string,
	now = Date.now()
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const existing = await trx
			.selectFrom(PARTICIPANT_TABLE_NAME)
			.selectAll()
			.where('conversation_id', '=', conversation.id)
			.where('user_id', '=', userId)
			.executeTakeFirst();
		if (existing !== undefined) {
			return existing;
		}

		const baselineConversation = await trx
			.selectFrom(TABLE_NAME_MAP.chatConversation)
			.select(['id', 'last_message_id'])
			.where('id', '=', conversation.id)
			.executeTakeFirst();
		if (baselineConversation === undefined) {
			return null;
		}

		await trx
			.insertInto(PARTICIPANT_TABLE_NAME)
			.values(createParticipantRecord(baselineConversation, userId, now))
			.onConflict((oc) =>
				oc.columns(['conversation_id', 'user_id']).doNothing()
			)
			.execute();

		return (
			(await trx
				.selectFrom(PARTICIPANT_TABLE_NAME)
				.selectAll()
				.where('conversation_id', '=', conversation.id)
				.where('user_id', '=', userId)
				.executeTakeFirst()) ?? null
		);
	});
}

export async function markParticipantRead(
	conversationId: string,
	userId: string,
	lastReadMessageId: number,
	now = Date.now()
) {
	const db = await getAccountDatabase();

	await db
		.updateTable(PARTICIPANT_TABLE_NAME)
		.set({
			last_read_message_id: lastReadMessageId,
			last_seen_at: now,
		} satisfies Partial<TChatParticipant>)
		.where('conversation_id', '=', conversationId)
		.where('user_id', '=', userId)
		.where((eb) =>
			eb.or([
				eb('last_read_message_id', 'is', null),
				eb('last_read_message_id', '<', lastReadMessageId),
			])
		)
		.execute();
}
