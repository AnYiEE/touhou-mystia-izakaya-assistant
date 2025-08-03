'use client';

import { useMounted } from '@/hooks';

import Content from './content';
import Loading from '@/loading';

export default function Preferences() {
	const isMounted = useMounted();

	if (!isMounted) {
		return <Loading />;
	}

	return <Content />;
}
