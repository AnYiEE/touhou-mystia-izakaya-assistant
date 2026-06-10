'use client';

import { memo, useEffect } from 'react';

import { accountStore as store } from '@/stores';

interface IProps {}

export default memo<IProps>(function SsoAuthorizeAccountGate() {
	const bootstrapStatus = store.shared.bootstrapStatus.use();
	const isLoggedIn = store.shared.isLoggedIn.use();

	useEffect(() => {
		if (bootstrapStatus === 'anonymous' && !isLoggedIn) {
			store.shared.accountModal.isOpen.set(true);
		}
	}, [bootstrapStatus, isLoggedIn]);

	return null;
});
