export type TChatConversationType = 'public_channel';
export type TChatConversationVisibility = 'public_authenticated';
export type TChatConversationJoinPolicy = 'auto';
export type TChatParticipantRole = 'member' | 'owner';
export type TChatParticipantState = 'active' | 'banned';

export interface IChatMessageSender {
	id: string;
	nickname: string | null;
	username: string;
}

export interface IChatConversationLastMessage {
	created_at: number;
	deleted: boolean;
	id: number;
	preview_text: string;
	sender_name: string;
	sender_user_id: string;
}

export interface IChatConversationListItem {
	archived_at: number | null;
	description: string;
	id: string;
	last_message: IChatConversationLastMessage | null;
	last_read_message_id: number | null;
	slug: string;
	title: string;
	type: TChatConversationType;
	unread_count: number;
	updated_at: number;
}

export interface IChatConversationListData {
	conversations: IChatConversationListItem[];
}

export interface IChatMessageItem {
	body_text: string;
	conversation_id: string;
	created_at: number;
	deleted: boolean;
	deleted_at: number | null;
	id: number;
	sender: IChatMessageSender;
}

export interface IChatMessageListData {
	conversation_id: string;
	has_more: boolean;
	messages: IChatMessageItem[];
}

export interface IChatCreateMessageBody {
	body_text: string;
}

export interface IChatCreateMessageData {
	message: IChatMessageItem;
}

export interface IChatReadBody {
	last_read_message_id: number;
}

export interface IChatReadData {
	conversation_id: string;
	last_read_message_id: number;
}

export interface IAdminChatConversationRecord {
	archived_at: number | null;
	description: string;
	id: string;
	last_message_id: number | null;
	slug: string;
	title: string;
	updated_at: number;
}

export interface IAdminChatConversationListData {
	conversations: IAdminChatConversationRecord[];
}

export interface IAdminChatConversationBody {
	description?: string;
	slug: string;
	title: string;
}

export interface IAdminChatConversationUpdateBody {
	description?: string;
	slug?: string;
	title?: string;
}

export interface IAdminChatMessageRecord {
	body_text: string;
	created_at: number;
	deleted: boolean;
	deleted_at: number | null;
	id: number;
	sender_name: string;
	sender_user_id: string;
}

export interface IAdminChatMessageListData {
	conversation_id: string;
	has_more: boolean;
	messages: IAdminChatMessageRecord[];
}
