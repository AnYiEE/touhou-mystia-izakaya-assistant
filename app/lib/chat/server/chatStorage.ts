// Ephemeral transport for realtime chat events.
//
// v1 ships a single-process in-memory implementation. The interface is the
// seam that lets a future shared broker (e.g. Redis pub/sub for multi-instance
// deployments) replace the backing store without touching the domain services
// that call `realtimeService`.

export interface IChatStorageSubscriber<TEvent> {
	listenerId: string;
	notify: (event: TEvent) => void;
	userId: string;
}

export interface IChatStorage<TEvent> {
	publishGlobal: (event: TEvent) => void;
	publishToUser: (userId: string, event: TEvent) => void;
	subscribe: (subscriber: IChatStorageSubscriber<TEvent>) => () => void;
}

export function createInMemoryChatStorage<TEvent>(): IChatStorage<TEvent> {
	const globalListeners = new Map<string, (event: TEvent) => void>();
	const userScopedListeners = new Map<
		string,
		Map<string, (event: TEvent) => void>
	>();

	function publishToListeners(
		listeners: Iterable<(event: TEvent) => void>,
		event: TEvent
	) {
		for (const listener of listeners) {
			listener(event);
		}
	}

	return {
		publishGlobal(event) {
			publishToListeners(globalListeners.values(), event);
		},
		publishToUser(userId, event) {
			const listeners = userScopedListeners.get(userId);
			if (listeners === undefined) {
				return;
			}

			publishToListeners(listeners.values(), event);
		},
		subscribe({ listenerId, notify, userId }) {
			globalListeners.set(listenerId, notify);
			const listeners =
				userScopedListeners.get(userId) ??
				new Map<string, (event: TEvent) => void>();
			listeners.set(listenerId, notify);
			userScopedListeners.set(userId, listeners);

			return () => {
				globalListeners.delete(listenerId);
				const currentListeners = userScopedListeners.get(userId);
				if (currentListeners === undefined) {
					return;
				}

				currentListeners.delete(listenerId);
				if (currentListeners.size === 0) {
					userScopedListeners.delete(userId);
				}
			};
		},
	};
}
