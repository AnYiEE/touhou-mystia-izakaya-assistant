'use client';

import {memo} from 'react';

import {useMounted} from '@/hooks';

import Content from './content';
import Loading from '@/loading';

export default memo(function Preferences() {
	const isMounted = useMounted();

	if (!isMounted) {
		return <Loading />;
	}

	return <Content />;
});
