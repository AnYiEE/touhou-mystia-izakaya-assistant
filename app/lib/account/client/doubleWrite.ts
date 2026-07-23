import { postAccountSyncBroadcastMessage } from './broadcast';
import {
	reconcileAccountSyncPausedConflictLocalChange,
	withAccountSyncNamespaceTransitionLock,
} from './conflict';
import {
	checkSnapshotHashMatches,
	markAccountSyncDirty,
	readDirtyQueueEntry,
	removeDirtyQueueEntryIfCurrent,
} from './queue';
import { createAccountClientId } from './random';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetWriteAllowed,
} from './resetGeneration';
import { getAccountSyncSerializer } from './snapshot';
import {
	checkAccountSyncPaused,
	recordPausedAccountSyncDirtyNamespace,
	subscribeAccountSyncResume,
} from './stateGuards';
import { scheduleAccountSyncFlush } from './syncClient';
import { refreshAccountSyncQueueRuntime } from './syncRuntimeState';
import { STORAGE_KEY, addThemeChangeListener } from '@/design/hooks';
import { ACCOUNT_SYNC_STATUS_MAP } from '@/lib/account/shared/constants';
import { SYNC_NAMESPACE_MAP, type TSyncNamespace } from '@/lib/account/sync';
import {
	accountStore,
	customerNormalStore,
	customerRareStore,
	globalStore,
} from '@/stores';

type TUnsubscribe = () => void;

let stopWatchers: TUnsubscribe | null = null;
let watcherGeneration = 0;
const localSnapshotReconcileQueue = new Map<string, Promise<void>>();
const localSnapshotReconcileRetries = new Map<
	string,
	{ attempts: number; timer: null | ReturnType<typeof setTimeout> }
>();
const MAX_LOCAL_SNAPSHOT_RECONCILE_RETRIES = 6;

function getLoggedInContext() {
	const meta = accountStore.shared.sync.meta.get();
	const user = accountStore.shared.user.get();

	if (
		!accountStore.shared.isLoggedIn.get() ||
		meta === null ||
		user === null
	) {
		return null;
	}

	return { meta, user };
}

function scheduleAccountSyncLocalSnapshotReconcileRetry(
	generation: number,
	generationToken: string | null,
	userId: string,
	namespace: TSyncNamespace,
	reason: 'contention' | 'stale'
) {
	const key = `${userId}:${namespace}`;
	const previous = localSnapshotReconcileRetries.get(key);
	if (previous?.timer !== null && previous?.timer !== undefined) {
		return;
	}
	const attempts = (previous?.attempts ?? 0) + 1;
	if (attempts > MAX_LOCAL_SNAPSHOT_RECONCILE_RETRIES) {
		localSnapshotReconcileRetries.delete(key);
		if (getLoggedInContext()?.user.id === userId) {
			accountStore.shared.sync.lastError.set(
				reason === 'contention'
					? 'conflict-reconcile-busy'
					: 'conflict-reconcile-stale'
			);
			refreshAccountSyncQueueRuntime(userId);
		}
		return;
	}
	const delay = Math.min(50 * 2 ** (attempts - 1), 2000);

	const timer = setTimeout(() => {
		localSnapshotReconcileRetries.set(key, { attempts, timer: null });
		if (
			stopWatchers === null ||
			generation !== watcherGeneration ||
			getLoggedInContext()?.user.id !== userId
		) {
			return;
		}
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		enqueueAccountSyncLocalSnapshotReconcile(namespace, generationToken);
	}, delay);
	localSnapshotReconcileRetries.set(key, { attempts, timer });
}

function clearAccountSyncLocalSnapshotReconcileRetry(
	userId: string,
	namespace: TSyncNamespace
) {
	const key = `${userId}:${namespace}`;
	const retry = localSnapshotReconcileRetries.get(key);
	if (retry?.timer !== null && retry?.timer !== undefined) {
		clearTimeout(retry.timer);
	}
	localSnapshotReconcileRetries.delete(key);
}

