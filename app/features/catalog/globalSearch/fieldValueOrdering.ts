import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import {
	getCookerSeriesLabel,
	getCookerTypeLabel,
	getIngredientTypeLabel,
} from '@/domain/catalog/localizedCategoryLabels';
import { COOKER_TYPE_LABEL_MAP } from '@/domain/data/cookers/cookerFacts';
import { compareIngredientTypes } from '@/domain/data/ingredients/ingredientFacts';
import { SPEED_LABEL_MAP } from '@/domain/data/partners/speedFacts';
import { ALL_MAP_LABELS } from '@/domain/data/places/placeFacts';
import {
	getActivePlaceLabelLocale,
	getMapLabel,
} from '@/domain/places/localizedLabels';

import {
	CATALOG_ITEMS_SPEED_LABEL_MESSAGE_KEYS,
	catalogItemsMessages,
} from '@/features/catalog/items/shared/messages';
import { getActiveLocalizationLocale } from '@/features/catalog/shared/client/localization/activeLocalizationLocale';
import {
	getActiveTagLabelLocale,
	getBeverageTagLabel,
} from '@/features/catalog/shared/client/localization/tagLabels';
import type {
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from '@/features/globalSearch/contracts';

import { translate } from '@/shared/i18n/messages';
import { numberSort } from '@/shared/utilities/sort/numberSort';

const businessOrderMapCache = new Map<string, Map<string, number>>();
const SPEED_VALUE_ORDER = [
	'Slow',
	'Medium',
	'Fast',
	'None',
] as const satisfies ReadonlyArray<keyof typeof SPEED_LABEL_MAP>;

function getLocalizedSpeedLabels() {
	return SPEED_VALUE_ORDER.map((speed) =>
		translate(
			catalogItemsMessages,
			getActiveLocalizationLocale(),
			CATALOG_ITEMS_SPEED_LABEL_MESSAGE_KEYS[speed]
		)
	);
}

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
			`beverage-tag:${getActiveTagLabelLocale()}`,
			() =>
				BeverageCatalog.getInstance()
					.getValuesByProp('tags')
					.sort(numberSort)
					.map((tag) => getBeverageTagLabel(tag))
		);
	}
	if (fieldType === 'tag' && contextSection === 'beverages') {
		return getCachedFieldValueOrderMap(
			`tag:beverages:${getActiveTagLabelLocale()}`,
			() =>
				BeverageCatalog.getInstance()
					.getValuesByProp('tags')
					.sort(numberSort)
					.map((tag) => getBeverageTagLabel(tag))
		);
	}
	if (fieldType === 'type' && contextSection === 'ingredients') {
		return getCachedFieldValueOrderMap(
			`type:ingredients:${getActiveLocalizationLocale()}`,
			() =>
				IngredientCatalog.getInstance()
					.getValuesByProp('type')
					.sort(compareIngredientTypes)
					.map((type) => getIngredientTypeLabel(type))
		);
	}
	if (fieldType === 'type' && contextSection === 'cookers') {
		return getCachedFieldValueOrderMap(
			`type:cookers:${getActiveLocalizationLocale()}`,
			() =>
				Object.keys(COOKER_TYPE_LABEL_MAP).map((type) =>
					getCookerTypeLabel(Number(type))
				)
		);
	}
	if (fieldType === 'category') {
		return getCachedFieldValueOrderMap(
			`category:cookers:${getActiveLocalizationLocale()}`,
			() => {
				const names: string[] = [];
				CookerCatalog.getInstance()
					.getValuesByProp('series')
					.sort(numberSort)
					.forEach((series) => {
						const name = getCookerSeriesLabel(series);
						if (!names.includes(name)) {
							names.push(name);
						}
					});
				return names;
			}
		);
	}
	if (fieldType === 'place') {
		return getCachedFieldValueOrderMap(
			`place:${getActivePlaceLabelLocale()}`,
			() => ALL_MAP_LABELS.map((map) => getMapLabel(map))
		);
	}
	if (['moving-speed', 'speed', 'working-speed'].includes(fieldType)) {
		return getCachedFieldValueOrderMap(
			`speed:${getActiveLocalizationLocale()}`,
			getLocalizedSpeedLabels
		);
	}

	return null;
}
