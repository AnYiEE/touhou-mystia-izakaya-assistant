import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import {
	INGREDIENT_TYPE_MAP,
	compareIngredientTypes,
} from '@/domain/data/ingredients/ingredientFacts';
import { ALL_MAP_LABELS, MAP_FACTS } from '@/domain/data/places/placeFacts';
import { BEVERAGE_TAG_MAP } from '@/domain/data/tags/tagFacts';

import type {
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from '@/features/globalSearch/contracts';

import { numberSort } from '@/shared/utilities/sort/numberSort';

const businessOrderMapCache = new Map<string, Map<string, number>>();
const SPEED_VALUE_ORDER = ['慢', '中等', '快', '瞬间移动'] as const;

function getCachedFieldValueOrderMap(
	key: string,
	values: () => ReadonlyArray<string>
) {
	return businessOrderMapCache.getOrInsertComputed(
		key,
		() => new Map(values().map((value, index) => [value, index]))
	);
}

export function getCatalogSearchFieldValueOrderMap({
	contextSection,
	fieldType,
}: {
	contextSection: null | TGlobalSearchSection;
	fieldType: TGlobalSearchFieldType;
}) {
	if (fieldType === 'beverage-tag') {
		return getCachedFieldValueOrderMap('beverage-tag', () =>
			BeverageCatalog.getInstance()
				.getValuesByProp('tags')
				.sort(numberSort)
				.map((tag) => BEVERAGE_TAG_MAP[tag])
		);
	}
	if (fieldType === 'tag' && contextSection === 'beverages') {
		return getCachedFieldValueOrderMap('tag:beverages', () =>
			BeverageCatalog.getInstance()
				.getValuesByProp('tags')
				.sort(numberSort)
				.map((tag) => BEVERAGE_TAG_MAP[tag])
		);
	}
	if (fieldType === 'type' && contextSection === 'ingredients') {
		return getCachedFieldValueOrderMap('type:ingredients', () =>
			IngredientCatalog.getInstance()
				.getValuesByProp('type')
				.sort(compareIngredientTypes)
				.map((type) => INGREDIENT_TYPE_MAP[type])
		);
	}
	if (fieldType === 'category') {
		return getCachedFieldValueOrderMap('category:cookers', () => {
			const cookerCatalog = CookerCatalog.getInstance();
			return cookerCatalog
				.groupSeriesByLabel(
					cookerCatalog.getValuesByProp('series').sort(numberSort)
				)
				.map(({ name }) => name);
		});
	}
	if (fieldType === 'place') {
		return getCachedFieldValueOrderMap('place', () =>
			ALL_MAP_LABELS.map((map) => MAP_FACTS[map].label)
		);
	}
	if (['moving-speed', 'speed', 'working-speed'].includes(fieldType)) {
		return getCachedFieldValueOrderMap('speed', () => SPEED_VALUE_ORDER);
	}

	return null;
}
