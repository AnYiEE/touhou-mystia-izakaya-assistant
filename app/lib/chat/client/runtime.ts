import { useEffect, useSyncExternalStore } from 'react';

import { createServiceApiUrl } from '@/lib/api/serviceClient';
import {
	createChatMessage,
	fetchChatConversations,
	fetchChatMessages,
	markChatConversationRead,
} from './api';
import {
	type TChatRouteKind,
	postChatRuntimeBroadcastMessage,
	subscribeChatRuntimeBroadcastMessage,
} from './broadcast';
import {
	CHAT_RUNTIME_LEASE_RENEW_INTERVAL,
	CHAT_RUNTIME_LEASE_TTL,
	acquireChatRuntimeLease,
	createChatRuntimeTabId,
	readChatRuntimeLease,
	releaseChatRuntimeLease,
	renewChatRuntimeLease,
} from './lease';
import type {
	IChatConversationListItem,
	IChatMessageItem,
} from '@/lib/chat/shared/types';

interface IChatPageNotification {
	body: string;
	conversationId: string;
	createdAt: number;
	id: string;
	title: string;
}

interface IChatRuntimeSnapshot {
	conversations: IChatConversationListItem[];
	currentConversationId: string | null;
	errorMessage: string | null;
	hasOlderMessagesByConversationId: Record<string, boolean>;
	isLeader: boolean;
	isLoadingConversations: boolean;
	isLoadingMessages: boolean;
	isLoadingOlderMessages: boolean;
	isPanelOpen: boolean;
	isSending: boolean;
	messagesByConversationId: Record<string, IChatMessageItem[]>;
	nativeNotificationPermission: NotificationPermission | 'unsupported';
	pageNotifications: IChatPageNotification[];
	userId: string | null;
}

interface IConfigureParams {
	csrfToken: string | null;
	enabled: boolean;
	nativeNotifications: boolean;
	pageNotifications: boolean;
	userId: string | null;
}

interface IChatViewportState {
	conversationId: string | null;
	isAtBottom: boolean;
	isVisible: boolean;
}

interface IChatTabPresence {
	currentConversationId: string | null;
	panelExpanded: boolean;
	routeKind: TChatRouteKind;
	updatedAt: number;
	visible: boolean;
}

const PAGE_NOTIFICATION_TTL = 5000;
const PRESENCE_HEARTBEAT_INTERVAL = 15 * 1000;
const PRESENCE_STALE_TTL = 35 * 1000;
const LEASE_AUDIT_INTERVAL = 10 * 1000;
const INITIAL_MESSAGE_LIMIT = 50;
const INCREMENTAL_MESSAGE_LIMIT = 100;
const NATIVE_NOTIFICATION_CONVERSATION_WINDOW = 15 * 1000;
const NATIVE_NOTIFICATION_GLOBAL_WINDOW = 60 * 1000;
const NATIVE_NOTIFICATION_GLOBAL_MAX = 6;

const INITIAL_SNAPSHOT: IChatRuntimeSnapshot = {
	conversations: [],
	currentConversationId: null,
	errorMessage: null,
	hasOlderMessagesByConversationId: {},
	isLeader: false,
	isLoadingConversations: false,
	isLoadingMessages: false,
	isLoadingOlderMessages: false,
	isPanelOpen: false,
	isSending: false,
	messagesByConversationId: {},
	nativeNotificationPermission:
		typeof Notification === 'undefined'
			? 'unsupported'
			: Notification.permission,
	pageNotifications: [],
	userId: null,
};

const listeners = new Set<() => void>();
const readState = new Map<string, number>();
const tabPresenceMap = new Map<string, IChatTabPresence>();
const nativeNotificationTimes: number[] = [];
const nativeConversationNotificationMeta = new Map<
	string,
	{
		count: number;
		timerId: ReturnType<typeof globalThis.setTimeout> | null;
		windowStartedAt: number;
	}
>();

let snapshot = INITIAL_SNAPSHOT;
let configuredCsrfToken: string | null = null;
let configuredEnabled = false;
let configuredNativeNotifications = false;
let configuredPageNotifications = true;
let configuredUserId: string | null = null;
let currentRouteKind: TChatRouteKind = 'other';
let currentViewportState: IChatViewportState = {
	conversationId: null,
	isAtBottom: true,
	isVisible: false,
};
let activeSessionCount = 0;
let eventSource: EventSource | null = null;
let heartbeatTimerId: ReturnType<typeof globalThis.setInterval> | null = null;
let leaseAuditTimerId: ReturnType<typeof globalThis.setInterval> | null = null;
let leaseRenewTimerId: ReturnType<typeof globalThis.setInterval> | null = null;
let releaseRequested = false;
let requestedNotificationPermission = false;
let unsubscribeBroadcast: (() => void) | null = null;
let windowListenersAttached = false;

