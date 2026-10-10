import type {
	ILocalizedTagLabels,
	TTagLocalizationLoader,
} from '@/domain/data/localization/types';
import { TAG_LOCALIZATION_LOADERS } from '@/domain/data/tags/localization';
import { BEVERAGE_TAG_MAP, FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { compareLocalizedName } from '@/shared/utilities/search/localeNameMatch';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

let activeLabels: ILocalizedTagLabels | null = null;
let activeLocale: TLocale = DEFAULT_LOCALE;

const loaders: TTagLocalizationLoader = TAG_LOCALIZATION_LOADERS;

export function deactivateTagLabels() {
	activeLocale = DEFAULT_LOCALE;
	activeLabels = null;
}

/**
 * @description Tag labels are a display projection: ids stay canonical for
 * selection, sync payloads, and legacy-name resolution; only rendered text
 * switches language. Activation runs inside the catalog localization pipeline
 * so the shared revision bump re-renders label consumers.
 */
export async function activateTagLabels(locale: TLocale) {
	if (locale === DEFAULT_LOCALE) {
		deactivateTagLabels();
		return;
	}

	const loader = loaders[locale];
	if (loader === undefined) {
		deactivateTagLabels();
		return;
	}

	const labels = await loader();
	activeLocale = locale;
	activeLabels = labels;
}

export function getActiveTagLabelLocale() {
	return activeLocale;
}

export function getFoodTagLabel(id: TFoodTagId) {
	return activeLabels?.foodTags[id] ?? FOOD_TAG_MAP[id];
}

export function getBeverageTagLabel(id: TBeverageTagId) {
	return activeLabels?.beverageTags[id] ?? BEVERAGE_TAG_MAP[id];
}

export function compareFoodTagLabels(aId: TFoodTagId, bId: TFoodTagId): number {
	const aLabel = getFoodTagLabel(aId);
	const bLabel = getFoodTagLabel(bId);

	return activeLocale === DEFAULT_LOCALE
		? pinyinSort(aLabel, bLabel)
		: compareLocalizedName(aLabel, bLabel, activeLocale);
}
