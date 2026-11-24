import { type TLocale } from '@/shared/i18n/locale';

/**
 * @description Display languages for the China-facing community entries: the
 * QQ group links and the APP guide link. Donation entries are shown in every
 * language and labelled as mainland-China Alipay and WeChat instead. This is a
 * deliberate hard-coded configuration: changing the list is a code change, and
 * languages outside the list never see these entries.
 */
export const CHINA_SURFACE_LOCALES: ReadonlyArray<TLocale> = ['zh-CN'];

export function isChinaSurfaceLocale(locale: TLocale): boolean {
	return CHINA_SURFACE_LOCALES.includes(locale);
}