const tabId = createChatRuntimeTabId();
const runId = createChatRuntimeTabId();

function emitChange() {
	listeners.forEach((listener) => {
		listener();
	});
}

function setSnapshot(
	next:
		| Partial<IChatRuntimeSnapshot>
		| ((current: IChatRuntimeSnapshot) => IChatRuntimeSnapshot)
) {
	snapshot =
		typeof next === 'function' ? next(snapshot) : { ...snapshot, ...next };
	emitChange();
}

function createErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : 'chat-internal-error';
}

function resetNotificationState() {
	nativeNotificationTimes.length = 0;
	for (const meta of nativeConversationNotificationMeta.values()) {
		if (meta.timerId !== null) {
			globalThis.clearTimeout(meta.timerId);
		}
	}
	nativeConversationNotificationMeta.clear();
}

function resetRuntimeState() {
	readState.clear();
	tabPresenceMap.clear();
	resetNotificationState();
	currentViewportState = {
		conversationId: null,
		isAtBottom: true,
		isVisible: false,
	};
	setSnapshot({
		...INITIAL_SNAPSHOT,
		nativeNotificationPermission:
			typeof Notification === 'undefined'
				? 'unsupported'
				: Notification.permission,
	});
}

function stopEventSource() {
	if (eventSource !== null) {
		eventSource.close();
		eventSource = null;
	}
}

function clearRuntimeIntervals() {
	if (heartbeatTimerId !== null) {
		globalThis.clearInterval(heartbeatTimerId);
		heartbeatTimerId = null;
	}
	if (leaseAuditTimerId !== null) {
		globalThis.clearInterval(leaseAuditTimerId);
		leaseAuditTimerId = null;
	}
	if (leaseRenewTimerId !== null) {
		globalThis.clearInterval(leaseRenewTimerId);
		leaseRenewTimerId = null;
	}
}

function stopLeadership() {
	stopEventSource();
	setSnapshot({ isLeader: false });
}

function getConversationById(conversationId: string) {
	return (
		snapshot.conversations.find(
			(conversation) => conversation.id === conversationId
		) ?? null
	);
}

function getLastLoadedMessageId(conversationId: string) {
	const messages = snapshot.messagesByConversationId[conversationId];
	return messages?.at(-1)?.id ?? null;
}

function getFirstLoadedMessageId(conversationId: string) {
	const messages = snapshot.messagesByConversationId[conversationId];
	return messages?.[0]?.id ?? null;
}

function isCurrentConversationExposed() {
	return currentRouteKind === 'chat-page' || snapshot.isPanelOpen;
}

function checkCurrentViewportCanRead() {
	return (
		document.visibilityState === 'visible' &&
		currentViewportState.isVisible &&
		currentViewportState.isAtBottom &&
		isCurrentConversationExposed() &&
		snapshot.currentConversationId !== null &&
		currentViewportState.conversationId === snapshot.currentConversationId
	);
}

function upsertPresence(tabPresenceTabId: string, presence: IChatTabPresence) {
	tabPresenceMap.set(tabPresenceTabId, presence);
}

function cleanupStalePresence(now = Date.now()) {
	for (const [presenceTabId, presence] of tabPresenceMap) {
		if (now - presence.updatedAt > PRESENCE_STALE_TTL) {
			tabPresenceMap.delete(presenceTabId);
		}
	}
}

function createLocalPresence(now = Date.now()) {
	return {
		currentConversationId: isCurrentConversationExposed()
			? snapshot.currentConversationId
			: null,
		panelExpanded: snapshot.isPanelOpen,
		routeKind: currentRouteKind,
		updatedAt: now,
		visible: document.visibilityState === 'visible',
	} satisfies IChatTabPresence;
}

function checkAnyVisibleTab() {
	cleanupStalePresence();
	for (const presence of tabPresenceMap.values()) {
		if (presence.visible) {
			return true;
		}
	}

	return false;
}

