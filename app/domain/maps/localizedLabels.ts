import type {
	IDayMapLocalization,
	TDayMapLocalizationLoader,
} from '@/domain/data/localization/types';
import { DAY_MAP_LOCALIZATION_LOADERS } from '@/domain/data/maps/localization';
import type { IDayMapCharacter } from '@/domain/data/maps/types';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';

let activeLocalization: IDayMapLocalization | null = null;
let activeRequestId = 0;

const loaders: TDayMapLocalizationLoader = DAY_MAP_LOCALIZATION_LOADERS;

export function deactivateDayMapLabels() {
	activeRequestId += 1;
	activeLocalization = null;
}

export async function activateDayMapLabels(locale: TLocale) {
	if (locale === DEFAULT_LOCALE) {
		deactivateDayMapLabels();
		return;
	}

	const loader = loaders[locale];
	if (loader === undefined) {
		deactivateDayMapLabels();
		return;
	}

	const requestId = ++activeRequestId;
	const localization = await loader();
	if (requestId === activeRequestId) {
		activeLocalization = localization;
	}
}

export function getDayMapCharacterName({
	id,
	name,
}: Pick<IDayMapCharacter, 'id' | 'name'>) {
	return activeLocalization?.characters[id] ?? name;
}

/** @description Name of an extra day-map place or exit target; `fallback` is its Simplified Chinese name. */
export function getDayMapPlaceName(place: string, fallback: string) {
	return activeLocalization?.places[place] ?? fallback;
}
