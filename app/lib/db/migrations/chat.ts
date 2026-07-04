import { type Kysely } from 'kysely';

import { TABLE_NAME_MAP } from '../constant';
import { type TDatabase } from '../types';
import { dropMismatchedSqliteIndexes } from '../utils';

const DEFAULT_PUBLIC_CONVERSATION = {
	description: '默认公共频道',
	id: 'chat-public-lobby',
	slug: 'lobby',
	title: '公共频道',
} as const;

export async function migrateChatTables(database: Kysely<TDatabase>) {
	await database.schema
		.createTable(TABLE_NAME_MAP.chatConversation)
		.ifNotExists()
		.addColumn('id', 'text', (col) => col.notNull().primaryKey())
		.addColumn('type', 'text', (col) =>
			col.notNull().defaultTo('public_channel')
		)
		.addColumn('slug', 'text', (col) => col.notNull())
		.addColumn('title', 'text', (col) => col.notNull())
		.addColumn('description', 'text', (col) => col.notNull().defaultTo(''))
		.addColumn('visibility', 'text', (col) =>
			col.notNull().defaultTo('public_authenticated')
		)
		.addColumn('join_policy', 'text', (col) =>
			col.notNull().defaultTo('auto')
		)
		.addColumn('archived_at', 'integer')
		.addColumn('created_by_user_id', 'text', (col) =>
			col.references(`${TABLE_NAME_MAP.user}.id`).onDelete('set null')
		)
		.addColumn('created_at', 'integer', (col) => col.notNull())
		.addColumn('updated_at', 'integer', (col) => col.notNull())
		.addColumn('last_message_id', 'integer')
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.chatParticipant)
		.ifNotExists()
		.addColumn('conversation_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.chatConversation}.id`)
				.onDelete('cascade')
		)
		.addColumn('user_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.user}.id`)
				.onDelete('cascade')
		)
		.addColumn('role', 'text', (col) => col.notNull().defaultTo('member'))
		.addColumn('state', 'text', (col) => col.notNull().defaultTo('active'))
		.addColumn('joined_at', 'integer', (col) => col.notNull())
		.addColumn('last_read_message_id', 'integer')
		.addColumn('last_seen_at', 'integer')
		.addColumn('muted_until', 'integer')
		.addColumn('banned_until', 'integer')
		.addPrimaryKeyConstraint('chat_participants_primary_key', [
			'conversation_id',
			'user_id',
		])
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.chatMessage)
		.ifNotExists()
		.addColumn('id', 'integer', (col) =>
			col.notNull().primaryKey().autoIncrement()
		)
		.addColumn('conversation_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.chatConversation}.id`)
				.onDelete('cascade')
		)
		.addColumn('sender_user_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.user}.id`)
				.onDelete('cascade')
		)
		.addColumn('body_text', 'text', (col) => col.notNull())
		.addColumn('created_at', 'integer', (col) => col.notNull())
		.addColumn('deleted_at', 'integer')
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.chatModerationEvent)
		.ifNotExists()
		.addColumn('id', 'integer', (col) =>
			col.notNull().primaryKey().autoIncrement()
		)
		.addColumn('conversation_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.chatConversation}.id`)
				.onDelete('cascade')
		)
		.addColumn('actor_user_id', 'text', (col) =>
			col.references(`${TABLE_NAME_MAP.user}.id`).onDelete('set null')
		)
		.addColumn('target_user_id', 'text', (col) =>
			col.references(`${TABLE_NAME_MAP.user}.id`).onDelete('set null')
		)
		.addColumn('message_id', 'integer')
		.addColumn('event_type', 'text', (col) => col.notNull())
		.addColumn('reason', 'text')
		.addColumn('created_at', 'integer', (col) => col.notNull())
		.execute();

	await dropMismatchedSqliteIndexes(database, [
		{
			columns: ['slug'],
			indexName: 'chat_conversations_slug_unique_index',
			tableName: TABLE_NAME_MAP.chatConversation,
			unique: true,
		},
		{
			columns: ['visibility', 'updated_at', 'id'],
			indexName: 'chat_conversations_visibility_updated_id_index',
			tableName: TABLE_NAME_MAP.chatConversation,
		},
		{
			columns: ['user_id', 'state'],
			indexName: 'chat_participants_user_state_index',
			tableName: TABLE_NAME_MAP.chatParticipant,
		},
		{
			columns: ['conversation_id', 'state'],
			indexName: 'chat_participants_conversation_state_index',
			tableName: TABLE_NAME_MAP.chatParticipant,
		},
		{
			columns: ['conversation_id', 'id'],
			indexName: 'chat_messages_conversation_id_id_index',
			tableName: TABLE_NAME_MAP.chatMessage,
		},
		{
			columns: ['sender_user_id', 'created_at'],
			indexName: 'chat_messages_sender_created_at_index',
			tableName: TABLE_NAME_MAP.chatMessage,
		},
		{
			columns: ['conversation_id', 'created_at'],
			indexName: 'chat_moderation_events_conversation_created_at_index',
			tableName: TABLE_NAME_MAP.chatModerationEvent,
		},
	]);

	await database.schema
		.createIndex('chat_conversations_slug_unique_index')
		.ifNotExists()
		.unique()
		.on(TABLE_NAME_MAP.chatConversation)
		.column('slug')
		.execute();

	await database.schema
		.createIndex('chat_conversations_visibility_updated_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.chatConversation)
		.columns(['visibility', 'updated_at', 'id'])
		.execute();

	await database.schema
		.createIndex('chat_participants_user_state_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.chatParticipant)
		.columns(['user_id', 'state'])
		.execute();

	await database.schema
		.createIndex('chat_participants_conversation_state_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.chatParticipant)
		.columns(['conversation_id', 'state'])
		.execute();

	await database.schema
		.createIndex('chat_messages_conversation_id_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.chatMessage)
		.columns(['conversation_id', 'id'])
		.execute();

	await database.schema
		.createIndex('chat_messages_sender_created_at_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.chatMessage)
		.columns(['sender_user_id', 'created_at'])
		.execute();

	await database.schema
		.createIndex('chat_moderation_events_conversation_created_at_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.chatModerationEvent)
		.columns(['conversation_id', 'created_at'])
		.execute();

	const now = Date.now();
	await database
		.insertInto(TABLE_NAME_MAP.chatConversation)
		.values({
			archived_at: null,
			created_at: now,
			created_by_user_id: null,
			description: DEFAULT_PUBLIC_CONVERSATION.description,
			id: DEFAULT_PUBLIC_CONVERSATION.id,
			join_policy: 'auto',
			last_message_id: null,
			slug: DEFAULT_PUBLIC_CONVERSATION.slug,
			title: DEFAULT_PUBLIC_CONVERSATION.title,
			type: 'public_channel',
			updated_at: now,
			visibility: 'public_authenticated',
		})
		.onConflict((oc) => oc.column('slug').doNothing())
		.execute();
}
