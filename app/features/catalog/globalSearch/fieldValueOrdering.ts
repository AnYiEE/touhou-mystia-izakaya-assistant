import { Beverage } from '@/domain/catalog/food/Beverage';
import { Ingredient } from '@/domain/catalog/food/Ingredient';
import { Cooker } from '@/domain/catalog/items/Cooker';
import { ALL_PLACES } from '@/domain/data/places/placeFacts';

import type {
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from '@/features/globalSearch/contracts';

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
		return getCachedFieldValueOrderMap(
			'beverage-tag',
			() => Beverage.getInstance().sortedTags
		);
	}
	if (fieldType === 'tag' && contextSection === 'beverages') {
		return getCachedFieldValueOrderMap(
			'tag:beverages',
			() => Beverage.getInstance().sortedTags
		);
	}
	if (fieldType === 'type' && contextSection === 'ingredients') {
		return getCachedFieldValueOrderMap(
			'type:ingredients',
			() => Ingredient.getInstance().sortedTypes
		);
	}
	if (fieldType === 'category') {
		return getCachedFieldValueOrderMap(
			'category:cookers',
			() => Cooker.getInstance().sortedCategories
		);
	}
	if (fieldType === 'place') {
		return getCachedFieldValueOrderMap('place', () => ALL_PLACES);
	}
	if (['moving-speed', 'speed', 'working-speed'].includes(fieldType)) {
		return getCachedFieldValueOrderMap('speed', () => SPEED_VALUE_ORDER);
	}

	return null;
}
