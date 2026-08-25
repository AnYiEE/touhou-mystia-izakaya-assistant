import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import type { TBeverageId, TBeverageName } from '@/domain/data/beverages/types';

import { resolveLegacyRecordName } from './resolveLegacyRecordName';

export const LEGACY_BEVERAGE_NAME_ID_MAP = {
	'“大冰棍儿！”': 28,
} as const satisfies Record<string, TBeverageId>;

type TLegacyBeverageAlias = keyof typeof LEGACY_BEVERAGE_NAME_ID_MAP;

export type TLegacyBeverageName = TBeverageName | TLegacyBeverageAlias;

const beverageCatalog = BeverageCatalog.getInstance();

export const SUPPORTED_LEGACY_BEVERAGE_NAMES = new Set<string>([
	...beverageCatalog.getNames(),
	...Object.keys(LEGACY_BEVERAGE_NAME_ID_MAP),
]);

export function checkLegacyBeverageName(
	value: unknown
): value is TLegacyBeverageName {
	return (
		typeof value === 'string' && SUPPORTED_LEGACY_BEVERAGE_NAMES.has(value)
	);
}

export function resolveLegacyBeverageName(
	name: TLegacyBeverageName
): TBeverageId {
	if (Object.hasOwn(LEGACY_BEVERAGE_NAME_ID_MAP, name)) {
		return LEGACY_BEVERAGE_NAME_ID_MAP[name as TLegacyBeverageAlias];
	}

	return resolveLegacyRecordName({
		catalog: beverageCatalog,
		category: 'beverage',
		name: name as TBeverageName,
	});
}