async function reconcileNamespaceLocalSnapshot(
	generation: number,
	generationToken: string | null,
	userId: string,
	namespace: TSyncNamespace
) {
	const context = getLoggedInContext();
	if (generation !== watcherGeneration || context?.user.id !== userId) {
		return;
	}
	if (
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId,
		})
	) {
		return;
	}

	if (checkAccountSyncPaused()) {
		clearAccountSyncLocalSnapshotReconcileRetry(userId, namespace);
		recordPausedAccountSyncDirtyNamespace(namespace);
		return;
	}

	if (context.user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty) {
		const serializer = getAccountSyncSerializer(namespace);
		const entry = markAccountSyncDirty({
			baseRevision: context.meta.revisions[namespace] ?? 0,
			data: serializer.getLocalSnapshot(),
			generationToken,
			namespace,
			paused: 'cloud-paused',
			replacePausedEntry: true,
			userId,
		});
		if (entry === null) {
			scheduleAccountSyncLocalSnapshotReconcileRetry(
				generation,
				generationToken,
				userId,
				namespace,
				'contention'
			);
			return;
		}
		clearAccountSyncLocalSnapshotReconcileRetry(userId, namespace);
		refreshAccountSyncQueueRuntime(userId);
		return;
	}

	const currentEntry = readDirtyQueueEntry(userId, namespace);

	if (currentEntry?.paused === 'conflict') {
		const result = await reconcileAccountSyncPausedConflictLocalChange({
			generationToken,
			namespace,
			userId,
		});
		if (result === 'busy' || result === 'not-conflict') {
			scheduleAccountSyncLocalSnapshotReconcileRetry(
				generation,
				generationToken,
				userId,
				namespace,
				'contention'
			);
			return;
		}
		if (result === 'stale') {
			scheduleAccountSyncLocalSnapshotReconcileRetry(
				generation,
				generationToken,
				userId,
				namespace,
				'stale'
			);
			return;
		}
		clearAccountSyncLocalSnapshotReconcileRetry(userId, namespace);
		if (result === 'rebased' || result === 'resolved') {
			scheduleAccountSyncFlush();
		}
		return;
	}

	const result = await withAccountSyncNamespaceTransitionLock(
		userId,
		namespace,
		() => {
			const lockedContext = getLoggedInContext();
			if (
				generation !== watcherGeneration ||
				lockedContext?.user.id !== userId
			) {
				return { kind: 'stale' as const };
			}
			if (checkAccountSyncPaused()) {
				clearAccountSyncLocalSnapshotReconcileRetry(userId, namespace);
				recordPausedAccountSyncDirtyNamespace(namespace);
				return { kind: 'unchanged' as const };
			}

			const serializer = getAccountSyncSerializer(namespace);
			const data = serializer.getLocalSnapshot();
			const lockedEntry = readDirtyQueueEntry(userId, namespace);
			if (lockedEntry?.paused === 'conflict') {
				return { kind: 'conflict' as const };
			}

			if (
				checkSnapshotHashMatches(
					data,
					lockedContext.meta.lastAppliedRemoteHash[namespace]
				)
			) {
				if (lockedEntry === null) {
					return { kind: 'unchanged' as const };
				}
				return removeDirtyQueueEntryIfCurrent({
					expectedEntry: lockedEntry,
					generationToken,
					userId,
				})
					? {
							kind: 'removed' as const,
							mutationId: lockedEntry.clientMutationId,
							stateEpoch: lockedContext.meta.state_epoch,
						}
					: { kind: 'stale' as const };
			}

			if (
				namespace === SYNC_NAMESPACE_MAP.tutorialCustomerRare &&
				typeof data === 'object' &&
				data !== null &&
				'completed' in data &&
				data.completed !== true
			) {
				return { kind: 'unchanged' as const };
			}

			const entry = markAccountSyncDirty({
				baseRevision: lockedContext.meta.revisions[namespace] ?? 0,
				data,
				generationToken,
				namespace,
				userId,
			});

			return entry?.paused === null
				? {
						kind: 'dirty' as const,
						mutationId: entry.clientMutationId,
						stateEpoch: lockedContext.meta.state_epoch,
					}
				: { kind: 'stale' as const };
		}
	);

	if (result === null) {
		scheduleAccountSyncLocalSnapshotReconcileRetry(
			generation,
			generationToken,
			userId,
			namespace,
			'contention'
		);
		return;
	}
	if (result.kind === 'conflict') {
		const conflictResult =
			await reconcileAccountSyncPausedConflictLocalChange({
				generationToken,
				namespace,
				userId,
			});
		if (conflictResult === 'busy' || conflictResult === 'not-conflict') {
			scheduleAccountSyncLocalSnapshotReconcileRetry(
				generation,
				generationToken,
				userId,
				namespace,
				'contention'
			);
			return;
		}
		if (conflictResult === 'stale') {
			scheduleAccountSyncLocalSnapshotReconcileRetry(
				generation,
				generationToken,
				userId,
				namespace,
				'stale'
			);
			return;
		}
		clearAccountSyncLocalSnapshotReconcileRetry(userId, namespace);
		if (conflictResult === 'rebased' || conflictResult === 'resolved') {
			scheduleAccountSyncFlush();
		}
		return;
	}
	if (result.kind === 'stale') {
		scheduleAccountSyncLocalSnapshotReconcileRetry(
			generation,
			generationToken,
			userId,
			namespace,
			'stale'
		);
		return;
	}
	if (result.kind === 'unchanged') {
		clearAccountSyncLocalSnapshotReconcileRetry(userId, namespace);
		return;
	}

	clearAccountSyncLocalSnapshotReconcileRetry(userId, namespace);
	refreshAccountSyncQueueRuntime(userId);
	void postAccountSyncBroadcastMessage({
		namespaces: [namespace],
		operationId: createAccountClientId(),
		runtimeMutationId: result.mutationId,
		runtimeReason: 'queue-changed',
		state_epoch: result.stateEpoch,
		tabId: 'local',
		type: 'dirty',
		userId,
	});
	scheduleAccountSyncFlush();
}

