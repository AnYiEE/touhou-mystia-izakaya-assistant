'use client';

import { memo, useCallback, useEffect } from 'react';

import Button from '@/design/ui/components/button';

import { accountMessages } from '@/features/account/client/messages';
import { accountStore } from '@/features/account/client/state/accountStore';
import { workspaceStore } from '@/features/account/client/workspace/workspaceStore';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {}

export default memo<IProps>(function SsoAuthorizeAccountGate() {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const isLoggedIn = accountStore.shared.isLoggedIn.use();
	const blocker = workspaceStore.blocker.use();
	const isAuthReconciled = workspaceStore.isAuthReconciled.use();
	const isReady = workspaceStore.isReady.use();
	const phase = workspaceStore.phase.use();
	const canOpenAccountFlow =
		isAuthReconciled && isReady && phase === 'ready' && blocker === null;

	useEffect(() => {
		if (
			bootstrapStatus === 'anonymous' &&
			!isLoggedIn &&
			canOpenAccountFlow &&
			!accountStore.shared.accountModal.isOpen.get()
		) {
			const result = accountStore.openAccountModal(
				undefined,
				'required-account'
			);
			if (result.status === 'activated') {
				trackEvent(
					trackEvent.category.show,
					'Modal',
					'Account From SSO Authorize'
				);
			}
		}
	}, [bootstrapStatus, canOpenAccountFlow, isLoggedIn]);

	return null;
});

export const SsoAuthorizeAccountGateButton = memo(
	function SsoAuthorizeAccountGateButton() {
		const { t } = useI18n(accountMessages);
		const vibrate = useVibrate();
		const blocker = workspaceStore.blocker.use();
		const isAuthReconciled = workspaceStore.isAuthReconciled.use();
		const isReady = workspaceStore.isReady.use();
		const phase = workspaceStore.phase.use();
		const canOpenAccountFlow =
			isAuthReconciled &&
			isReady &&
			phase === 'ready' &&
			blocker === null;

		const handleOpenAccountModal = useCallback(() => {
			if (!canOpenAccountFlow) {
				return;
			}
			vibrate();
			trackEvent(
				trackEvent.category.click,
				'Account Button',
				'Open Modal From SSO Authorize'
			);
			accountStore.openAccountModal(undefined, 'required-account');
		}, [canOpenAccountFlow, vibrate]);

		return (
			<Button
				color="primary"
				isDisabled={!canOpenAccountFlow}
				variant="flat"
				onClick={handleOpenAccountModal}
			>
				{t('account.sso.openAccountFlow')}
			</Button>
		);
	}
);