function checkConversationActivelyViewed(conversationId: string) {
	cleanupStalePresence();
	for (const presence of tabPresenceMap.values()) {
		if (
			presence.visible &&
			presence.currentConversationId === conversationId &&
			(presence.routeKind === 'chat-page' || presence.panelExpanded)
		) {
			return true;
		}
	}

	return false;
}

function mergeMessageLists(
	currentMessages: IChatMessageItem[],
	nextMessages: IChatMessageItem[]
) {
	const merged = new Map<number, IChatMessageItem>();

	for (const message of currentMessages) {
		merged.set(message.id, message);
	}
	for (const message of nextMessages) {
		merged.set(message.id, message);
	}

	return [...merged.values()].sort(
		(message1, message2) => message1.id - message2.id
	);
}

function replaceConversationMessages(
	conversationId: string,
	messages: IChatMessageItem[],
	hasMore: boolean
) {
	setSnapshot((current) => ({
		...current,
		hasOlderMessagesByConversationId: {
			...current.hasOlderMessagesByConversationId,
			[conversationId]: hasMore,
		},
		messagesByConversationId: {
			...current.messagesByConversationId,
			[conversationId]: messages,
		},
	}));
}

function appendConversationMessages(
	conversationId: string,
	messages: IChatMessageItem[]
) {
	if (messages.length === 0) {
		return;
	}

	setSnapshot((current) => ({
		...current,
		messagesByConversationId: {
			...current.messagesByConversationId,
			[conversationId]: mergeMessageLists(
				current.messagesByConversationId[conversationId] ?? [],
				messages
			),
		},
	}));
}

function prependConversationMessages(
	conversationId: string,
	messages: IChatMessageItem[],
	hasMore: boolean
) {
	setSnapshot((current) => ({
		...current,
		hasOlderMessagesByConversationId: {
			...current.hasOlderMessagesByConversationId,
			[conversationId]: hasMore,
		},
		messagesByConversationId: {
			...current.messagesByConversationId,
			[conversationId]: mergeMessageLists(
				messages,
				current.messagesByConversationId[conversationId] ?? []
			),
		},
	}));
}

function applyLocalReadState(
	conversationId: string,
	lastReadMessageId: number
) {
	const nextLastReadMessageId = Math.max(
		readState.get(conversationId) ?? 0,
		lastReadMessageId
	);

	readState.set(conversationId, nextLastReadMessageId);
	setSnapshot((current) => ({
		...current,
		conversations: current.conversations.map((conversation) =>
			conversation.id === conversationId
				? {
						...conversation,
						last_read_message_id: nextLastReadMessageId,
						unread_count:
							conversation.last_message === null ||
							conversation.last_message.id <=
								nextLastReadMessageId
								? 0
								: conversation.unread_count,
					}
				: conversation
		),
	}));
}

async function broadcastPresence() {
	if (configuredUserId === null || !configuredEnabled) {
		return;
	}

	const presence = createLocalPresence();
	upsertPresence(tabId, presence);
	await postChatRuntimeBroadcastMessage({
		currentConversationId: presence.currentConversationId,
		panelExpanded: presence.panelExpanded,
		routeKind: presence.routeKind,
		tabId,
		type: 'tab-presence',
		updatedAt: presence.updatedAt,
		userId: configuredUserId,
		visible: presence.visible,
	});
}

async function broadcastPreferences() {
	if (configuredUserId === null) {
		return;
	}

	await postChatRuntimeBroadcastMessage({
		enabled: configuredEnabled,
		nativeNotifications: configuredNativeNotifications,
		pageNotifications: configuredPageNotifications,
		tabId,
		type: 'preferences-updated',
		updatedAt: Date.now(),
		userId: configuredUserId,
	});
}

async function syncReadIfNeeded() {
	if (
		configuredUserId === null ||
		configuredCsrfToken === null ||
		snapshot.currentConversationId === null ||
		!checkCurrentViewportCanRead()
	) {
		return;
	}

	const lastMessageId = getLastLoadedMessageId(
		snapshot.currentConversationId
	);
	if (lastMessageId === null) {
		return;
	}
	if ((readState.get(snapshot.currentConversationId) ?? 0) >= lastMessageId) {
		return;
	}

	readState.set(snapshot.currentConversationId, lastMessageId);
	try {
		await markChatConversationRead(
			snapshot.currentConversationId,
			{ last_read_message_id: lastMessageId },
			configuredCsrfToken
		);
		applyLocalReadState(snapshot.currentConversationId, lastMessageId);
		await postChatRuntimeBroadcastMessage({
			conversationId: snapshot.currentConversationId,
			lastReadMessageId: lastMessageId,
			tabId,
			type: 'read-updated',
			updatedAt: Date.now(),
			userId: configuredUserId,
		});
	} catch {
		readState.delete(snapshot.currentConversationId);
	}
}

