'use client';

import { type PropsWithChildren, useMemo } from 'react';

import { DesignPreferencesProvider } from '@/design/preferences/DesignPreferencesContext';

import { useHydrated } from '@/shared/react/useHydrated';

import { globalStore } from './state/globalPersistenceStore';

export default function DesignPreferencesConnector({
	children,
}: PropsWithChildren) {
	const isHydrated = useHydrated();
	const persistedIsHighAppearance =
		globalStore.persistence.highAppearance.use();
	const designPreferences = useMemo(
		() => ({
			isHighAppearance: isHydrated ? persistedIsHighAppearance : true,
		}),
		[isHydrated, persistedIsHighAppearance]
	);

	return (
		<DesignPreferencesProvider value={designPreferences}>
			{children}
		</DesignPreferencesProvider>
	);
}
