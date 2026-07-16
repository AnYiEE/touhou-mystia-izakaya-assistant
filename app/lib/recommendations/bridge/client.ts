'use client';

import { compareVersions } from 'compare-versions';

import { siteConfig } from '@/configs';
import { accountStore, globalStore } from '@/stores';
import {
	checkSuggestMealsAbortError,
	createRoundRobinSuggestMealsScheduler,
} from '@/utils/customer/customer_rare/suggestMealsEngine';
import { suggestMeals } from '@/utils/customer/customer_rare/suggestMeals';

import {
	BRIDGE_MESSAGE_MAX_BYTES,
	RECOMMENDATION_BRIDGE_CLOSE_CODES,
	parseJsonWithUniqueMembers,
	parseRecommendationBridgeMessage,
} from './protocol';
import {
	discardRecommendationBridgeLaunchDescriptor,
	readRecommendationBridgeLaunchDescriptor,
} from './launchDescriptor';
import {
	type IV1RecommendationRequestMessage,
	V1_REQUEST_ID_PATTERN,
} from './v1/protocol';
import { adaptV1RecommendationRequest } from './v1/requestAdapter';
import {
	serializeV1RecommendationError,
	serializeV1RecommendationResult,
} from './v1/responseSerializer';

const CLIENT_MAX_IN_FLIGHT = 4;
const HANDSHAKE_TIMEOUT_MS = 5000;
const READY_STABLE_RESET_MS = 30_000;
const RECONNECT_BUDGET_MS = 60_000;
const RECONNECT_DELAYS_MS = [500, 1000, 2000, 4000, 8000, 10_000] as const;
const RECENT_REQUEST_ID_LIMIT = 256;
const MAX_PROTOCOL_ERRORS = 3;

type TBridgeState =
	| 'connecting'
	| 'ready'
	| 'reconnecting'
	| 'stopped'
	| 'waiting-login';
type TTaskStatus = 'cancelling' | 'running';

interface IBridgeTask {
	readonly controller: AbortController;
	readonly generation: number;
	readonly requestId: string;
	status: TTaskStatus;
}

interface IBridgeRuntime {
	connectionGeneration: number;
	continuousProtocolErrors: number;
	gateMicrotaskGeneration: number;
	handshakeTimer: ReturnType<typeof setTimeout> | null;
	maxInFlight: number;
	offlineStartedAt: number | null;
	reconnectAttempt: number;
	reconnectBudgetStartedAt: number | null;
	reconnectTimer: ReturnType<typeof setTimeout> | null;
	readyStableTimer: ReturnType<typeof setTimeout> | null;
	socket: WebSocket | null;
	state: TBridgeState;
	stopSubscriptions: Array<() => void>;
	tasks: Map<string, IBridgeTask>;
}

const scheduler = createRoundRobinSuggestMealsScheduler();
const recentRequestIds: string[] = [];
const recentRequestIdSet = new Set<string>();
let runtime: IBridgeRuntime | null = null;
let startCount = 0;
let cleanupGeneration = 0;

function scheduleMicrotask(callback: () => void) {
	void Promise.resolve().then(callback);
}

function checkAccountGate() {
	return (
		accountStore.shared.isBootstrapped.get() &&
		accountStore.shared.bootstrapStatus.get() === 'loggedIn' &&
		accountStore.shared.isLoggedIn.get() &&
		accountStore.shared.user.get() !== null &&
		!accountStore.shared.passwordMustChange.get()
	);
}

function clearTimer(timer: ReturnType<typeof setTimeout> | null) {
	if (timer !== null) {
		globalThis.clearTimeout(timer);
	}
}

function rememberFinishedRequestId(requestId: string) {
	if (recentRequestIdSet.has(requestId)) {
		return;
	}
	recentRequestIds.push(requestId);
	recentRequestIdSet.add(requestId);
	while (recentRequestIds.length > RECENT_REQUEST_ID_LIMIT) {
		const removed = recentRequestIds.shift();
		if (removed !== undefined) {
			recentRequestIdSet.delete(removed);
		}
	}
}