export async function refreshChatMessages(conversationId: string) {
	if (configuredUserId === null || !configuredEnabled) {
		return;
	}

	setSnapshot({ isLoadingMessages: true });
	try {
		const data = await fetchChatMessages({
			conversationId,
			limit: INITIAL_MESSAGE_LIMIT,
		});
		replaceConversationMessages(
			conversationId,
			data.messages,
			data.has_more
		);
		setSnapshot({ errorMessage: null, isLoadingMessages: false });
		await syncReadIfNeeded();
	} catch (error) {
		setSnapshot({
			errorMessage: createErrorMessage(error),
			isLoadingMessages: false,
		});
	}
}

export async function refreshChatConversations() {
	if (configuredUserId === null || !configuredEnabled) {
		return;
	}

	setSnapshot({ isLoadingConversations: true });
	try {
		const data = await fetchChatConversations();
		for (const conversation of data.conversations) {
			if (conversation.last_read_message_id !== null) {
				readState.set(
					conversation.id,
					conversation.last_read_message_id
				);
			}
		}

		setSnapshot((current) => {
			const nextCurrentConversationId =
				current.currentConversationId !== null &&
				data.conversations.some(
					({ id }) => id === current.currentConversationId
				)
					? current.currentConversationId
					: (data.conversations[0]?.id ?? null);

			return {
				...current,
				conversations: data.conversations,
				currentConversationId: nextCurrentConversationId,
				errorMessage: null,
				isLoadingConversations: false,
			};
		});

		if (
			snapshot.currentConversationId !== null &&
			snapshot.messagesByConversationId[
				snapshot.currentConversationId
			] === undefined
		) {
			await refreshChatMessages(snapshot.currentConversationId);
		}
	} catch (error) {
		setSnapshot({
			errorMessage: createErrorMessage(error),
			isLoadingConversations: false,
		});
	}
}

async function pullConversationMessagesAfter(conversationId: string) {
	if (configuredUserId === null || !configuredEnabled) {
		return;
	}

	const after = getLastLoadedMessageId(conversationId);
	if (after === null) {
		await refreshChatMessages(conversationId);
		return;
	}

	try {
		const data = await fetchChatMessages({
			after,
			conversationId,
			limit: INCREMENTAL_MESSAGE_LIMIT,
		});
		appendConversationMessages(conversationId, data.messages);
		await syncReadIfNeeded();
	} catch (error) {
		setSnapshot({ errorMessage: createErrorMessage(error) });
	}
}

export function openChatPanel() {
	setSnapshot({ isPanelOpen: true });
	void broadcastPresence();
}

export function selectChatConversation(conversationId: string) {
	setSnapshot({ currentConversationId: conversationId });
	void broadcastPresence();
	if (snapshot.messagesByConversationId[conversationId] === undefined) {
		void refreshChatMessages(conversationId);
		return;
	}

	void pullConversationMessagesAfter(conversationId);
}

function pushPageNotification({
	body,
	conversationId,
	title,
}: Pick<IChatPageNotification, 'body' | 'conversationId' | 'title'>) {
	const notification = {
		body,
		conversationId,
		createdAt: Date.now(),
		id: `${Date.now()}-${Math.random()}`,
		title,
	} satisfies IChatPageNotification;

	setSnapshot((current) => ({
		...current,
		pageNotifications: [...current.pageNotifications, notification].slice(
			-4
		),
	}));

	globalThis.setTimeout(() => {
		setSnapshot((current) => ({
			...current,
			pageNotifications: current.pageNotifications.filter(
				(item) => item.id !== notification.id
			),
		}));
	}, PAGE_NOTIFICATION_TTL);
}

function createConversationNotificationText(conversationId: string) {
	const conversation = getConversationById(conversationId);
	if (conversation === null) {
		return null;
	}

	return {
		body:
			conversation.last_message?.preview_text ?? conversation.description,
		title: conversation.title,
	};
}

