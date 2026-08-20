import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import type { TFoodId, TFoodName } from '@/domain/data/foods/types';

import { resolveLegacyRecordName } from './resolveLegacyRecordName';

export const LEGACY_FOOD_NAME_ID_MAP = {
	樱绯星屑缀玉烩: 11012,
} as const satisfies Record<string, TFoodId>;

type TLegacyFoodAlias = keyof typeof LEGACY_FOOD_NAME_ID_MAP;

export type TLegacyFoodName = TFoodName | TLegacyFoodAlias;

const foodCatalog = FoodCatalog.getInstance();

export const SUPPORTED_LEGACY_FOOD_NAMES = new Set<string>([
	...foodCatalog.getNames(),
	...Object.keys(LEGACY_FOOD_NAME_ID_MAP),
]);

export function checkLegacyFoodName(value: unknown): value is TLegacyFoodName {
	return typeof value === 'string' && SUPPORTED_LEGACY_FOOD_NAMES.has(value);
}

export function resolveLegacyFoodName(name: TLegacyFoodName): TFoodId {
	if (Object.hasOwn(LEGACY_FOOD_NAME_ID_MAP, name)) {
		return LEGACY_FOOD_NAME_ID_MAP[name as TLegacyFoodAlias];
	}

	return resolveLegacyRecordName({
		catalog: foodCatalog,
		category: 'food',
		name: name as TFoodName,
	});
}
