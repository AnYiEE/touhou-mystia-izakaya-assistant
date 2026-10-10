'use client';

import {
	type PropsWithChildren,
	createContext,
	useContext,
	useMemo,
} from 'react';

import { DEFAULT_LOCALE, type TLocale } from './locale';
import {
	type TLocalizedMessageTable,
	type TMessageParams,
	translate,
} from './messages';

const I18nContext = createContext<TLocale>(DEFAULT_LOCALE);

export function I18nProvider({
	children,
	locale,
}: PropsWithChildren<{ locale: TLocale }>) {
	return (
		<I18nContext.Provider value={locale}>{children}</I18nContext.Provider>
	);
}

/**
 * @description Current display locale from the i18n context.
 */
export function useCurrentLocale(): TLocale {
	return useContext(I18nContext);
}

export function useI18n<TKey extends string>(
	messages: TLocalizedMessageTable<TKey>
) {
	const locale = useContext(I18nContext);

	return useMemo(
		() => ({
			locale,
			t: (key: TKey, params?: TMessageParams) =>
				translate(messages, locale, key, params),
		}),
		[locale, messages]
	);
}