function pruneNativeNotificationTimes(now = Date.now()) {
	while (nativeNotificationTimes.length > 0) {
		const [oldest] = nativeNotificationTimes;
		if (
			oldest === undefined ||
			now - oldest <= NATIVE_NOTIFICATION_GLOBAL_WINDOW
		) {
			break;
		}

		nativeNotificationTimes.shift();
	}
}

function updateNotificationPermissionSnapshot() {
	setSnapshot({
		nativeNotificationPermission:
			typeof Notification === 'undefined'
				? 'unsupported'
				: Notification.permission,
	});
}

async function requestNotificationPermissionIfNeeded() {
	if (
		requestedNotificationPermission ||
		!configuredNativeNotifications ||
		typeof Notification === 'undefined' ||
		Notification.permission !== 'default' ||
		document.visibilityState !== 'visible'
	) {
		updateNotificationPermissionSnapshot();
		return;
	}

	requestedNotificationPermission = true;
	try {
		await Notification.requestPermission();
	} catch (error) {
		console.warn('Chat notification permission request failed.', error);
	}
	updateNotificationPermissionSnapshot();
}

function showNativeNotification(conversationId: string) {
	if (
		typeof Notification === 'undefined' ||
		Notification.permission !== 'granted'
	) {
		updateNotificationPermissionSnapshot();
		return;
	}

	const conversation = getConversationById(conversationId);
	if (conversation === null) {
		return;
	}

	const meta = nativeConversationNotificationMeta.get(conversationId) ?? {
		count: 0,
		timerId: null,
		windowStartedAt: 0,
	};
	const now = Date.now();
	const withinWindow =
		now - meta.windowStartedAt < NATIVE_NOTIFICATION_CONVERSATION_WINDOW;

	meta.count += 1;
	if (!withinWindow) {
		meta.windowStartedAt = now;
	}
	if (meta.timerId !== null) {
		globalThis.clearTimeout(meta.timerId);
		meta.timerId = null;
	}

	if (withinWindow) {
		meta.timerId = globalThis.setTimeout(() => {
			meta.timerId = null;
			showNativeNotification(conversationId);
		}, NATIVE_NOTIFICATION_CONVERSATION_WINDOW);
		nativeConversationNotificationMeta.set(conversationId, meta);
		return;
	}

	pruneNativeNotificationTimes(now);
	if (nativeNotificationTimes.length >= NATIVE_NOTIFICATION_GLOBAL_MAX) {
		nativeConversationNotificationMeta.set(conversationId, meta);
		return;
	}

	nativeNotificationTimes.push(now);
	const countText =
		meta.count > 1
			? `${conversation.title} 有 ${meta.count} 条新消息`
			: conversation.title;
	const body =
		meta.count > 1
			? (conversation.last_message?.preview_text ??
				conversation.description)
			: (conversation.last_message?.preview_text ??
				conversation.description);

	try {
		const notification = new Notification(countText, {
			body,
			tag: `chat:${conversationId}`,
		});
		notification.addEventListener('click', () => {
			globalThis.focus();
			openChatPanel();
			selectChatConversation(conversationId);
			notification.close();
		});
	} catch (error) {
		console.warn('Chat native notification failed.', error);
	}

	meta.count = 0;
	nativeConversationNotificationMeta.set(conversationId, meta);
}

function handleIncomingMessageNotification(
	conversationId: string,
	senderId: string
) {
	if (configuredUserId === null || senderId === configuredUserId) {
		return;
	}
	if (checkConversationActivelyViewed(conversationId)) {
		return;
	}

	const notificationText = createConversationNotificationText(conversationId);
	if (notificationText === null) {
		return;
	}

	const localVisible = document.visibilityState === 'visible';
	if (localVisible && configuredPageNotifications) {
		pushPageNotification({
			body: notificationText.body,
			conversationId,
			title: notificationText.title,
		});
		return;
	}
	if (
		!localVisible &&
		snapshot.isLeader &&
		configuredNativeNotifications &&
		!checkAnyVisibleTab()
	) {
		showNativeNotification(conversationId);
	}
}

async function refreshCurrentConversationIncrementally() {
	if (snapshot.currentConversationId === null) {
		return;
	}

	await pullConversationMessagesAfter(snapshot.currentConversationId);
}

async function handleRemoteConversationUpdated(conversationId: string) {
	await refreshChatConversations();
	if (
		snapshot.currentConversationId === conversationId &&
		snapshot.messagesByConversationId[conversationId] !== undefined
	) {
		await pullConversationMessagesAfter(conversationId);
	}
}

