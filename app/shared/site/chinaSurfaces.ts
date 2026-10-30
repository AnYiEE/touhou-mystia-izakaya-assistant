import { type TLocale } from '@/shared/i18n/locale';

/**
 * @description Display languages for the China-facing community entries: the
 * community group links (QQ, RedNote) and the APP guide link. Donation entries
 * are shown in every language and labelled as mainland-China Alipay instead.
 * This is a deliberate hard-coded configuration: changing the list is a code
 * change, and languages outside the list never see these entries.
 */
export const CHINA_SURFACE_LOCALES: ReadonlyArray<TLocale> = ['zh-CN'];

export function isChinaSurfaceLocale(locale: TLocale): boolean {
	return CHINA_SURFACE_LOCALES.includes(locale);
}
