import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { normalizeMatchText } from '@/shared/utilities/search/localeNameMatch';

export function normalizeSearchMatchText(
	value: string,
	locale: TLocale = DEFAULT_LOCALE
) {
	return normalizeMatchText(value, locale);
}
