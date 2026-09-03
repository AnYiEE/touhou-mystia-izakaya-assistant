import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';
import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
import type { TDlc } from '@/domain/data/shared/types';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import { RECOMMENDATION_SORT_PROFILE_LABEL_MAP } from '@/domain/recommendations/labels';
import { RECOMMENDATION_SORT_PROFILES } from '@/domain/recommendations/sortProfiles';
import { checkPopularFoodTagId } from '@/domain/trends/checkPopularFoodTagId';

import { globalPreferencesShape } from '@/features/account/sync/shapes/globalPreferences';
import type { TGlobalPreferencesSnapshot } from '@/features/account/sync/shapes/globalPreferencesTypes';
import type { TPreferenceTargetKey } from '@/features/preferences/contracts';

import { generateRange } from '@/shared/utilities/collections/generateRange';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

interface IGlobalStorePersistence extends TGlobalPreferencesSnapshot {
	cloudCode: string | null;
	dirver: string[];
	userId: string | null;
	version: string | null;
}

export function createDefaultGlobalStorePersistence(): IGlobalStorePersistence {
	return {
		...globalPreferencesShape.createDefault(),
		cloudCode: null,
		dirver: [],
		userId: null,
		version: null,
	};
}

export function normalizeGlobalStorePersistence(
	value: unknown
): IGlobalStorePersistence {
	const normalized = globalPreferencesShape.normalize(value);
	const record = isObjectTagRecord(value) ? value : {};

	return {
		...normalized,
		cloudCode:
			record['cloudCode'] === null ||
			typeof record['cloudCode'] === 'string'
				? record['cloudCode']
				: null,
		dirver: Array.isArray(record['dirver'])
			? record['dirver'].filter(
					(item): item is string => typeof item === 'string'
				)
			: [],
		userId:
			record['userId'] === null || typeof record['userId'] === 'string'
				? record['userId']
				: null,
		version:
			record['version'] === null || typeof record['version'] === 'string'
				? record['version']
				: null,
	};
}

export function createDefaultGlobalStoreStaticState() {
	const allDlcs = [
		...new Set(
			[
				BeverageCatalog.getInstance().getValuesByProp('dlc'),
				ClothesCatalog.getInstance().getValuesByProp('dlc'),
				CookerCatalog.getInstance().getValuesByProp('dlc'),
				CurrencyItemCatalog.getInstance().getValuesByProp('dlc'),
				IngredientCatalog.getInstance().getValuesByProp('dlc'),
				NormalGuestCatalog.getInstance().getValuesByProp('dlc'),
				SpecialGuestCatalog.getInstance().getValuesByProp('dlc'),
				DecorationCatalog.getInstance().getValuesByProp('dlc'),
				PartnerCatalog.getInstance().getValuesByProp('dlc'),
				FoodCatalog.getInstance().getValuesByProp('dlc'),
			].flat()
		),
	].sort(numberSort) as TDlc[];

	const foodCatalog = FoodCatalog.getInstance();
	const ingredientCatalog = IngredientCatalog.getInstance();
	const ingredientTags = ingredientCatalog
		.getValuesByProp('tags')
		.filter((tag) => !ingredientCatalog.blockedTags.has(tag));
	const foodPositiveTags = foodCatalog
		.getValuesByProp('positiveTags')
		.filter((tag) => !foodCatalog.blockedTags.has(tag));
	const validPopularTags = [
		...new Set(ingredientTags).union(new Set(foodPositiveTags)),
	]
		.filter(checkPopularFoodTagId)
		.sort((a, b) => pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b]))
		.map((tag) => ({ tag, value: FOOD_TAG_MAP[tag] }));

	return {
		dlcs: allDlcs.map(toGetValueCollection),
		popularTags: validPopularTags,
	};
}

export function createDefaultGlobalStoreSharedState() {
	return {
		preferencesModal: {
			isOpen: false,
			openSource: null as null | 'sideButton' | 'spotlight',
			targetKey: null as TPreferenceTargetKey | null,
		},
		suggestMeals: {
			selectableMaxExtraIngredients: [
				{ label: '不限', value: null },
				...generateRange(0, 4).map((n) => ({
					label: n.toString(),
					value: n,
				})),
			] as Array<{ label: string; value: number | null }>,
			selectableMaxRatings: [
				{ label: '极度不满', value: 0 },
				{ label: '不满', value: 1 },
				{ label: '普通', value: 2 },
				{ label: '满意', value: 3 },
				{ label: '完美', value: 4 },
			] as Array<{ label: string; value: number }>,
			selectableMaxResults: generateRange(5, 20).map(
				toGetValueCollection
			),
			selectableSortProfiles: RECOMMENDATION_SORT_PROFILES.map(
				(value) => ({
					label: RECOMMENDATION_SORT_PROFILE_LABEL_MAP[value],
					value,
				})
			),
		},
		table: {
			selectableRows: generateRange(5, 20).map(toGetValueCollection),
		},
	};
}
