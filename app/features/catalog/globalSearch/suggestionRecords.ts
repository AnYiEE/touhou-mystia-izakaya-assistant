import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { COOKER_TYPE_LABEL_MAP } from '@/domain/data/cookers/cookerFacts';
import type { TCookerTypeId } from '@/domain/data/cookers/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TSpriteRecordIdentity } from '@/domain/data/sprites/types';

import type {
	IGlobalSearchIndexItem,
	TGlobalSearchFieldType,
} from '@/features/globalSearch/contracts';

function flattenNumericValue(value: unknown): number[] {
	if (typeof value === 'number') {
		return [value];
	}
	if (Array.isArray(value)) {
		return value.flatMap(flattenNumericValue);
	}

	return [];
}

function checkCookerType(value: number): value is TCookerTypeId {
	return Object.hasOwn(COOKER_TYPE_LABEL_MAP, value);
}

function checkIngredient(
	value: number,
	ingredientSet: ReadonlySet<number>
): value is TIngredientId {
	return ingredientSet.has(value);
}

export function getCatalogSearchSuggestionRecordKey(
	fieldType: TGlobalSearchFieldType,
	value: string
) {
	return `${fieldType}:${value}`;
}

export function createCatalogSearchSuggestionRecordMap(
	index: ReadonlyArray<IGlobalSearchIndexItem>
) {
	const records = new Map<string, TSpriteRecordIdentity[]>();
	const cookerCatalog = CookerCatalog.getInstance();
	const ingredientCatalog = IngredientCatalog.getInstance();
	const ingredientSet = new Set<number>(
		ingredientCatalog.getValuesByProp('id')
	);

	const addRecord = (
		fieldType: TGlobalSearchFieldType,
		value: string,
		record: TSpriteRecordIdentity
	) => {
		const key = getCatalogSearchSuggestionRecordKey(fieldType, value);
		const entries = records.get(key);
		if (entries === undefined) {
			records.set(key, [record]);
			return;
		}
		if (
			!entries.some(
				(entry) =>
					entry.spriteTarget === record.spriteTarget &&
					entry.recordId === record.recordId
			)
		) {
			entries.push(record);
		}
	};

	index.forEach((item) => {
		item.fields.forEach(({ fieldType, value }) => {
			if (fieldType === 'ingredient') {
				flattenNumericValue(value).forEach((recordId) => {
					if (!checkIngredient(recordId, ingredientSet)) {
						return;
					}
					addRecord(
						fieldType,
						ingredientCatalog.getPropsById(recordId, 'name'),
						{ recordId, spriteTarget: 'ingredient' }
					);
				});
				return;
			}
			if (fieldType === 'cooker-type') {
				flattenNumericValue(value).forEach((type) => {
					if (!checkCookerType(type)) {
						return;
					}
					addRecord(fieldType, COOKER_TYPE_LABEL_MAP[type], {
						recordId: cookerCatalog.getIdByTypeAndSeries(type, 0),
						spriteTarget: 'cooker',
					});
				});
			}
		});
	});

	return records;
}
