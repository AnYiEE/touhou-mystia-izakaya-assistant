import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import type {
	TIngredientId,
	TIngredientName,
} from '@/domain/data/ingredients/types';

import { resolveLegacyRecordName } from './resolveLegacyRecordName';

export const LEGACY_INGREDIENT_NAME_ID_MAP = {
	噗噗哟果: 5002,
	薜茘: 5003,
	西兰花: 5001,
} as const satisfies Record<string, TIngredientId>;

type TLegacyIngredientAlias = keyof typeof LEGACY_INGREDIENT_NAME_ID_MAP;

export type TLegacyIngredientName = TIngredientName | TLegacyIngredientAlias;

const ingredientCatalog = IngredientCatalog.getInstance();

export const SUPPORTED_LEGACY_INGREDIENT_NAMES = new Set<string>([
	...ingredientCatalog.getNames(),
	...Object.keys(LEGACY_INGREDIENT_NAME_ID_MAP),
]);

export function checkLegacyIngredientName(
	value: unknown
): value is TLegacyIngredientName {
	return (
		typeof value === 'string' &&
		SUPPORTED_LEGACY_INGREDIENT_NAMES.has(value)
	);
}

export function resolveLegacyIngredientName(
	name: TLegacyIngredientName
): TIngredientId {
	if (Object.hasOwn(LEGACY_INGREDIENT_NAME_ID_MAP, name)) {
		return LEGACY_INGREDIENT_NAME_ID_MAP[name as TLegacyIngredientAlias];
	}

	return resolveLegacyRecordName({
		catalog: ingredientCatalog,
		category: 'ingredient',
		name: name as TIngredientName,
	});
}

export function resolveLegacyIngredientNames(
	names: ReadonlyArray<TLegacyIngredientName>
) {
	return names.map(resolveLegacyIngredientName);
}