export function enqueueAccountSyncLocalSnapshotReconcile(
	namespace: TSyncNamespace,
	providedGenerationToken?: string | null
) {
	const userId = getLoggedInContext()?.user.id;
	if (userId === undefined) {
		return;
	}
	const generationToken =
		providedGenerationToken === undefined
			? captureAccountSyncResetGeneration(userId)
			: providedGenerationToken;

	const key = `${userId}:${namespace}`;
	const generation = watcherGeneration;
	const previous = localSnapshotReconcileQueue.get(key) ?? Promise.resolve();
	const next = previous
		.catch(() => {
			/* The next run re-reads the authoritative local snapshot. */
		})
		.then(() =>
			reconcileNamespaceLocalSnapshot(
				generation,
				generationToken,
				userId,
				namespace
			)
		)
		.catch(() => {
			if (accountStore.shared.user.get()?.id === userId) {
				accountStore.shared.sync.lastError.set(
					'conflict-reconcile-failed'
				);
			}
		});

	localSnapshotReconcileQueue.set(key, next);

	void next.then(() => {
		if (localSnapshotReconcileQueue.get(key) === next) {
			localSnapshotReconcileQueue.delete(key);
		}
	});
}

export function startAccountStoreSyncWatchers() {
	if (stopWatchers !== null) {
		return stopWatchers;
	}

	watcherGeneration += 1;

	const unsubscribers: TUnsubscribe[] = [];
	const watch = (unsubscribe: TUnsubscribe) => {
		unsubscribers.push(unsubscribe);
	};

	watch(
		subscribeAccountSyncResume((namespaces) => {
			namespaces.forEach((namespace) => {
				enqueueAccountSyncLocalSnapshotReconcile(namespace);
			});
		})
	);

	watch(
		customerNormalStore.persistence.meals.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.customerNormalMeals
			);
		})
	);
	watch(
		customerRareStore.persistence.meals.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.customerRareMeals
			);
		})
	);
	watch(
		customerRareStore.persistence.plans.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.customerRarePlans
			);
		})
	);
	watch(
		customerRareStore.persistence.customer.orderLinkedFilter.onChange(
			() => {
				enqueueAccountSyncLocalSnapshotReconcile(
					SYNC_NAMESPACE_MAP.customerRareSettings
				);
			}
		)
	);
	watch(
		customerRareStore.persistence.customer.showTagDescription.onChange(
			() => {
				enqueueAccountSyncLocalSnapshotReconcile(
					SYNC_NAMESPACE_MAP.customerRareSettings
				);
			}
		)
	);

	watch(
		globalStore.persistence.customerCardTagsTooltip.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.donationModal.lastMilestoneShown.onChange(
			() => {
				enqueueAccountSyncLocalSnapshotReconcile(
					SYNC_NAMESPACE_MAP.globalPreferences
				);
			}
		)
	);
	watch(
		globalStore.persistence.donationModal.lastShown.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.hiddenItems.dlcs.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.suggestMeals.enabled.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.suggestMeals.maxExtraIngredients.onChange(
			() => {
				enqueueAccountSyncLocalSnapshotReconcile(
					SYNC_NAMESPACE_MAP.globalPreferences
				);
			}
		)
	);
	watch(
		globalStore.persistence.suggestMeals.maxRating.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.suggestMeals.maxResults.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.table.columns.beverage.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.table.columns.recipe.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.table.hiddenItems.beverages.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.table.hiddenItems.ingredients.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.table.hiddenItems.recipes.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.table.row.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.famousShop.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.popularTrend.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.highAppearance.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.tachie.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.vibrate.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.globalPreferences
			);
		})
	);
	watch(
		globalStore.persistence.dirver.onChange(() => {
			enqueueAccountSyncLocalSnapshotReconcile(
				SYNC_NAMESPACE_MAP.tutorialCustomerRare
			);
		})
	);

	watch(
		addThemeChangeListener(() => {
			enqueueAccountSyncLocalSnapshotReconcile(SYNC_NAMESPACE_MAP.theme);
		})
	);

	const handleThemeStorageChange = (event: StorageEvent) => {
		if (event.key !== STORAGE_KEY || event.oldValue === event.newValue) {
			return;
		}

		enqueueAccountSyncLocalSnapshotReconcile(SYNC_NAMESPACE_MAP.theme);
	};

	globalThis.addEventListener('storage', handleThemeStorageChange);

	watch(() => {
		globalThis.removeEventListener('storage', handleThemeStorageChange);
	});

	const cleanup = () => {
		if (stopWatchers !== cleanup) {
			return;
		}

		const currentUnsubscribers = [...unsubscribers];
		unsubscribers.length = 0;
		watcherGeneration += 1;
		localSnapshotReconcileQueue.clear();
		localSnapshotReconcileRetries.forEach(({ timer }) => {
			if (timer !== null) {
				clearTimeout(timer);
			}
		});
		localSnapshotReconcileRetries.clear();
		stopWatchers = null;
		currentUnsubscribers.forEach((unsubscribe) => {
			unsubscribe();
		});
	};

	stopWatchers = cleanup;

	return stopWatchers;
}
