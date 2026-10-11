import type { TPlaceLocalizationLoader } from '@/domain/data/localization/types';
import { PLACE_LOCALIZATION_LOADERS } from '@/domain/data/places/localization';
import {
	MERCHANT_LABEL_MAP,
	type TMerchantLabel,
} from '@/domain/data/places/merchantFacts';
import {
	ALL_MAP_LABELS,
	ALL_MAP_LABELS_SET,
	MAP_FACTS,
	PLACE_LABEL_MAP,
} from '@/domain/data/places/placeFacts';
import type { TMapLabel, TPlaceLabel } from '@/domain/data/places/types';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { compareLocalizedName } from '@/shared/utilities/search/localeNameMatch';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

let activeLabels: Readonly<Partial<Record<string, string | null>>> | null =
	null;
let activeMerchants: Readonly<Partial<Record<string, string | null>>> | null =
	null;
let activeLocale: TLocale = DEFAULT_LOCALE;

const loaders: TPlaceLocalizationLoader = PLACE_LOCALIZATION_LOADERS;
const MAP_ID_BY_DISPLAY_LABEL = new Map<string, TMapLabel>(
	ALL_MAP_LABELS.map((map) => [MAP_FACTS[map].label, map])
);
const MERCHANT_ID_BY_DISPLAY_LABEL = new Map<string, TMerchantLabel>(
	(Object.keys(MERCHANT_LABEL_MAP) as TMerchantLabel[]).map((merchant) => [
		MERCHANT_LABEL_MAP[merchant],
		merchant,
	])
);

export function deactivatePlaceLabels() {
	activeLocale = DEFAULT_LOCALE;
	activeLabels = null;
	activeMerchants = null;
}

export async function activatePlaceLabels(locale: TLocale) {
	if (locale === DEFAULT_LOCALE) {
		deactivatePlaceLabels();
		return;
	}

	const loader = loaders[locale];
	if (loader === undefined) {
		deactivatePlaceLabels();
		return;
	}

	const localization = await loader();
	activeLocale = locale;
	activeLabels = localization.labels;
	activeMerchants = localization.merchants;
}

export function getMapLabel(map: TMapLabel) {
	return activeLabels?.[map] ?? MAP_FACTS[map].label;
}

export function getPlaceLabel(place: TPlaceLabel) {
	return activeLabels?.[place] ?? PLACE_LABEL_MAP[place];
}

export function getMerchantLabel(merchant: TMerchantLabel) {
	return activeMerchants?.[merchant] ?? MERCHANT_LABEL_MAP[merchant];
}

export function getMerchantLabelByDisplayLabel(displayLabel: string) {
	const merchant = MERCHANT_ID_BY_DISPLAY_LABEL.get(displayLabel);
	return merchant === undefined ? displayLabel : getMerchantLabel(merchant);
}

export function getActivePlaceLabelLocale() {
	return activeLocale;
}

export function getMapLabelByDisplayLabel(displayLabel: string) {
	const map = MAP_ID_BY_DISPLAY_LABEL.get(displayLabel);
	if (map !== undefined) {
		return getMapLabel(map);
	}

	return ALL_MAP_LABELS_SET.has(displayLabel)
		? getMapLabel(displayLabel as TMapLabel)
		: displayLabel;
}

export function compareMapLabelText(a: string, b: string) {
	return activeLocale === DEFAULT_LOCALE
		? pinyinSort(a, b)
		: compareLocalizedName(a, b, activeLocale);
}

export function compareMapLabels(a: TMapLabel, b: TMapLabel) {
	return compareMapLabelText(getMapLabel(a), getMapLabel(b));
}
