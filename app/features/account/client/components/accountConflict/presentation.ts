import { type TSyncNamespace } from '@/domain/account/contracts';

import { type TAccountMessageKey } from '@/features/account/client/messages';
import { type TAccountSyncConflictResolution as TSyncConflictResolution } from '@/features/account/client/sync/conflictResolutionJournal';
import { createSnapshotHash } from '@/features/account/client/sync/dirtyQueue/snapshotHash';

import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

export const SYNC_NAMESPACE_LABEL_KEYS = {
	'customer_normal.meals': 'account.conflict.namespace.customerNormalMeals',
	'customer_rare.meals': 'account.conflict.namespace.customerRareMeals',
	'customer_rare.plans': 'account.conflict.namespace.customerRarePlans',
	'customer_rare.settings': 'account.conflict.namespace.customerRareSettings',
	'global.preferences': 'account.conflict.namespace.globalPreferences',
	theme: 'account.conflict.namespace.theme',
	'tutorial.customer_rare': 'account.conflict.namespace.tutorialCustomerRare',
} as const satisfies Record<TSyncNamespace, TAccountMessageKey>;

const CONFLICT_FIELD_LABEL_KEYS: Record<string, TAccountMessageKey> = {
	activeId: 'account.conflict.field.activeId',
	columns: 'account.conflict.field.columns',
	completed: 'account.conflict.field.completed',
	darkPalette: 'account.conflict.field.darkPalette',
	dlcs: 'account.conflict.field.dlcs',
	enabled: 'account.conflict.field.enabled',
	famousShop: 'account.conflict.field.famousShop',
	guestCardTagsTooltip: 'account.conflict.field.guestCardTagsTooltip',
	hiddenItems: 'account.conflict.field.hiddenItems',
	highAppearance: 'account.conflict.field.highAppearance',
	items: 'account.conflict.field.items',
	lightPalette: 'account.conflict.field.lightPalette',
	maxExtraIngredients: 'account.conflict.field.maxExtraIngredients',
	maxRating: 'account.conflict.field.maxRating',
	maxResults: 'account.conflict.field.maxResults',
	mode: 'account.conflict.field.mode',
	orderLinkedFilter: 'account.conflict.field.orderLinkedFilter',
	popularTrend: 'account.conflict.field.popularTrend',
	'popularTrend.isNegative': 'account.conflict.field.popularTrendIsNegative',
	'popularTrend.tag': 'account.conflict.field.popularTrendTag',
	row: 'account.conflict.field.row',
	showTagDescription: 'account.conflict.field.showTagDescription',
	sortProfile: 'account.conflict.field.sortProfile',
	suggestMeals: 'account.conflict.field.suggestMeals',
	'suggestMeals.maxExtraIngredients':
		'account.conflict.field.suggestMealsMaxExtraIngredients',
	'suggestMeals.maxRating': 'account.conflict.field.suggestMealsMaxRating',
	'suggestMeals.maxResults': 'account.conflict.field.suggestMealsMaxResults',
	'suggestMeals.sortProfile':
		'account.conflict.field.suggestMealsSortProfile',
	table: 'account.conflict.field.table',
	'table.columns.beverage': 'account.conflict.field.tableColumnsBeverage',
	'table.columns.recipe': 'account.conflict.field.tableColumnsRecipe',
	'table.hiddenItems.beverages':
		'account.conflict.field.tableHiddenItemsBeverages',
	'table.hiddenItems.ingredients':
		'account.conflict.field.tableHiddenItemsIngredients',
	'table.hiddenItems.recipes':
		'account.conflict.field.tableHiddenItemsRecipes',
	tachie: 'account.conflict.field.tachie',
	theme: 'account.conflict.field.theme',
	vibrate: 'account.conflict.field.vibrate',
};

export const CONFLICT_BOOLEAN_VALUE_LABEL_KEYS: Record<
	string,
	readonly [TAccountMessageKey, TAccountMessageKey]
> = {
	completed: [
		'account.conflict.boolean.completedFalse',
		'account.conflict.boolean.completedTrue',
	],
	'popularTrend.isNegative': [
		'account.conflict.boolean.popularPositive',
		'account.conflict.boolean.popularNegative',
	],
};

export const CONFLICT_VALUE_LABEL_KEYS: Record<string, TAccountMessageKey> = {
	action: 'account.conflict.value.action',
	beverage: 'account.conflict.value.beverage',
	cooker: 'account.conflict.value.cooker',
	cookerType: 'account.conflict.value.cookerType',
	ingredient: 'account.conflict.value.ingredient',
	price: 'account.conflict.value.price',
	recipe: 'account.conflict.value.recipe',
	suitability: 'account.conflict.value.suitability',
	time: 'account.conflict.value.time',
};

const MAX_VISIBLE_DIFFERENCES = 6;

export interface IConflictDifference {
	cloud: unknown;
	labelFallback: string;
	labelKey: TAccountMessageKey | null;
	local: unknown;
	merged: unknown;
	path: string;
}

export interface IConflictDifferenceResult {
	hasMore: boolean;
	items: IConflictDifference[];
}

function getConflictFieldLabel(path: string[]) {
	const fullPath = path.join('.');
	const fieldName = path.at(-1) ?? '';
	const labelKey =
		CONFLICT_FIELD_LABEL_KEYS[fullPath] ??
		CONFLICT_FIELD_LABEL_KEYS[fieldName];

	return { labelFallback: fieldName, labelKey: labelKey ?? null };
}

export function getConflictDifferences(
	cloud: unknown,
	local: unknown,
	merged: unknown
): IConflictDifferenceResult {
	const items: IConflictDifference[] = [];
	let hasMore = false;

	const visit = (
		cloudValue: unknown,
		localValue: unknown,
		mergedValue: unknown,
		path: string[]
	) => {
		if (createSnapshotHash(cloudValue) === createSnapshotHash(localValue)) {
			return;
		}

		if (items.length >= MAX_VISIBLE_DIFFERENCES) {
			hasMore = true;
			return;
		}

		if (checkIsRecord(cloudValue) && checkIsRecord(localValue)) {
			const mergedRecord = checkIsRecord(mergedValue)
				? mergedValue
				: undefined;
			const keys = new Set([
				...Object.keys(cloudValue),
				...Object.keys(localValue),
			]);

			for (const key of keys) {
				visit(cloudValue[key], localValue[key], mergedRecord?.[key], [
					...path,
					key,
				]);
				if (hasMore) {
					break;
				}
			}
			return;
		}

		items.push({
			cloud: cloudValue,
			...getConflictFieldLabel(path),
			local: localValue,
			merged: mergedValue,
			path: path.join('.'),
		});
	};

	visit(cloud, local, merged, []);

	return { hasMore, items };
}

export function formatConflictData(data: unknown) {
	try {
		return JSON.stringify(data, null, 2);
	} catch {
		return String(data);
	}
}

const CONFLICT_RESOLUTION_TRACK_NAME_MAP = {
	cloud: 'Use Cloud',
	local: 'Use Local',
	merged: 'Use Merged',
} as const;

export function getConflictResolutionTrackName(
	resolution: TSyncConflictResolution
) {
	return resolution.startsWith('collision:')
		? 'Use Local Collision Candidate'
		: CONFLICT_RESOLUTION_TRACK_NAME_MAP[
				resolution as 'cloud' | 'local' | 'merged'
			];
}