function abortAllTasks(target: IBridgeRuntime) {
	for (const task of target.tasks.values()) {
		task.status = 'cancelling';
		task.controller.abort();
	}
}

function abandonAllTasks(target: IBridgeRuntime) {
	abortAllTasks(target);
	target.tasks.clear();
}

function sendForGeneration(
	target: IBridgeRuntime,
	generation: number,
	message: unknown
) {
	if (
		target.connectionGeneration !== generation ||
		target.socket?.readyState !== WebSocket.OPEN
	) {
		return false;
	}
	target.socket.send(JSON.stringify(message));
	return true;
}

function stopRuntime(
	target: IBridgeRuntime,
	{
		closeCode = 1000,
		discard = true,
		reason = '',
	}: { closeCode?: number; discard?: boolean; reason?: string } = {}
) {
	if (target.state === 'stopped') {
		return;
	}
	target.state = 'stopped';
	target.connectionGeneration++;
	target.gateMicrotaskGeneration++;
	clearTimer(target.handshakeTimer);
	clearTimer(target.reconnectTimer);
	clearTimer(target.readyStableTimer);
	target.handshakeTimer = null;
	target.reconnectTimer = null;
	target.readyStableTimer = null;
	abandonAllTasks(target);
	const { socket } = target;
	target.socket = null;
	if (socket !== null && socket.readyState < WebSocket.CLOSING) {
		socket.close(closeCode, reason);
	}
	if (discard) {
		discardRecommendationBridgeLaunchDescriptor();
	}
}

function closeForLoginEnded(target: IBridgeRuntime) {
	stopRuntime(target, {
		closeCode: RECOMMENDATION_BRIDGE_CLOSE_CODES.loginEnded,
		reason: 'login-ended',
	});
}

function getReconnectDelay(attempt: number) {
	return (
		RECONNECT_DELAYS_MS[
			Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)
		] ?? 10_000
	);
}

function checkCloseCanReconnect(code: number) {
	return code === 0 || [1001, 1006, 1011, 1012, 1013, 4004].includes(code);
}

async function checkLocalNetworkPermissionDenied() {
	// eslint-disable-next-line compat/compat -- Queried conditionally with legacy-name and unsupported-browser fallbacks.
	const permissions = globalThis.navigator.permissions as Permissions & {
		query(descriptor: { name: string }): Promise<PermissionStatus>;
	};
	for (const name of ['loopback-network', 'local-network-access']) {
		try {
			const status = await permissions.query({ name });
			return status.state === 'denied';
		} catch {
			// Older browsers do not recognize either permission name.
		}
	}
	return false;
}

function scheduleReconnect(target: IBridgeRuntime) {
	if (
		target.state === 'stopped' ||
		!checkAccountGate() ||
		readRecommendationBridgeLaunchDescriptor() === null
	) {
		closeForLoginEnded(target);
		return;
	}
	target.state = 'reconnecting';
	abandonAllTasks(target);
	if (!globalThis.navigator.onLine) {
		target.offlineStartedAt ??= Date.now();
		return;
	}
	const now = Date.now();
	target.reconnectBudgetStartedAt ??= now;
	if (now - target.reconnectBudgetStartedAt >= RECONNECT_BUDGET_MS) {
		stopRuntime(target);
		return;
	}
	clearTimer(target.reconnectTimer);
	const remainingBudgetMs =
		RECONNECT_BUDGET_MS - (now - target.reconnectBudgetStartedAt);
	const delay = Math.min(
		getReconnectDelay(target.reconnectAttempt++),
		remainingBudgetMs
	);
	target.reconnectTimer = globalThis.setTimeout(() => {
		target.reconnectTimer = null;
		if (
			target.reconnectBudgetStartedAt !== null &&
			Date.now() - target.reconnectBudgetStartedAt >= RECONNECT_BUDGET_MS
		) {
			stopRuntime(target);
			return;
		}
		// eslint-disable-next-line @typescript-eslint/no-use-before-define -- Reconnect scheduling and connection close handling are mutually recursive.
		void connect(target);
	}, delay);
}

