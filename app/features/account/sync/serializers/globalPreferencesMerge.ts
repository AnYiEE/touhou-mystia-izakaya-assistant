import isObject from 'lodash/isObject.js';

import { type TSyncNamespace } from '@/domain/account/contracts';

import type {
	IGlobalPreferencesSetValueOrders,
	TGlobalPreferencesSnapshot,
} from './globalPreferencesContracts';
import { checkSnapshotEqual, createMergeResult, mergeFieldMap } from './utils';

const GLOBAL_PREFERENCE_ATOMIC_GROUP_PATHS = [
	['guestCardTagsTooltip'],
	['famousShop'],
	['highAppearance'],
	['popularTrend'],
	['suggestMeals', 'enabled'],
	['suggestMeals', 'maxExtraIngredients'],
	['suggestMeals', 'maxRating'],
	['suggestMeals', 'maxResults'],
	['table', 'row'],
	['tachie'],
	['vibrate'],
] as const;

function readPreferenceGroup(
	snapshot: TGlobalPreferencesSnapshot,
	path: ReadonlyArray<string>
) {
	return path.reduce<unknown>(
		(value, key) =>
			isObject(value)
				? (value as Record<string, unknown>)[key]
				: undefined,
		snapshot
	);
}

function writePreferenceGroup(
	snapshot: TGlobalPreferencesSnapshot,
	path: ReadonlyArray<string>,
	value: unknown
) {
	let target = snapshot as unknown as Record<string, unknown>;
	for (const key of path.slice(0, -1)) {
		target = target[key] as Record<string, unknown>;
	}
	const key = path.at(-1);
	if (key !== undefined) {
		target[key] = isObject(value) ? structuredClone(value) : value;
	}
}

function mergeDonationMilestone(
	base: TGlobalPreferencesSnapshot['donationModal'],
	cloud: TGlobalPreferencesSnapshot['donationModal'],
	local: TGlobalPreferencesSnapshot['donationModal']
) {
	if (cloud.lastMilestoneShown === local.lastMilestoneShown) {
		return cloud.lastMilestoneShown;
	}

	const baseLastShown = base.lastShown ?? -1;
	const cloudLastShown = cloud.lastShown ?? -1;
	const localLastShown = local.lastShown ?? -1;
	// “稍后提醒”会同时写入较新的 lastShown 并把里程碑重置为 0；
	// 普通关闭不会更新时间，仍按较大的里程碑合并。
	if (
		cloud.lastMilestoneShown === 0 &&
		cloudLastShown > baseLastShown &&
		cloudLastShown > localLastShown
	) {
		return 0;
	}
	if (
		local.lastMilestoneShown === 0 &&
		localLastShown > baseLastShown &&
		localLastShown > cloudLastShown
	) {
		return 0;
	}
	if (
		base.lastMilestoneShown === 0 &&
		baseLastShown > cloudLastShown &&
		baseLastShown > localLastShown
	) {
		return 0;
	}

	if (cloud.lastMilestoneShown === base.lastMilestoneShown) {
		return local.lastMilestoneShown;
	}
	if (local.lastMilestoneShown === base.lastMilestoneShown) {
		return cloud.lastMilestoneShown;
	}

	return Math.max(
		base.lastMilestoneShown,
		cloud.lastMilestoneShown,
		local.lastMilestoneShown
	);
}

function mergeDonationModal(
	base: TGlobalPreferencesSnapshot['donationModal'],
	cloud: TGlobalPreferencesSnapshot['donationModal'],
	local: TGlobalPreferencesSnapshot['donationModal']
) {
	const lastShownValues = [base.lastShown, cloud.lastShown, local.lastShown];
	const lastShown = lastShownValues.every((value) => value === null)
		? null
		: Math.max(...lastShownValues.map((value) => value ?? -1));

	return {
		interactionCount: Math.max(
			base.interactionCount,
			cloud.interactionCount,
			local.interactionCount
		),
		lastMilestoneShown: mergeDonationMilestone(base, cloud, local),
		lastShown,
	};
}

function mergeSet<T extends number | string>({
	base,
	cloud,
	local,
	valueOrder,
}: {
	base: ReadonlyArray<T>;
	cloud: ReadonlyArray<T>;
	local: ReadonlyArray<T>;
	valueOrder: ReadonlyArray<T>;
}) {
	const baseSet = new Set(base);
	const cloudSet = new Set(cloud);
	const localSet = new Set(local);

	return [...new Set(valueOrder)].filter((value) => {
		const baseHas = baseSet.has(value);
		const cloudHas = cloudSet.has(value);
		const localHas = localSet.has(value);

		if (cloudHas === localHas) {
			return cloudHas;
		}
		return cloudHas === baseHas ? localHas : cloudHas;
	});
}

