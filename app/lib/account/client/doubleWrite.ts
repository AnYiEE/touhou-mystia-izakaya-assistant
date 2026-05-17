import { addThemeChangeListener } from '@/design/hooks';
import { SYNC_NAMESPACE_MAP, type TSyncNamespace } from '@/lib/account/sync';
import { accountStore } from '@/stores/account';
import { customerNormalStore } from '@/stores/customer-normal';
import { customerRareStore } from '@/stores/customer-rare';
import { globalStore } from '@/stores/global';
import { postAccountSyncBroadcastMessage } from './broadcast';
import { createSnapshotHash, markAccountSyncDirty } from './queue';
import { getAccountSyncSerializer } from './snapshot';
import { scheduleAccountSyncFlush } from './syncClient';

let hasStarted = false;

function createClientOperationId() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

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

	const serializer = getAccountSyncSerializer(namespace);
	const data = serializer.getLocalSnapshot();
	if (
		context.meta.lastAppliedRemoteHash[namespace] ===
		createSnapshotHash(data)
	) {
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
		operationId: createClientOperationId(),
		state_epoch: context.meta.state_epoch,
		tabId: 'local',
		type: 'dirty',
		userId: context.user.id,
	});
	scheduleAccountSyncFlush();
}

export function startAccountStoreSyncWatchers() {
	if (hasStarted) {
		return;
	}
	hasStarted = true;

	customerNormalStore.persistence.meals.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.customerNormalMeals);
	});
	customerRareStore.persistence.meals.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.customerRareMeals);
	});
	customerRareStore.persistence.customer.orderLinkedFilter.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.customerRareSettings);
	});
	customerRareStore.persistence.customer.showTagDescription.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.customerRareSettings);
	});

	globalStore.persistence.customerCardTagsTooltip.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.hiddenItems.dlcs.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.suggestMeals.enabled.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.suggestMeals.maxExtraIngredients.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.suggestMeals.maxRating.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.suggestMeals.maxResults.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.table.columns.beverage.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.table.columns.recipe.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.table.hiddenItems.beverages.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.table.hiddenItems.ingredients.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.table.hiddenItems.recipes.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.table.row.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.famousShop.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.popularTrend.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.highAppearance.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.tachie.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.vibrate.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.globalPreferences);
	});
	globalStore.persistence.dirver.onChange(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.tutorialCustomerRare);
	});

	addThemeChangeListener(() => {
		markNamespaceDirty(SYNC_NAMESPACE_MAP.theme);
	});
}