function sendProtocolError(
	target: IBridgeRuntime,
	generation: number,
	code: 'invalid-message' | 'unsupported-message'
) {
	if (
		!sendForGeneration(target, generation, { code, type: 'bridge.error' })
	) {
		return;
	}
	target.continuousProtocolErrors++;
	if (target.continuousProtocolErrors >= MAX_PROTOCOL_ERRORS) {
		stopRuntime(target, {
			closeCode: RECOMMENDATION_BRIDGE_CLOSE_CODES.invalidMessage,
			reason: 'invalid-message',
		});
	}
}

function sendRequestError(
	target: IBridgeRuntime,
	generation: number,
	requestId: string,
	code: Parameters<typeof serializeV1RecommendationError>[1],
	details?: { path?: string; reason?: string }
) {
	sendForGeneration(
		target,
		generation,
		serializeV1RecommendationError(requestId, code, details)
	);
}

function finishTask(target: IBridgeRuntime, task: IBridgeTask) {
	if (target.tasks.get(task.requestId) !== task) {
		return false;
	}
	target.tasks.delete(task.requestId);
	rememberFinishedRequestId(task.requestId);
	return true;
}

function startRecommendationTask(
	target: IBridgeRuntime,
	generation: number,
	message: IV1RecommendationRequestMessage
) {
	if (!checkAccountGate()) {
		closeForLoginEnded(target);
		return;
	}
	if (
		target.tasks.has(message.request_id) ||
		recentRequestIdSet.has(message.request_id)
	) {
		sendRequestError(
			target,
			generation,
			message.request_id,
			'invalid-request',
			{ reason: 'duplicate-request-id' }
		);
		return;
	}
	if (target.tasks.size >= target.maxInFlight) {
		sendRequestError(target, generation, message.request_id, 'busy');
		return;
	}

	const task: IBridgeTask = {
		controller: new AbortController(),
		generation,
		requestId: message.request_id,
		status: 'running',
	};
	target.tasks.set(task.requestId, task);
	const params = adaptV1RecommendationRequest(message);
	const promise = suggestMeals(params, {
		scheduler,
		signal: task.controller.signal,
		taskKey: `game-bridge:${generation}:${task.requestId}`,
	});
	void promise.then(
		(meals) => {
			if (
				task.status === 'cancelling' ||
				task.controller.signal.aborted
			) {
				if (
					finishTask(target, task) &&
					target.connectionGeneration === task.generation &&
					target.state === 'ready'
				) {
					sendForGeneration(target, task.generation, {
						request_id: task.requestId,
						type: 'recommendation.cancelled',
					});
				}
				return;
			}
			if (
				target.connectionGeneration !== task.generation ||
				!finishTask(target, task)
			) {
				return;
			}
			sendForGeneration(
				target,
				task.generation,
				serializeV1RecommendationResult(task.requestId, meals)
			);
		},
		(error: unknown) => {
			const wasCancelling = task.status === 'cancelling';
			if (!finishTask(target, task)) {
				return;
			}
			if (
				target.connectionGeneration !== task.generation ||
				target.state !== 'ready'
			) {
				return;
			}
			if (
				wasCancelling ||
				task.controller.signal.aborted ||
				checkSuggestMealsAbortError(error)
			) {
				sendForGeneration(target, task.generation, {
					request_id: task.requestId,
					type: 'recommendation.cancelled',
				});
				return;
			}
			sendRequestError(
				target,
				task.generation,
				task.requestId,
				'recommendation-failed'
			);
		}
	);
}

function cancelRecommendationTask(
	target: IBridgeRuntime,
	generation: number,
	requestId: string
) {
	const task = target.tasks.get(requestId);
	if (task === undefined) {
		sendRequestError(target, generation, requestId, 'request-not-found', {
			reason: recentRequestIdSet.has(requestId)
				? 'already-finished'
				: 'unknown-request-id',
		});
		return;
	}
	if (task.status === 'running') {
		task.status = 'cancelling';
		task.controller.abort();
	}
}

