'use client';

import { memo, useCallback, useEffect } from 'react';

import { useVibrate } from '@/hooks';

import { Button } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';

import { accountStore as store } from '@/stores';

interface IProps {}

export default memo<IProps>(function SsoAuthorizeAccountGate() {
	const bootstrapStatus = store.shared.bootstrapStatus.use();
	const isLoggedIn = store.shared.isLoggedIn.use();

	useEffect(() => {
		if (
			bootstrapStatus === 'anonymous' &&
			!isLoggedIn &&
			!store.shared.accountModal.isOpen.get()
		) {
			trackEvent(
				trackEvent.category.show,
				'Modal',
				'Account From SSO Authorize'
			);
			store.shared.accountModal.isOpen.set(true);
		}
	}, [bootstrapStatus, isLoggedIn]);

	return null;
});

export const SsoAuthorizeAccountGateButton = memo(
	function SsoAuthorizeAccountGateButton() {
		const vibrate = useVibrate();

		const handleOpenAccountModal = useCallback(() => {
			vibrate();
			trackEvent(
				trackEvent.category.click,
				'Account Button',
				'Open Modal From SSO Authorize'
			);
			store.shared.accountModal.isOpen.set(true);
		}, [vibrate]);

		return (
			<Button
				color="primary"
				variant="flat"
				onPress={handleOpenAccountModal}
			>
				打开账号流程
			</Button>
		);
	}
);
