'use client';

import Loading from '@/design/ui/components/loading';

import { useCatalogLocalizationReady } from '@/features/catalog/shared/client/localization/useCatalogLocalizationReady';

import { useHydrated } from '@/shared/react/useHydrated';

import Content from './PreferencesContent';

export default function Preferences() {
	const isLocalizationReady = useCatalogLocalizationReady();
	const isMounted = useHydrated();

	if (!isMounted || !isLocalizationReady) {
		return <Loading />;
	}

	return <Content />;
}
