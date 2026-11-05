'use client';

import {
	createContext,
	memo,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from 'react';

import { loadMapAsset } from './loadMapAsset';
import {
	MapAssetLoadError,
	checkAbortError,
	checkMapAssetAccessFailure,
} from './mapAssetErrors';

export type TMapAssetStatus =
	'error' | 'idle' | 'loading' | 'queued' | 'success';
export type TMapAssetPriority = 'critical' | 'high' | 'low' | 'normal';

export interface IMapAssetSnapshot {
	error: MapAssetLoadError | null;
	objectUrl: string | null;
	status: TMapAssetStatus;
}

export interface IUseMapAssetOptions {
	priority?: TMapAssetPriority | undefined;
}

interface IMapAssetEntry {
	controller: AbortController | null;
	keepForPreload: boolean;
	listeners: Map<() => void, number>;
	releaseTimer: ReturnType<typeof setTimeout> | null;
	snapshot: IMapAssetSnapshot;
}

type TMapAssetListener = () => void;

interface IMapAssetManagerProps {
	onAccessFailure: (error: MapAssetLoadError) => void;
}

const MAX_CONCURRENT_REQUESTS = 6;
const PRIORITY_VALUES = {
	critical: 3,
	high: 2,
	low: 0,
	normal: 1,
} as const satisfies Record<TMapAssetPriority, number>;
const QUEUE_PRIORITIES = [
	'critical',
	'high',
	'normal',
	'low',
] as const satisfies ReadonlyArray<TMapAssetPriority>;
const QUEUE_PRIORITY_BY_VALUE = {
	0: 'low',
	1: 'normal',
	2: 'high',
	3: 'critical',
} as const;
const MAP_ASSET_CACHE_NAME = 'maps/assets';
const CACHE_PROBE_MEMO_LIMIT = 4096;
const cachedMapAssetUrls = new Set<string>();
/** Keeps preloaded resources alive long enough for the replacing UI to subscribe. */
const PRELOAD_RELEASE_DELAY_MS = 1000;
const IDLE_SNAPSHOT: IMapAssetSnapshot = {
	error: null,
	objectUrl: null,
	status: 'idle',
};

export async function checkMapAssetsCached(
	urls: ReadonlyArray<string>,
	signal?: AbortSignal
) {
	if (urls.length === 0) {
		return true;
	}
	const checkAborted = () => signal?.aborted === true;
	if (!('caches' in globalThis) || checkAborted()) {
		return false;
	}

	try {
		const normalizedUrls = urls.map(
			(url) => new URL(url, globalThis.location.href).href
		);
		if (normalizedUrls.every((url) => cachedMapAssetUrls.has(url))) {
			return true;
		}
		const cache = await globalThis.caches.open(MAP_ASSET_CACHE_NAME);
		const uncachedUrls = normalizedUrls.filter(
			(url) => !cachedMapAssetUrls.has(url)
		);
		const matches = await Promise.all(
			uncachedUrls.map((url) => cache.match(url))
		);
		for (const [index, response] of matches.entries()) {
			if (response === undefined) {
				continue;
			}
			const url = uncachedUrls[index];
			if (url !== undefined) {
				cachedMapAssetUrls.add(url);
			}
		}
		while (cachedMapAssetUrls.size > CACHE_PROBE_MEMO_LIMIT) {
			const firstUrl = cachedMapAssetUrls.values().next().value;
			if (firstUrl === undefined) {
				break;
			}
			cachedMapAssetUrls.delete(firstUrl);
		}
		return (
			!checkAborted() &&
			normalizedUrls.every((url) => cachedMapAssetUrls.has(url))
		);
	} catch {
		return false;
	}
}

class MapAssetManager {
	private readonly activeUrls = new Set<string>();
	private readonly entries = new Map<string, IMapAssetEntry>();
	private readonly onAccessFailure: (error: MapAssetLoadError) => void;
	private readonly queuedPriorities = new Map<string, TMapAssetPriority>();
	private readonly queuedUrlIndexes: Record<TMapAssetPriority, number> = {
		critical: 0,
		high: 0,
		low: 0,
		normal: 0,
	};
	private readonly queuedUrls: Record<TMapAssetPriority, string[]> = {
		critical: [],
		high: [],
		low: [],
		normal: [],
	};
	private readonly queuedUrlSet = new Set<string>();
	private deactivateTimer: ReturnType<typeof setTimeout> | null = null;
	private isPumpScheduled = false;
	private isDestroyed = false;

	constructor({ onAccessFailure }: IMapAssetManagerProps) {
		this.onAccessFailure = onAccessFailure;
	}

	activate() {
		if (this.deactivateTimer !== null) {
			clearTimeout(this.deactivateTimer);
			this.deactivateTimer = null;
		}
	}

	deactivate() {
		if (this.deactivateTimer !== null || this.isDestroyed) {
			return;
		}
		this.deactivateTimer = setTimeout(() => {
			this.deactivateTimer = null;
			this.destroy();
		}, 0);
	}

	getSnapshot = (url: string | null): IMapAssetSnapshot => {
		if (url === null) {
			return IDLE_SNAPSHOT;
		}
		const entry = this.entries.get(url);
		return entry === undefined ? IDLE_SNAPSHOT : entry.snapshot;
	};

	subscribe(
		url: string,
		listener: TMapAssetListener,
		priority: TMapAssetPriority = 'normal'
	) {
		if (this.isDestroyed) {
			return () => {};
		}

		let entry = this.entries.get(url);
		if (entry === undefined) {
			entry = {
				controller: null,
				keepForPreload: false,
				listeners: new Map(),
				releaseTimer: null,
				snapshot: { error: null, objectUrl: null, status: 'queued' },
			};
			this.entries.set(url, entry);
		}
		if (entry.releaseTimer !== null) {
			clearTimeout(entry.releaseTimer);
			entry.releaseTimer = null;
		}
		entry.keepForPreload = false;
		const currentPriority = entry.listeners.get(listener);
		entry.listeners.set(
			listener,
			currentPriority === undefined
				? PRIORITY_VALUES[priority]
				: Math.max(currentPriority, PRIORITY_VALUES[priority])
		);
		this.refreshQueuedPriority(url);
		this.queueRequest(url);

		return () => {
			this.release(url, listener);
		};
	}

	retry(url: string) {
		const entry = this.entries.get(url);
		if (entry?.snapshot.status !== 'error') {
			return;
		}
		this.updateSnapshot(entry, {
			error: null,
			objectUrl: null,
			status: 'queued',
		});
		this.queueRequest(url);
	}

	async preload(
		url: string,
		signal?: AbortSignal,
		priority: TMapAssetPriority = 'normal'
	) {
		return await new Promise<boolean>((resolvePromise) => {
			let hasSettled = false;
			let removeAbortListener = () => {};
			let release = () => {};
			const handleAbort = () => {
				if (hasSettled) {
					return;
				}
				hasSettled = true;
				release();
				resolvePromise(false);
			};
			const finish = (isSuccessful: boolean) => {
				if (hasSettled) {
					return;
				}
				hasSettled = true;
				removeAbortListener();
				const entry = this.entries.get(url);
				if (entry !== undefined) {
					entry.keepForPreload = true;
				}
				release();
				resolvePromise(isSuccessful);
			};
			const settle = () => {
				if (hasSettled) {
					return;
				}
				const snapshot = this.getSnapshot(url);
				if (
					snapshot.status !== 'error' &&
					snapshot.status !== 'success'
				) {
					return;
				}
				finish(snapshot.status === 'success');
			};

			if (signal?.aborted === true) {
				resolvePromise(false);
				return;
			}
			if (signal !== undefined) {
				signal.addEventListener('abort', handleAbort, { once: true });
				removeAbortListener = () => {
					signal.removeEventListener('abort', handleAbort);
				};
			}
			release = this.subscribe(url, settle, priority);
			settle();
		});
	}

	destroy() {
		if (this.isDestroyed) {
			return;
		}
		this.isDestroyed = true;
		if (this.deactivateTimer !== null) {
			clearTimeout(this.deactivateTimer);
			this.deactivateTimer = null;
		}
		for (const priority of QUEUE_PRIORITIES) {
			this.queuedUrls[priority].length = 0;
			this.queuedUrlIndexes[priority] = 0;
		}
		this.queuedUrlSet.clear();
		this.queuedPriorities.clear();
		for (const entry of this.entries.values()) {
			entry.controller?.abort();
			if (entry.releaseTimer !== null) {
				clearTimeout(entry.releaseTimer);
			}
			if (entry.snapshot.objectUrl !== null) {
				URL.revokeObjectURL(entry.snapshot.objectUrl);
			}
			entry.listeners.clear();
		}
		this.entries.clear();
		this.activeUrls.clear();
	}

	private getEntryPriority(url: string): TMapAssetPriority | null {
		const entry = this.entries.get(url);
		if (entry === undefined || entry.listeners.size === 0) {
			return null;
		}
		let priority = Number.NEGATIVE_INFINITY;
		let result: TMapAssetPriority = 'low';
		for (const listenerPriority of entry.listeners.values()) {
			if (listenerPriority <= priority) {
				continue;
			}
			priority = listenerPriority;
			result =
				QUEUE_PRIORITY_BY_VALUE[
					priority as keyof typeof QUEUE_PRIORITY_BY_VALUE
				];
		}
		return result;
	}

	private refreshQueuedPriority(url: string) {
		if (!this.queuedUrlSet.has(url)) {
			return;
		}
		const nextPriority = this.getEntryPriority(url);
		if (nextPriority === null) {
			this.queuedUrlSet.delete(url);
			this.queuedPriorities.delete(url);
			return;
		}
		if (this.queuedPriorities.get(url) === nextPriority) {
			return;
		}
		this.queuedPriorities.set(url, nextPriority);
		this.queuedUrls[nextPriority].push(url);
	}

	private queueRequest(url: string) {
		const entry = this.entries.get(url);
		if (entry === undefined) {
			return;
		}
		if (
			entry.controller !== null ||
			entry.snapshot.status === 'error' ||
			entry.snapshot.status === 'loading' ||
			entry.snapshot.status === 'success' ||
			this.queuedUrlSet.has(url)
		) {
			return;
		}

		const priority = this.getEntryPriority(url);
		if (priority === null) {
			return;
		}
		this.updateSnapshot(entry, {
			error: null,
			objectUrl: null,
			status: 'queued',
		});
		this.queuedUrls[priority].push(url);
		this.queuedUrlSet.add(url);
		this.queuedPriorities.set(url, priority);
		this.schedulePump();
	}

	private schedulePump() {
		if (this.isDestroyed || this.isPumpScheduled) {
			return;
		}
		this.isPumpScheduled = true;
		void Promise.resolve().then(() => {
			this.isPumpScheduled = false;
			this.pump();
		});
	}

	private pump() {
		while (
			!this.isDestroyed &&
			this.activeUrls.size < MAX_CONCURRENT_REQUESTS &&
			this.queuedUrlSet.size > 0
		) {
			let selectedUrl: string | undefined;
			for (const priority of QUEUE_PRIORITIES) {
				const urls = this.queuedUrls[priority];
				let index = this.queuedUrlIndexes[priority];
				while (index < urls.length) {
					const candidate = urls[index];
					index++;
					if (candidate === undefined) {
						continue;
					}
					if (
						!this.queuedUrlSet.has(candidate) ||
						this.queuedPriorities.get(candidate) !== priority
					) {
						continue;
					}
					selectedUrl = candidate;
					break;
				}
				this.queuedUrlIndexes[priority] = index;
				if (index >= urls.length) {
					urls.length = 0;
					this.queuedUrlIndexes[priority] = 0;
				}
				if (selectedUrl !== undefined) {
					break;
				}
			}
			if (selectedUrl === undefined) {
				return;
			}
			const url = selectedUrl;
			this.queuedUrlSet.delete(url);
			this.queuedPriorities.delete(url);
			const entry = this.entries.get(url);
			if (entry === undefined || entry.listeners.size === 0) {
				continue;
			}

			const controller = new AbortController();
			entry.controller = controller;
			this.activeUrls.add(url);
			this.updateSnapshot(entry, {
				error: null,
				objectUrl: null,
				status: 'loading',
			});

			void loadMapAsset(url, controller.signal)
				.then(
					(objectUrl) => {
						if (
							this.entries.get(url) !== entry ||
							entry.controller !== controller
						) {
							URL.revokeObjectURL(objectUrl);
							return;
						}
						this.updateSnapshot(entry, {
							error: null,
							objectUrl,
							status: 'success',
						});
					},
					(error: unknown) => {
						if (
							this.entries.get(url) !== entry ||
							entry.controller !== controller ||
							checkAbortError(error)
						) {
							return;
						}
						const loadError =
							error instanceof MapAssetLoadError
								? error
								: new MapAssetLoadError(
										'map-asset-unknown-error',
										{
											cause: error,
											kind: 'network',
											retryable: true,
										}
									);
						this.updateSnapshot(entry, {
							error: loadError,
							objectUrl: null,
							status: 'error',
						});
						this.reportAccessFailure(loadError);
					}
				)
				.finally(() => {
					this.activeUrls.delete(url);
					if (entry.controller === controller) {
						entry.controller = null;
					}
					this.schedulePump();
				});
		}
	}

	private release(url: string, listener: TMapAssetListener) {
		const entry = this.entries.get(url);
		if (entry === undefined) {
			return;
		}
		entry.listeners.delete(listener);
		if (entry.listeners.size > 0) {
			this.refreshQueuedPriority(url);
			return;
		}
		this.queuedUrlSet.delete(url);
		this.queuedPriorities.delete(url);
		if (entry.releaseTimer !== null) {
			return;
		}

		const releaseDelay = entry.keepForPreload
			? PRELOAD_RELEASE_DELAY_MS
			: 0;
		entry.keepForPreload = false;
		entry.releaseTimer = setTimeout(() => {
			entry.releaseTimer = null;
			if (entry.listeners.size > 0) {
				return;
			}
			entry.controller?.abort();
			if (entry.snapshot.objectUrl !== null) {
				URL.revokeObjectURL(entry.snapshot.objectUrl);
			}
			this.entries.delete(url);
			this.queuedUrlSet.delete(url);
			this.queuedPriorities.delete(url);
		}, releaseDelay);
	}

	private updateSnapshot(entry: IMapAssetEntry, snapshot: IMapAssetSnapshot) {
		entry.snapshot = snapshot;
		for (const listener of entry.listeners.keys()) {
			listener();
		}
	}

	private reportAccessFailure(error: MapAssetLoadError) {
		if (!checkMapAssetAccessFailure(error)) {
			return;
		}
		this.onAccessFailure(error);
	}
}

const MapAssetContext = createContext<MapAssetManager | null>(null);

interface IMapAssetProviderProps {
	children: ReactNodeWithoutBoolean;
	onAccessFailure: (error: MapAssetLoadError) => void;
}

export const MapAssetProvider = memo<IMapAssetProviderProps>(
	function MapAssetProvider({ children, onAccessFailure }) {
		const manager = useMemo(
			() => new MapAssetManager({ onAccessFailure }),
			[onAccessFailure]
		);

		useEffect(() => {
			manager.activate();
			return () => {
				manager.deactivate();
			};
		}, [manager]);

		return <MapAssetContext value={manager}>{children}</MapAssetContext>;
	}
);

function useMapAssetManager() {
	const manager = useContext(MapAssetContext);
	if (manager === null) {
		throw new Error(
			'useMapAssetManager must be used within MapAssetProvider'
		);
	}
	return manager;
}

export function useMapAsset(
	url: string | null,
	{ priority = 'normal' }: IUseMapAssetOptions = {}
) {
	const manager = useMapAssetManager();
	const subscribe = useCallback(
		(listener: TMapAssetListener) =>
			url === null
				? () => {}
				: manager.subscribe(url, listener, priority),
		[manager, priority, url]
	);
	const getSnapshot = useCallback(
		() => manager.getSnapshot(url),
		[manager, url]
	);
	const getServerSnapshot = useCallback(
		() => manager.getSnapshot(null),
		[manager]
	);
	const snapshot = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot
	);
	const retry = useCallback(() => {
		if (url !== null) {
			manager.retry(url);
		}
	}, [manager, url]);

	return useMemo(() => ({ ...snapshot, retry }), [retry, snapshot]);
}

export function useMapAssetPreloader() {
	const manager = useMapAssetManager();
	const preloaderRef = useRef(manager);
	preloaderRef.current = manager;

	return useCallback(
		(
			urls: ReadonlyArray<string>,
			signal?: AbortSignal,
			priority: TMapAssetPriority = 'normal'
		) =>
			Promise.all(
				urls.map((url) =>
					preloaderRef.current.preload(url, signal, priority)
				)
			),
		[]
	);
}
