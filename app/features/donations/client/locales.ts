import type { TLocale } from '@/shared/i18n/locale';

/**
 * @description Display languages that may see the donation modal. This is a
 * deliberate hard-coded configuration: changing the list is a code change,
 * and languages outside the list never trigger the modal.
 */
export const DONATION_MODAL_LOCALES: ReadonlyArray<TLocale> = ['zh-CN'];