function readRequestEnvelope(text: string) {
	const value = parseJsonWithUniqueMembers(text);
	if (
		typeof value !== 'object' ||
		value === null ||
		Array.isArray(value) ||
		(value as Record<string, unknown>)['type'] !==
			'recommendation.request' ||
		typeof (value as Record<string, unknown>)['request_id'] !== 'string' ||
		!V1_REQUEST_ID_PATTERN.test(
			(value as Record<string, unknown>)['request_id'] as string
		)
	) {
		return null;
	}
	return (value as Record<string, unknown>)['request_id'] as string;
}

function handleReadyMessage(
	target: IBridgeRuntime,
	generation: number,
	text: string
) {
	const descriptor = readRecommendationBridgeLaunchDescriptor();
	const rawMessage = parseJsonWithUniqueMembers(text);
	if (
		typeof rawMessage === 'object' &&
		rawMessage !== null &&
		!Array.isArray(rawMessage) &&
		(rawMessage as Record<string, unknown>)['type'] === 'bridge.ready' &&
		(rawMessage as Record<string, unknown>)['protocol_version'] !== 1
	) {
		stopRuntime(target, {
			closeCode: RECOMMENDATION_BRIDGE_CLOSE_CODES.unsupportedProtocol,
			reason: 'unsupported-protocol',
		});
		return;
	}
	const parsed = parseRecommendationBridgeMessage(text, 1);
	if (
		!parsed.ok ||
		parsed.value.type !== 'bridge.ready' ||
		parsed.value.instance_id !== descriptor?.instance_id ||
		parsed.value.max_in_flight > CLIENT_MAX_IN_FLIGHT
	) {
		stopRuntime(target, {
			closeCode: RECOMMENDATION_BRIDGE_CLOSE_CODES.invalidMessage,
			reason: 'invalid-message',
		});
		return;
	}
	clearTimer(target.handshakeTimer);
	target.handshakeTimer = null;
	target.state = 'ready';
	target.maxInFlight = parsed.value.max_in_flight;
	target.continuousProtocolErrors = 0;
	recentRequestIds.length = 0;
	recentRequestIdSet.clear();
	clearTimer(target.readyStableTimer);
	target.readyStableTimer = globalThis.setTimeout(() => {
		if (
			target.connectionGeneration === generation &&
			target.state === 'ready'
		) {
			target.reconnectAttempt = 0;
			target.reconnectBudgetStartedAt = null;
		}
	}, READY_STABLE_RESET_MS);
}

function handleReadyStateMessage(
	target: IBridgeRuntime,
	generation: number,
	text: string
) {
	const parsed = parseRecommendationBridgeMessage(text, 1);
	if (!parsed.ok) {
		const requestId = readRequestEnvelope(text);
		if (requestId !== null) {
			target.continuousProtocolErrors = 0;
			if (!checkAccountGate()) {
				closeForLoginEnded(target);
				return;
			}
			if (
				target.tasks.has(requestId) ||
				recentRequestIdSet.has(requestId)
			) {
				sendRequestError(
					target,
					generation,
					requestId,
					'invalid-request',
					{ reason: 'duplicate-request-id' }
				);
				return;
			}
			sendRequestError(
				target,
				generation,
				requestId,
				'invalid-request',
				parsed.error
			);
			return;
		}
		sendProtocolError(
			target,
			generation,
			parsed.error.reason === 'unsupported-message'
				? 'unsupported-message'
				: 'invalid-message'
		);
		return;
	}
	target.continuousProtocolErrors = 0;
	switch (parsed.value.type) {
		case 'bridge.ping':
			sendForGeneration(target, generation, {
				timestamp: parsed.value.timestamp,
				type: 'bridge.pong',
			});
			break;
		case 'bridge.replaced': {
			const descriptor = readRecommendationBridgeLaunchDescriptor();
			if (descriptor?.instance_id !== parsed.value.instance_id) {
				sendProtocolError(target, generation, 'invalid-message');
				return;
			}
			stopRuntime(target, {
				closeCode: RECOMMENDATION_BRIDGE_CLOSE_CODES.replaced,
				reason: 'connection-replaced',
			});
			break;
		}
		case 'recommendation.cancel':
			cancelRecommendationTask(
				target,
				generation,
				parsed.value.request_id
			);
			break;
		case 'recommendation.request':
			startRecommendationTask(target, generation, parsed.value);
			break;
		case 'bridge.ready':
			sendProtocolError(target, generation, 'invalid-message');
			break;
	}
}

