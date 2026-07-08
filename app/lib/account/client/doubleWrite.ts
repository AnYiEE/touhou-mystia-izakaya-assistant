import { postAccountSyncBroadcastMessage } from './broadcast';
import {
	checkSnapshotHashMatches,
	markAccountSyncDirty,
	removeDirtyQueueEntry,
} from './queue';
import { createAccountClientId } from './random';
import { getAccountSyncSerializer } from './snapshot';
import {
	checkAccountSyncPaused,
	recordPausedAccountSyncDirtyNamespace,
	subscribeAccountSyncResume,
} from './stateGuards';
import { scheduleAccountSyncFlush } from './syncClient';
import { STORAGE_KEY, addThemeChangeListener } from '@/design/hooks';
import { SYNC_NAMESPACE_MAP, type TSyncNamespace } from '@/lib/account/sync';
import { accountStore } from '@/stores/account';
import { customerNormalStore } from '@/stores/customer-normal';
import { customerRareStore } from '@/stores/customer-rare';
import { globalStore } from '@/stores/global';

type TUnsubscribe = () => void;

let stopWatchers: TUnsubscribe | null = null;

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

function markNamespaceDirty(namespace: TSyncNamespace) {
	const context = getLoggedInContext();
	if (context === null) {
		return;
	}
	if (checkAccountSyncPaused()) {
		recordPausedAccountSyncDirtyNamespace(namespace);
		return;
	}

	const serializer = getAccountSyncSerializer(namespace);
	const data = serializer.getLocalSnapshot();
	if (
		checkSnapshotHashMatches(
			data,
			context.meta.lastAppliedRemoteHash[namespace]
		)
	) {
		removeDirtyQueueEntry(context.user.id, namespace);
		return;
	}
	if (
		namespace === SYNC_NAMESPACE_MAP.tutorialCustomerRare &&
		typeof data === 'object' &&
		data !== null &&
		'completed' in data &&
		data.completed !== true
	) {
		return;
	}

	const entry = markAccountSyncDirty({
		baseRevision: context.meta.revisions[namespace] ?? 0,
		data,
		namespace,
		userId: context.user.id,
	});

	if (entry === null) {
		return;
	}

	void postAccountSyncBroadcastMessage({
		namespaces: [namespace],
		operationId: createAccountClientId(),
		state_epoch: context.meta.state_epoch,
		tabId: 'local',
		type: 'dirty',
		userId: context.user.id,
	});
	scheduleAccountSyncFlush();
}

export function startAccountStoreSyncWatchers() {
	if (stopWatchers !== null) {
		return stopWatchers;
	}

	const unsubscribers: TUnsubscribe[] = [];
	const watch = (unsubscribe: TUnsubscribe) => {
		unsubscribers.push(unsubscribe);
	};

	watch(
		subscribeAccountSyncResume((namespaces) => {
			namespaces.forEach(markNamespaceDirty);
		})
	);

	watch(
		customerNormalStore.persistence.meals.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.customerNormalMeals);
		})
	);
	watch(
		customerRareStore.persistence.meals.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.customerRareMeals);
		})
	);
	watch(
		customerRareStore.persistence.plans.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.customerRarePlans);
		})
	);
	watch(
		customerRareStore.persistence.customer.orderLinkedFilter.onChange(
			() => {
				markNamespaceDirty(SYNC_NAMESPACE_MAP.customerRareSettings);
			}
		)
	);
	watch(
		customerRareStore.persistence.customer.showTagDescription.onChange(
			() => {
				markNamespaceDirty(SYNC_NAMESPACE_MAP.customerRareSettings);
			}
		)
	);

	watch(
		globalStore.persistence.customerCardTagsTooltip.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.donationModal.lastMilestoneShown.onChange(
			() => {
				markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
			}
		)
	);
	watch(
		globalStore.persistence.donationModal.lastShown.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.hiddenItems.dlcs.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.suggestMeals.enabled.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.suggestMeals.maxExtraIngredients.onChange(
			() => {
				markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
			}
		)
	);
	watch(
		globalStore.persistence.suggestMeals.maxRating.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.suggestMeals.maxResults.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.table.columns.beverage.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.table.columns.recipe.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.table.hiddenItems.beverages.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.table.hiddenItems.ingredients.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.table.hiddenItems.recipes.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.table.row.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.famousShop.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.popularTrend.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.highAppearance.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.tachie.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.vibrate.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
		})
	);
	watch(
		globalStore.persistence.dirver.onChange(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.tutorialCustomerRare);
		})
	);

	watch(
		addThemeChangeListener(() => {
			markNamespaceDirty(SYNC_NAMESPACE_MAP.theme);
		})
	);

	const handleThemeStorageChange = (event: StorageEvent) => {
		if (event.key !== STORAGE_KEY || event.oldValue === event.newValue) {
			return;
		}

		markNamespaceDirty(SYNC_NAMESPACE_MAP.theme);
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
		stopWatchers = null;
		currentUnsubscribers.forEach((unsubscribe) => {
			unsubscribe();
		});
	};

	stopWatchers = cleanup;

	return stopWatchers;
}
