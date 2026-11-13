'use client';

import { useEffect } from 'react';

import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';
import Loading from '@/design/ui/components/loading';
import Placeholder from '@/design/ui/components/placeholder';

import AccountWorkspaceAdoptionPanel from '@/features/account/client/components/AccountWorkspaceAdoptionPanel';
import { logoutRecoveryStore } from '@/features/account/client/components/accountManager/logoutRecoveryStore';
import { accountMessages } from '@/features/account/client/messages';
import { accountStore } from '@/features/account/client/state/accountStore';
import { accountWorkspacePendingAuthStore } from '@/features/account/client/workspace/authRuntime';
import { type TInitialAccountWorkspaceAuth } from '@/features/account/client/workspace/contracts';
import { retryAccountWorkspaceLifecycle } from '@/features/account/client/workspace/lifecycle';
import { releaseWorkspacePendingAttribute } from '@/features/account/client/workspace/readinessGate';
import {
	checkInitialWorkspaceAuthCompatible,
	workspaceStore,
} from '@/features/account/client/workspace/workspaceStore';

import { useI18n } from '@/shared/i18n/useI18n';

export default function AccountWorkspaceReadiness({
	initialAuth,
}: {
	initialAuth: TInitialAccountWorkspaceAuth;
}) {
	const { t } = useI18n(accountMessages);
	const blocker = workspaceStore.blocker.use();
	const error = workspaceStore.error.use();
	const isInitialized = workspaceStore.isInitialized.use();
	const isAuthReconciled = workspaceStore.isAuthReconciled.use();
	const isReady = workspaceStore.isReady.use();
	const owner = workspaceStore.owner.use();
	const phase = workspaceStore.phase.use();
	const transitionStatus = workspaceStore.transitionStatus.use();
	const pendingAuth = accountWorkspacePendingAuthStore.value.use();
	const isAccountModalOpen = accountStore.shared.accountModal.isOpen.use();
	const logoutRecoveryOperation = logoutRecoveryStore.operation.use();
	const canShowInitialAuth =
		isAuthReconciled ||
		checkInitialWorkspaceAuthCompatible(owner, initialAuth);
	const canRevealWorkspace =
		isReady && isAuthReconciled && canShowInitialAuth;

	useEffect(() => {
		releaseWorkspacePendingAttribute(
			isAuthReconciled && canShowInitialAuth
		);
	}, [
		canShowInitialAuth,
		isAuthReconciled,
		isReady,
		owner,
		transitionStatus,
	]);

	if (blocker !== null || canRevealWorkspace) {
		return null;
	}
	if (logoutRecoveryOperation !== null) {
		return null;
	}
	const isGuestAdoptionPending =
		phase === 'transitioning' && pendingAuth?.reason === 'guest-adoption';
	if (isGuestAdoptionPending) {
		if (isAccountModalOpen) {
			return null;
		}
		return (
			<div
				data-workspace-readiness
				className="flex min-h-main-content w-full items-center justify-center"
			>
				<div className="w-full max-w-2xl">
					<AccountWorkspaceAdoptionPanel />
				</div>
			</div>
		);
	}

	const shouldShow =
		!canShowInitialAuth ||
		!isInitialized ||
		owner === null ||
		error !== null ||
		transitionStatus === 'prepared' ||
		transitionStatus === 'owner-committed';
	if (!shouldShow) {
		return null;
	}

	if (error === null) {
		return (
			<div
				data-workspace-readiness
				className="flex min-h-main-content w-full items-center justify-center"
				role="status"
				aria-live="polite"
			>
				<Loading />
			</div>
		);
	}

	const errorKey =
		error === 'future'
			? 'account.workspace.readiness.future'
			: error === 'invalid'
				? 'account.workspace.readiness.invalid'
				: 'account.workspace.readiness.network';

	return (
		<div
			data-workspace-readiness
			className="flex min-h-main-content w-full items-center justify-center"
			role="alert"
		>
			<Placeholder className="max-w-md gap-4">
				<Heading as="h1" isFirst className="mb-0">
					{t('account.manager.ui.title')}
				</Heading>
				<p className="font-normal text-foreground-600">{t(errorKey)}</p>
				{error === 'network' && (
					<Button
						color="primary"
						variant="flat"
						onPress={() => {
							void retryAccountWorkspaceLifecycle();
						}}
					>
						{t('account.workspace.readiness.retry')}
					</Button>
				)}
			</Placeholder>
		</div>
	);
}
