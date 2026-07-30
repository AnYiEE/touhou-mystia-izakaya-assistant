'use client';

import { memo, useCallback, useEffect } from 'react';

import Button from '@/design/ui/components/button';

import { accountStore } from '@/features/account/client/state/accountStore';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useVibrate } from '@/features/preferences/client/useVibrate';

interface IProps {}

export default memo<IProps>(function SsoAuthorizeAccountGate() {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const isLoggedIn = accountStore.shared.isLoggedIn.use();

	useEffect(() => {
		if (
			bootstrapStatus === 'anonymous' &&
			!isLoggedIn &&
			!accountStore.shared.accountModal.isOpen.get()
		) {
			const result = accountStore.openAccountModal();
			if (result.status === 'activated') {
				trackEvent(
					trackEvent.category.show,
					'Modal',
					'Account From SSO Authorize'
				);
			}
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
			accountStore.openAccountModal();
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
