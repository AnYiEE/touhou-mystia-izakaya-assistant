'use client';

import { useCallback } from 'react';

import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';
import Loading from '@/design/ui/components/loading';

import { AccountPanel } from '@/features/account/client/components/accountManager/accountPanelLayout';
import { accountMessages } from '@/features/account/client/messages';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	cancelGuestAdoption,
	completeGuestAdoption,
} from '@/features/account/client/workspace/lifecycle';
import { workspaceStore } from '@/features/account/client/workspace/workspaceStore';
import { workspaceUiStore } from '@/features/account/client/workspace/workspaceUiStore';

import { useI18n } from '@/shared/i18n/useI18n';

export default function AccountWorkspaceAdoptionPanel() {
	const { t } = useI18n(accountMessages);
	const adoptionStatus = workspaceUiStore.adoptionStatus.use();
	const isSubmitting = adoptionStatus === 'submitting';
	const isFailed = adoptionStatus === 'failed';

	const handleRetry = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		void completeGuestAdoption()
			.then((result) => {
				if (result === 'ready') {
					accountStore.closeAccountModalAfterAuthentication();
				}
			})
			.catch(() => {
				workspaceUiStore.adoptionStatus.set('failed');
				workspaceStore.setError('network');
			});
	}, [isSubmitting]);

	const handleCancel = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		void cancelGuestAdoption().catch(() => {
			workspaceUiStore.adoptionStatus.set('failed');
			workspaceStore.setError('network');
		});
	}, [isSubmitting]);

	return (
		<div className="space-y-4">
			<Heading
				as="h2"
				isFirst
				subTitle={t(
					isFailed
						? 'account.workspace.adoption.failed'
						: 'account.workspace.adoption.description'
				)}
			>
				{t('account.manager.ui.title')}
			</Heading>
			<AccountPanel className="space-y-3">
				{isFailed ? (
					<>
						<Button
							fullWidth
							color="primary"
							variant="flat"
							onPress={handleRetry}
						>
							{t('account.workspace.adoption.retry')}
						</Button>
						<Button
							fullWidth
							variant="light"
							onPress={handleCancel}
						>
							{t('account.workspace.adoption.cancel')}
						</Button>
					</>
				) : (
					<div
						className="flex min-h-24 items-center justify-center"
						role="status"
						aria-live="polite"
					>
						<Loading />
					</div>
				)}
			</AccountPanel>
		</div>
	);
}
