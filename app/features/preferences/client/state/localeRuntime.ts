import { useHydrated } from '@/shared/react/useHydrated';
import { type TLocale, type TLocalePreference } from '@/shared/i18n/locale';

import { globalStore } from './globalPersistenceStore';
import {
	applyLocalePreferenceToDocument,
	resolveEffectiveLocale,
	writeLocaleMirrorPreference,
	writeLocalePreferenceCookie,
} from './localeMirror';

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

export function getLocalePreference(): TLocalePreference {
	return globalStore.persistence.locale.get();
}

export function setLocalePreference(preference: TLocalePreference) {
	globalStore.persistence.locale.set(preference);
}

export function useLocalePreference(): TLocalePreference {
	return globalStore.persistence.locale.use();
}

export function useLocale(): TLocale {
	return resolveEffectiveLocale(useLocalePreference());
}

export function useHydratedLocale(
	initialLocale: TLocale,
	routeLocale: TLocale | null = null
): TLocale {
	const isHydrated = useHydrated();
	const preference = useLocalePreference();

	return isHydrated
		? resolveEffectiveLocale(preference, routeLocale)
		: initialLocale;
}

/**
 * @description Keep the locale projection of the shared preference in sync:
 * the lightweight mirror (pre-hydration reads), the SSR cookie and the
 * document language attributes follow every change, including changes that
 * arrive from account sync or another tab.
 */
export function startLocaleClient(routeLocale: TLocale | null = null) {
	if (isServer) {
		return () => {};
	}

	const applyPreference = (preference: TLocalePreference) => {
		writeLocaleMirrorPreference(preference);
		writeLocalePreferenceCookie(preference);
		applyLocalePreferenceToDocument(preference, routeLocale);
	};

	applyPreference(getLocalePreference());

	return globalStore.persistence.locale.onChange((value) => {
		applyPreference(value);
	});
}
