'use client';

import { memo, useEffect } from 'react';

import { Button } from '@/design/ui/components';

import { accountStore as store } from '@/stores';

interface IProps {}

function openAccountModal() {
	store.shared.accountModal.isOpen.set(true);
}

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

export const SsoAuthorizeAccountGateButton = memo(
	function SsoAuthorizeAccountGateButton() {
		return (
			<Button color="primary" variant="flat" onPress={openAccountModal}>
				打开账号流程
			</Button>
		);
	}
);
