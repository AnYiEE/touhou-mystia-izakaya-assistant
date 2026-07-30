'use client';

import Loading from '@/design/ui/components/loading';

import { useHydrated } from '@/shared/react/useHydrated';

import Content from './PreferencesContent';

export default function Preferences() {
	const isMounted = useHydrated();

	if (!isMounted) {
		return <Loading />;
	}

	return <Content />;
}