async function handleRemoteMessageCreated({
	conversationId,
	senderId,
}: {
	conversationId: string;
	senderId: string;
}) {
	await refreshChatConversations();
	if (
		snapshot.currentConversationId === conversationId ||
		snapshot.messagesByConversationId[conversationId] !== undefined
	) {
		await pullConversationMessagesAfter(conversationId);
	}
	handleIncomingMessageNotification(conversationId, senderId);
}

async function handleRemoteMessageDeleted(conversationId: string) {
	await refreshChatConversations();
	if (snapshot.messagesByConversationId[conversationId] !== undefined) {
		await refreshChatMessages(conversationId);
	}
}

function startEventSource() {
	stopEventSource();
	if (configuredUserId === null || !configuredEnabled || !snapshot.isLeader) {
		return;
	}

	const userId = configuredUserId;
	const source = new EventSource(createServiceApiUrl('/api/v1/chat/stream'), {
		withCredentials: true,
	});

	source.addEventListener('open', () => {
		void refreshChatConversations();
		void refreshCurrentConversationIncrementally();
	});
	source.addEventListener('chat.conversation.updated', (event) => {
		try {
			const data = JSON.parse((event as MessageEvent<string>).data) as {
				conversationId?: string;
			};
			if (typeof data.conversationId === 'string') {
				void handleRemoteConversationUpdated(data.conversationId);
				void postChatRuntimeBroadcastMessage({
					conversationId: data.conversationId,
					tabId,
					type: 'conversation-updated',
					updatedAt: Date.now(),
					userId,
				});
				return;
			}
		} catch {
			/* empty */
		}

		void refreshChatConversations();
	});
	source.addEventListener('chat.participant.updated', () => {
		void refreshChatConversations();
	});
	source.addEventListener('chat.message.created', (event) => {
		try {
			const data = JSON.parse((event as MessageEvent<string>).data) as {
				conversationId?: string;
				createdAt?: number;
				messageId?: number;
				senderId?: string;
			};
			if (
				typeof data.conversationId === 'string' &&
				typeof data.messageId === 'number' &&
				typeof data.senderId === 'string'
			) {
				void handleRemoteMessageCreated({
					conversationId: data.conversationId,
					senderId: data.senderId,
				});
				void postChatRuntimeBroadcastMessage({
					conversationId: data.conversationId,
					createdAt:
						typeof data.createdAt === 'number'
							? data.createdAt
							: Date.now(),
					messageId: data.messageId,
					senderId: data.senderId,
					tabId,
					type: 'message-created',
					userId,
				});
				return;
			}
		} catch {
			/* empty */
		}

		void refreshChatConversations();
	});
	source.addEventListener('chat.message.deleted', (event) => {
		try {
			const data = JSON.parse((event as MessageEvent<string>).data) as {
				conversationId?: string;
				deletedAt?: number;
				messageId?: number;
			};
			if (
				typeof data.conversationId === 'string' &&
				typeof data.messageId === 'number'
			) {
				void handleRemoteMessageDeleted(data.conversationId);
				void postChatRuntimeBroadcastMessage({
					conversationId: data.conversationId,
					deletedAt:
						typeof data.deletedAt === 'number'
							? data.deletedAt
							: Date.now(),
					messageId: data.messageId,
					tabId,
					type: 'message-deleted',
					userId,
				});
				return;
			}
		} catch {
			/* empty */
		}

		void refreshChatConversations();
	});

	eventSource = source;
}

async function updateLeaderState(nextIsLeader: boolean) {
	if (snapshot.isLeader === nextIsLeader) {
		return;
	}

	setSnapshot({ isLeader: nextIsLeader });
	if (nextIsLeader) {
		startEventSource();
		if (configuredUserId !== null) {
			await postChatRuntimeBroadcastMessage({
				currentConversationId: snapshot.currentConversationId,
				leaderTabId: tabId,
				leaseExpiresAt: Date.now() + CHAT_RUNTIME_LEASE_TTL,
				tabId,
				type: 'leader-changed',
				userId: configuredUserId,
			});
		}
		return;
	}

	stopEventSource();
}

