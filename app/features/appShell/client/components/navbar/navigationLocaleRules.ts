import { type TLocale } from '@/shared/i18n/locale';

/* In the `md`–`lg` range these locales trade parts of the desktop chrome for
 * room: their labels are wide enough to crowd the compact brand block. */
export const NAVBAR_BRAND_LG_UP_ONLY_LOCALES: ReadonlyArray<TLocale> = ['en'];

export const NAVBAR_HOME_LG_UP_ONLY_LOCALES: ReadonlyArray<TLocale> = [
	'en',
	'ja',
	'ko',
];

export const NAVBAR_ICON_ONLY_ACCOUNT_LOCALES: ReadonlyArray<TLocale> = [
	'en',
	'ja',
	'ko',
];

/* English keeps the icon-only account button all the way to `xl`; its wider
 * label otherwise pushes the `lg` layout past the viewport. */
export const NAVBAR_ICON_ONLY_ACCOUNT_BELOW_XL_LOCALES: ReadonlyArray<TLocale> =
	['en'];

/* Below `xl` these locales use tighter navbar spacing: their labels and
 * chrome are wide enough that the default `gap-4`/`pl-2` rhythm pushes the
 * navbar past the viewport on narrow pages. The Chinese layout is untouched. */
export const NAVBAR_COMPACT_BELOW_XL_LOCALES: ReadonlyArray<TLocale> = [
	'en',
	'ja',
	'ko',
];

/* English catalogue names include single long words (such as "Ingredients")
 * that a narrower column cannot wrap, so its Browse-menu columns are wider;
 * other locales keep the narrower columns and let multi-word names wrap onto
 * a second line. */
export const NAVBAR_BROWSE_WIDE_COLUMN_LOCALES: ReadonlyArray<TLocale> = ['en'];