function handleSocketMessage(
	target: IBridgeRuntime,
	generation: number,
	event: MessageEvent
) {
	if (
		target.connectionGeneration !== generation ||
		target.state === 'stopped'
	) {
		return;
	}
	if (typeof event.data !== 'string') {
		if (target.state === 'ready') {
			sendProtocolError(target, generation, 'invalid-message');
		} else {
			stopRuntime(target, {
				closeCode: RECOMMENDATION_BRIDGE_CLOSE_CODES.invalidMessage,
				reason: 'invalid-message',
			});
		}
		return;
	}
	if (
		new TextEncoder().encode(event.data).byteLength >
		BRIDGE_MESSAGE_MAX_BYTES
	) {
		stopRuntime(target, {
			closeCode: RECOMMENDATION_BRIDGE_CLOSE_CODES.invalidMessage,
			reason: 'invalid-message',
		});
		return;
	}
	if (target.state === 'connecting') {
		handleReadyMessage(target, generation, event.data);
	} else if (target.state === 'ready') {
		handleReadyStateMessage(target, generation, event.data);
	}
}

async function connect(target: IBridgeRuntime) {
	const descriptor = readRecommendationBridgeLaunchDescriptor();
	if (
		target.state === 'stopped' ||
		descriptor === null ||
		!checkAccountGate()
	) {
		return;
	}
	const generation = ++target.connectionGeneration;
	target.state = 'connecting';
	if (await checkLocalNetworkPermissionDenied()) {
		stopRuntime(target);
		return;
	}
	if (target.connectionGeneration !== generation || !checkAccountGate()) {
		return;
	}
	let socket: WebSocket;
	try {
		socket = new WebSocket(descriptor.endpoint);
	} catch {
		if (target.connectionGeneration === generation) {
			scheduleReconnect(target);
		}
		return;
	}
	socket.binaryType = 'arraybuffer';
	target.socket = socket;
	socket.addEventListener('open', () => {
		if (
			target.connectionGeneration !== generation ||
			target.socket !== socket
		) {
			socket.close(1000);
			return;
		}
		socket.send(
			JSON.stringify({
				client: { name: siteConfig.id, version: siteConfig.version },
				instance_id: descriptor.instance_id,
				max_in_flight: CLIENT_MAX_IN_FLIGHT,
				pairing_token: descriptor.pairing_token,
				protocol_version: 1,
				type: 'bridge.hello',
			})
		);
		target.handshakeTimer = globalThis.setTimeout(() => {
			if (
				target.connectionGeneration !== generation ||
				target.state !== 'connecting'
			) {
				return;
			}
			socket.close(
				RECOMMENDATION_BRIDGE_CLOSE_CODES.handshakeTimeout,
				'handshake-timeout'
			);
		}, HANDSHAKE_TIMEOUT_MS);
	});
	socket.addEventListener('message', (event) => {
		handleSocketMessage(target, generation, event);
	});
	socket.addEventListener('close', (event) => {
		if (
			target.connectionGeneration !== generation ||
			target.socket !== socket
		) {
			return;
		}
		target.socket = null;
		clearTimer(target.handshakeTimer);
		clearTimer(target.readyStableTimer);
		target.handshakeTimer = null;
		target.readyStableTimer = null;
		abandonAllTasks(target);
		if (target.state !== 'stopped' && checkCloseCanReconnect(event.code)) {
			scheduleReconnect(target);
		} else if (target.state !== 'stopped') {
			stopRuntime(target);
		}
	});
}