function mergeReliableBaseSnapshots({
	base,
	cloud,
	local,
	setValueOrders,
}: {
	base: TGlobalPreferencesSnapshot;
	cloud: TGlobalPreferencesSnapshot;
	local: TGlobalPreferencesSnapshot;
	setValueOrders: IGlobalPreferencesSetValueOrders;
}) {
	const data = structuredClone(cloud);
	let requiresConfirmation = false;

	data.donationModal = mergeDonationModal(
		base.donationModal,
		cloud.donationModal,
		local.donationModal
	);
	data.hiddenItems.dlcs = mergeSet({
		base: base.hiddenItems.dlcs,
		cloud: cloud.hiddenItems.dlcs,
		local: local.hiddenItems.dlcs,
		valueOrder: setValueOrders.hiddenDlcs,
	});
	data.table.columns.beverage = mergeSet({
		base: base.table.columns.beverage,
		cloud: cloud.table.columns.beverage,
		local: local.table.columns.beverage,
		valueOrder: setValueOrders.beverageColumns,
	}) as TGlobalPreferencesSnapshot['table']['columns']['beverage'];
	data.table.columns.recipe = mergeSet({
		base: base.table.columns.recipe,
		cloud: cloud.table.columns.recipe,
		local: local.table.columns.recipe,
		valueOrder: setValueOrders.foodColumns,
	}) as TGlobalPreferencesSnapshot['table']['columns']['recipe'];
	data.table.hiddenItems.beverages = mergeSet({
		base: base.table.hiddenItems.beverages,
		cloud: cloud.table.hiddenItems.beverages,
		local: local.table.hiddenItems.beverages,
		valueOrder: setValueOrders.hiddenBeverages,
	});
	data.table.hiddenItems.foods = mergeSet({
		base: base.table.hiddenItems.foods,
		cloud: cloud.table.hiddenItems.foods,
		local: local.table.hiddenItems.foods,
		valueOrder: setValueOrders.hiddenFoods,
	});
	data.table.hiddenItems.ingredients = mergeSet({
		base: base.table.hiddenItems.ingredients,
		cloud: cloud.table.hiddenItems.ingredients,
		local: local.table.hiddenItems.ingredients,
		valueOrder: setValueOrders.hiddenIngredients,
	});
	for (const path of GLOBAL_PREFERENCE_ATOMIC_GROUP_PATHS) {
		const baseValue = readPreferenceGroup(base, path);
		const cloudValue = readPreferenceGroup(cloud, path);
		const localValue = readPreferenceGroup(local, path);
		const hasCloudChange = !checkSnapshotEqual(cloudValue, baseValue);
		const hasLocalChange = !checkSnapshotEqual(localValue, baseValue);

		if (!hasCloudChange && hasLocalChange) {
			writePreferenceGroup(data, path, localValue);
			continue;
		}
		if (
			hasCloudChange &&
			hasLocalChange &&
			!checkSnapshotEqual(cloudValue, localValue)
		) {
			requiresConfirmation = true;
		}
	}

	return createMergeResult({
		data,
		requiresConfirmation,
		shouldUpload: !checkSnapshotEqual(data, cloud),
	});
}

function replaceDonationModal(
	snapshot: TGlobalPreferencesSnapshot,
	donationModal: TGlobalPreferencesSnapshot['donationModal']
) {
	return { ...snapshot, donationModal };
}

function mergeWithoutReliableBase({
	cloud,
	defaults,
	local,
	namespace,
}: {
	cloud: TGlobalPreferencesSnapshot | null;
	defaults: TGlobalPreferencesSnapshot;
	local: TGlobalPreferencesSnapshot;
	namespace: TSyncNamespace;
}) {
	const donationModal = mergeDonationModal(
		defaults.donationModal,
		cloud?.donationModal ?? defaults.donationModal,
		local.donationModal
	);
	const normalizedDefaults = replaceDonationModal(defaults, donationModal);
	const normalizedCloud =
		cloud === null ? null : replaceDonationModal(cloud, donationModal);
	const normalizedLocal = replaceDonationModal(local, donationModal);
	const merged = mergeFieldMap<TGlobalPreferencesSnapshot>({
		allowBaseNullAutoMerge: true,
		base: null,
		cloud: normalizedCloud,
		defaults: normalizedDefaults,
		local: normalizedLocal,
		namespace,
	});

	if (cloud === null || merged.conflict !== null) {
		return {
			...merged,
			shouldUpload:
				merged.conflict === null &&
				!checkSnapshotEqual(merged.data, defaults),
		};
	}

	const ordinaryDefaults = defaults;
	const ordinaryCloud = replaceDonationModal(cloud, defaults.donationModal);
	const ordinaryLocal = replaceDonationModal(local, defaults.donationModal);
	const requiresConfirmation =
		merged.requiresConfirmation ||
		(!checkSnapshotEqual(ordinaryLocal, ordinaryDefaults) &&
			!checkSnapshotEqual(ordinaryCloud, ordinaryDefaults) &&
			!checkSnapshotEqual(ordinaryLocal, ordinaryCloud));

	return {
		...merged,
		requiresConfirmation,
		shouldUpload: !checkSnapshotEqual(merged.data, cloud),
	};
}

export function mergeGlobalPreferencesSnapshots({
	base,
	cloud,
	defaults,
	local,
	namespace,
	setValueOrders,
}: {
	base: TGlobalPreferencesSnapshot | null;
	cloud: TGlobalPreferencesSnapshot | null;
	defaults: TGlobalPreferencesSnapshot;
	local: TGlobalPreferencesSnapshot;
	namespace: TSyncNamespace;
	setValueOrders: IGlobalPreferencesSetValueOrders;
}) {
	if (base !== null && cloud !== null) {
		return mergeReliableBaseSnapshots({
			base,
			cloud,
			local,
			setValueOrders,
		});
	}

	return mergeWithoutReliableBase({ cloud, defaults, local, namespace });
}