async function reconcileLeadership() {
	if (configuredUserId === null || !configuredEnabled) {
		stopLeadership();
		return;
	}

	const lease = readChatRuntimeLease(configuredUserId);
	const now = Date.now();
	const isLeaseMine =
		lease !== null &&
		lease.ownerRunId === runId &&
		lease.ownerTabId === tabId;

	if (snapshot.isLeader) {
		if (
			lease !== null &&
			isLeaseMine &&
			(await renewChatRuntimeLease(configuredUserId, tabId, runId, now))
		) {
			return;
		}

		await updateLeaderState(false);
	}

	if (lease !== null && lease.expiresAt > now && !isLeaseMine) {
		return;
	}

	if (await acquireChatRuntimeLease(configuredUserId, tabId, runId, now)) {
		await updateLeaderState(true);
	}
}

function ensureRuntimeIntervals() {
	heartbeatTimerId ??= globalThis.setInterval(() => {
		void broadcastPresence();
	}, PRESENCE_HEARTBEAT_INTERVAL);
	leaseRenewTimerId ??= globalThis.setInterval(() => {
		void reconcileLeadership();
	}, CHAT_RUNTIME_LEASE_RENEW_INTERVAL);
	leaseAuditTimerId ??= globalThis.setInterval(() => {
		if (document.visibilityState === 'visible') {
			void reconcileLeadership();
		}
	}, LEASE_AUDIT_INTERVAL);
}

function handleWindowVisibilityChange() {
	void broadcastPresence();
	if (document.visibilityState === 'visible') {
		void reconcileLeadership();
		void requestNotificationPermissionIfNeeded();
	}
}

function handleWindowFocus() {
	void broadcastPresence();
	void reconcileLeadership();
}

function handleWindowBlur() {
	void broadcastPresence();
}

function handleWindowPageHide() {
	releaseRequested = true;
	if (configuredUserId !== null && snapshot.isLeader) {
		void releaseChatRuntimeLease(configuredUserId, tabId, runId);
	}
}

function ensureWindowListeners() {
	if (windowListenersAttached) {
		return;
	}

	document.addEventListener('visibilitychange', handleWindowVisibilityChange);
	globalThis.addEventListener('focus', handleWindowFocus);
	globalThis.addEventListener('blur', handleWindowBlur);
	globalThis.addEventListener('pagehide', handleWindowPageHide);
	windowListenersAttached = true;
}

function ensureBroadcastSubscription() {
	if (unsubscribeBroadcast !== null) {
		return;
	}

	unsubscribeBroadcast = subscribeChatRuntimeBroadcastMessage((message) => {
		if (configuredUserId === null) {
			return;
		}
		if (message.userId !== configuredUserId || message.tabId === tabId) {
			return;
		}

		switch (message.type) {
			case 'conversation-updated':
				void handleRemoteConversationUpdated(message.conversationId);
				break;

			case 'leader-changed':
				if (message.leaderTabId !== tabId && snapshot.isLeader) {
					stopLeadership();
				}
				break;

			case 'message-created':
				void handleRemoteMessageCreated({
					conversationId: message.conversationId,
					senderId: message.senderId,
				});
				break;

			case 'message-deleted':
				void handleRemoteMessageDeleted(message.conversationId);
				break;

			case 'preferences-updated':
				updateNotificationPermissionSnapshot();
				break;

			case 'read-updated':
				applyLocalReadState(
					message.conversationId,
					message.lastReadMessageId
				);
				break;

			case 'tab-presence':
				upsertPresence(message.tabId, {
					currentConversationId: message.currentConversationId,
					panelExpanded: message.panelExpanded,
					routeKind: message.routeKind,
					updatedAt: message.updatedAt,
					visible: message.visible,
				});
				break;
		}
	});
}

export async function loadOlderChatMessages(conversationId: string) {
	if (configuredUserId === null || !configuredEnabled) {
		return;
	}

	const before = getFirstLoadedMessageId(conversationId);
	if (before === null) {
		await refreshChatMessages(conversationId);
		return;
	}

	setSnapshot({ isLoadingOlderMessages: true });
	try {
		const data = await fetchChatMessages({
			before,
			conversationId,
			limit: INITIAL_MESSAGE_LIMIT,
		});
		prependConversationMessages(
			conversationId,
			data.messages,
			data.has_more
		);
		setSnapshot({ errorMessage: null, isLoadingOlderMessages: false });
	} catch (error) {
		setSnapshot({
			errorMessage: createErrorMessage(error),
			isLoadingOlderMessages: false,
		});
	}
}