function scheduleGateCheck(target: IBridgeRuntime) {
	const generation = ++target.gateMicrotaskGeneration;
	scheduleMicrotask(() => {
		if (
			target.gateMicrotaskGeneration !== generation ||
			target.state === 'stopped'
		) {
			return;
		}
		if (accountStore.shared.bootstrapStatus.get() === 'disabled') {
			stopRuntime(target);
			return;
		}
		if (!checkAccountGate()) {
			if (
				['ready', 'connecting', 'reconnecting'].includes(target.state)
			) {
				closeForLoginEnded(target);
			} else {
				target.state = 'waiting-login';
			}
			return;
		}
		if (
			target.state === 'waiting-login' &&
			target.socket === null &&
			target.reconnectTimer === null
		) {
			void connect(target);
		}
	});
}

function createRuntime(): IBridgeRuntime {
	return {
		connectionGeneration: 0,
		continuousProtocolErrors: 0,
		gateMicrotaskGeneration: 0,
		handshakeTimer: null,
		maxInFlight: CLIENT_MAX_IN_FLIGHT,
		offlineStartedAt: null,
		readyStableTimer: null,
		reconnectAttempt: 0,
		reconnectBudgetStartedAt: null,
		reconnectTimer: null,
		socket: null,
		state: 'waiting-login',
		stopSubscriptions: [],
		tasks: new Map(),
	};
}

export function startRecommendationBridgeClient() {
	startCount++;
	cleanupGeneration++;
	if (
		runtime === null &&
		readRecommendationBridgeLaunchDescriptor() !== null
	) {
		const target = createRuntime();
		runtime = target;
		const subscribe = (onChange: (callback: () => void) => () => void) =>
			target.stopSubscriptions.push(
				onChange(() => {
					scheduleGateCheck(target);
				})
			);
		subscribe(accountStore.shared.isBootstrapped.onChange);
		subscribe(accountStore.shared.bootstrapStatus.onChange);
		subscribe(accountStore.shared.isLoggedIn.onChange);
		subscribe(accountStore.shared.user.onChange);
		subscribe(accountStore.shared.passwordMustChange.onChange);
		target.stopSubscriptions.push(
			globalStore.persistence.version.onChange((version) => {
				if (
					version !== null &&
					compareVersions(version, siteConfig.version) > 0
				) {
					const generation = target.connectionGeneration;
					sendForGeneration(target, generation, {
						reason: 'client-update',
						type: 'bridge.closing',
					});
					stopRuntime(target, {
						closeCode:
							RECOMMENDATION_BRIDGE_CLOSE_CODES.clientUpdate,
						reason: 'client-update',
					});
				}
			})
		);
		const handleOnline = () => {
			if (
				target.offlineStartedAt !== null &&
				target.reconnectBudgetStartedAt !== null
			) {
				target.reconnectBudgetStartedAt +=
					Date.now() - target.offlineStartedAt;
			}
			target.offlineStartedAt = null;
			if (
				target.state === 'reconnecting' &&
				target.reconnectTimer === null
			) {
				scheduleReconnect(target);
			}
		};
		const handleOffline = () => {
			target.offlineStartedAt ??= Date.now();
			clearTimer(target.reconnectTimer);
			target.reconnectTimer = null;
		};
		const handlePageHide = () => {
			stopRuntime(target);
		};
		globalThis.addEventListener('online', handleOnline);
		globalThis.addEventListener('offline', handleOffline);
		globalThis.addEventListener('pagehide', handlePageHide);
		target.stopSubscriptions.push(() => {
			globalThis.removeEventListener('online', handleOnline);
			globalThis.removeEventListener('offline', handleOffline);
			globalThis.removeEventListener('pagehide', handlePageHide);
		});
		scheduleGateCheck(target);
	}

	return () => {
		startCount = Math.max(0, startCount - 1);
		const generation = ++cleanupGeneration;
		scheduleMicrotask(() => {
			if (
				generation !== cleanupGeneration ||
				startCount !== 0 ||
				runtime === null
			) {
				return;
			}
			const target = runtime;
			runtime = null;
			for (const stopSubscription of target.stopSubscriptions) {
				stopSubscription();
			}
			stopRuntime(target, { discard: false });
		});
	};
}