export function configureChatRuntime({
	csrfToken,
	enabled,
	nativeNotifications,
	pageNotifications,
	userId,
}: IConfigureParams) {
	const previousUserId = configuredUserId;
	const wasLeader = snapshot.isLeader;
	const userChanged = configuredUserId !== userId;
	const enabledChanged = configuredEnabled !== enabled;
	const nativeNotificationsChanged =
		configuredNativeNotifications !== nativeNotifications;
	const pageNotificationsChanged =
		configuredPageNotifications !== pageNotifications;

	configuredUserId = userId;
	configuredCsrfToken = csrfToken;
	configuredEnabled = enabled;
	configuredNativeNotifications = nativeNotifications;
	configuredPageNotifications = pageNotifications;
	releaseRequested = false;

	if (userId === null || !enabled) {
		stopLeadership();
		clearRuntimeIntervals();
		resetRuntimeState();
		if (wasLeader && previousUserId !== null) {
			void releaseChatRuntimeLease(previousUserId, tabId, runId);
		}
		return;
	}

	if (userChanged) {
		if (wasLeader && previousUserId !== null) {
			void releaseChatRuntimeLease(previousUserId, tabId, runId);
		}
		requestedNotificationPermission = false;
		resetRuntimeState();
	}

	setSnapshot({ userId });
	ensureBroadcastSubscription();
	ensureWindowListeners();
	ensureRuntimeIntervals();
	void broadcastPreferences();
	void broadcastPresence();
	void requestNotificationPermissionIfNeeded();

	if (
		userChanged ||
		enabledChanged ||
		nativeNotificationsChanged ||
		pageNotificationsChanged
	) {
		void reconcileLeadership();
		void refreshChatConversations();
	}
}

export function closeChatPanel() {
	setSnapshot({ isPanelOpen: false });
	void broadcastPresence();
}

export function setChatPanelOpen(value: boolean) {
	setSnapshot({ isPanelOpen: value });
	void broadcastPresence();
}

export function setChatRouteKind(routeKind: TChatRouteKind) {
	currentRouteKind = routeKind;
	void broadcastPresence();
	void syncReadIfNeeded();
}

export function setChatViewportState(nextState: IChatViewportState) {
	currentViewportState = nextState;
	void broadcastPresence();
	void syncReadIfNeeded();
}

export function dismissChatPageNotification(id: string) {
	setSnapshot((current) => ({
		...current,
		pageNotifications: current.pageNotifications.filter(
			(notification) => notification.id !== id
		),
	}));
}

export async function sendChatMessage(bodyText: string) {
	if (
		configuredCsrfToken === null ||
		snapshot.currentConversationId === null ||
		snapshot.isSending
	) {
		return false;
	}

	const conversationId = snapshot.currentConversationId;

	setSnapshot({ isSending: true });
	try {
		await createChatMessage(
			conversationId,
			{ body_text: bodyText },
			configuredCsrfToken
		);
		await Promise.all([
			refreshChatConversations(),
			refreshChatMessages(conversationId),
		]);
		setSnapshot({ errorMessage: null, isSending: false });
		return true;
	} catch (error) {
		setSnapshot({
			errorMessage: createErrorMessage(error),
			isSending: false,
		});
		return false;
	}
}

export function subscribeChatRuntime(listener: () => void) {
	listeners.add(listener);

	return () => {
		listeners.delete(listener);
	};
}

export function getChatRuntimeSnapshot() {
	return snapshot;
}

export function useChatRuntimeSnapshot() {
	return useSyncExternalStore(
		subscribeChatRuntime,
		getChatRuntimeSnapshot,
		getChatRuntimeSnapshot
	);
}

export function useChatRuntimeSession(params: IConfigureParams) {
	useEffect(() => {
		configureChatRuntime({
			csrfToken: params.csrfToken,
			enabled: params.enabled,
			nativeNotifications: params.nativeNotifications,
			pageNotifications: params.pageNotifications,
			userId: params.userId,
		});
	}, [
		params.csrfToken,
		params.enabled,
		params.nativeNotifications,
		params.pageNotifications,
		params.userId,
	]);

	useEffect(() => {
		activeSessionCount += 1;

		return () => {
			activeSessionCount = Math.max(0, activeSessionCount - 1);
			if (
				activeSessionCount > 0 ||
				releaseRequested ||
				configuredUserId === null ||
				!configuredEnabled ||
				!snapshot.isLeader
			) {
				return;
			}

			void releaseChatRuntimeLease(configuredUserId, tabId, runId);
		};
	}, []);
}
