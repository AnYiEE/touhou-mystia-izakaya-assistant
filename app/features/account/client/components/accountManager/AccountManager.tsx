'use client';

import {
	faArrowRightFromBracket,
	faDatabase,
	faPowerOff,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo, useCallback, useState } from 'react';

import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';

import { ACCOUNT_SYNC_STATUS_MAP } from '@/domain/account/contracts';

import LegalStatement from '@/features/about/client/components/LegalStatement';
import { getAccountClientErrorMessage } from '@/features/account/client/errorMessage';
import { accountStore } from '@/features/account/client/state/accountStore';
import { PASSWORD_RULE_DESCRIPTION } from '@/features/account/constants';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import {
	CoordinatedModal,
	pushOverlayChild,
	requestOverlayClose,
} from '@/features/overlays/client';
import LocalDataManager from '@/features/preferences/client/dataManagement/LocalDataManager';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import AccountAuthPanel from './AccountAuthPanel';
import AccountDangerZone from './AccountDangerZone';
import AccountPasskeysPanel from './AccountPasskeysPanel';
import AccountProfilePanel, {
	AccountProfileSummary,
} from './AccountProfilePanel';
import AccountSessionsPanel from './AccountSessionsPanel';
import AccountSsoGrantsPanel from './AccountSsoGrantsPanel';
import { type IAccountActionController } from './controller';
import {
	ACCOUNT_MANAGER_STATUS_LABEL_MAP,
	ACCOUNT_MANAGER_SUCCESS_MESSAGE_SET,
	getAccountBootstrapErrorMessage,
} from './copy';
import { AccountPanel, AccountPanelTitle } from './layout';
import { useAccountAuthentication } from './useAccountAuthentication';
import { useAccountDestructiveActions } from './useAccountDestructiveActions';
import { useAccountPasskeys } from './useAccountPasskeys';
import { useAccountProfile } from './useAccountProfile';
import { useAccountSessions } from './useAccountSessions';
import { useAccountSsoGrants } from './useAccountSsoGrants';

interface IProps {}

export default memo<IProps>(function AccountManager() {
	const vibrate = useVibrate();
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const csrfToken = accountStore.shared.csrfToken.use();
	const hasPassword = accountStore.shared.hasPassword.use();
	const lastError = accountStore.shared.sync.lastError.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();
	const sessionInitialData = accountStore.shared.sessionInitialData.use();
	const ssoGrantInitialData = accountStore.shared.ssoGrantInitialData.use();
	const user = accountStore.shared.user.use();
	const webauthnInitialData = accountStore.shared.webauthnInitialData.use();
	const isAccountModalOpen = accountStore.shared.accountModal.isOpen.use();

	const [message, setMessage] = useState<string | null>(null);

	const [isDataManagerModalOpen, setIsDataManagerModalOpen] = useState(false);

	const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleOpenLegalModal = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Open Legal Statement'
		);
		pushOverlayChild({
			childId: 'account.legal',
			onOpenChild: () => {
				setIsLegalModalOpen(true);
			},
			parentId: 'account.main',
		});
	}, []);

	const handleCloseLegalModal = useCallback(() => {
		vibrate();
		setIsLegalModalOpen(false);
		requestOverlayClose('account.legal');
	}, [vibrate]);

	const handleOpenDataManagerModal = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account Button',
			'Open Data Manager'
		);
		pushOverlayChild({
			childId: 'account.data-manager',
			onOpenChild: () => {
				setIsDataManagerModalOpen(true);
			},
			parentId: 'account.main',
		});
	}, [vibrate]);

	const handleCloseDataManagerModal = useCallback(() => {
		vibrate();
		setIsDataManagerModalOpen(false);
		requestOverlayClose('account.data-manager');
	}, [vibrate]);

	const actionController = {
		isSubmitting,
		message,
		setIsSubmitting,
		setMessage,
	} satisfies IAccountActionController;
	const passkeyController = useAccountPasskeys({
		controller: actionController,
		csrfToken,
		passwordMustChange,
		user,
		vibrate,
		webauthnInitialData,
	});
	const authentication = useAccountAuthentication({
		bootstrapStatus,
		controller: actionController,
		isAccountModalOpen,
		passkeyCapabilities: passkeyController,
		user,
		vibrate,
	});
	const profileController = useAccountProfile({
		controller: actionController,
		csrfToken,
		hasPassword,
		passwordMustChange,
		signalCurrentWebAuthnUserDetails:
			passkeyController.signalCurrentWebAuthnUserDetails,
		user,
		vibrate,
	});
	const sessionsController = useAccountSessions({
		bootstrapStatus,
		controller: actionController,
		csrfToken,
		passwordMustChange,
		sessionInitialData,
		user,
		vibrate,
	});
	const ssoGrantsController = useAccountSsoGrants({
		bootstrapStatus,
		controller: actionController,
		csrfToken,
		passwordMustChange,
		sessionListUpdatedAtRef: sessionsController.sessionListUpdatedAtRef,
		setAccountSessions: sessionsController.setAccountSessions,
		setAccountSessionsUserId: sessionsController.setAccountSessionsUserId,
		ssoGrantInitialData,
		user,
		vibrate,
	});
	const destructiveActions = useAccountDestructiveActions({
		controller: actionController,
		csrfToken,
		user,
		vibrate,
	});
	const {
		accountManagerRootRef,
		authMode,
		isSsoContext,
		shouldHideAfterSsoAuth,
	} = authentication;
	const { passwordChangeError, profileError } = profileController;
	const { passkeys, passkeysUserId } = passkeyController;
	const { accountSessions, accountSessionsUserId } = sessionsController;
	const { ssoGrants, ssoGrantsUserId } = ssoGrantsController;
	const { handleLogout, handleLogoutAll } = destructiveActions;

	if (bootstrapStatus === 'error') {
		return (
			<div className="space-y-4">
				<Heading as="h2" isFirst>
					账号
				</Heading>
				<p className="text-small leading-5 text-danger-600 dark:text-danger">
					{getAccountBootstrapErrorMessage(lastError)}
				</p>
			</div>
		);
	}

	if (bootstrapStatus !== 'anonymous' && bootstrapStatus !== 'loggedIn') {
		return null;
	}

	if (shouldHideAfterSsoAuth) {
		return null;
	}

	const isMessageSuccess =
		message !== null && ACCOUNT_MANAGER_SUCCESS_MESSAGE_SET.has(message);
	const messageText =
		message === null ? null : getAccountClientErrorMessage(message);
	const authErrorMessage =
		user === null && messageText !== null && !isMessageSuccess
			? messageText
			: null;
	const registrationNicknameErrorMessage =
		authMode === 'register' && message === 'invalid-nickname'
			? authErrorMessage
			: null;
	const authCredentialErrorMessage =
		registrationNicknameErrorMessage === null ? authErrorMessage : null;
	const accountStatusMessage =
		messageText !== null && authErrorMessage === null ? messageText : null;
	const isAccountSyncPaused =
		user?.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty;
	const accountStatusDescription = isAccountSyncPaused
		? ACCOUNT_MANAGER_STATUS_LABEL_MAP.paused
		: (accountStatusMessage ?? ACCOUNT_MANAGER_STATUS_LABEL_MAP.connected);
	const passwordDescription =
		authCredentialErrorMessage === null
			? authMode === 'register'
				? PASSWORD_RULE_DESCRIPTION
				: '使用账号密码登录'
			: undefined;
	const passwordChangeErrorMessage =
		passwordChangeError === null
			? null
			: getAccountClientErrorMessage(passwordChangeError);
	const profileErrorMessage =
		profileError === null
			? null
			: getAccountClientErrorMessage(profileError);
	const profileNicknameErrorMessage =
		profileError === 'invalid-nickname' ? profileErrorMessage : null;
	const profileUsernameErrorMessage =
		profileError !== null &&
		profileError !== 'invalid-nickname' &&
		profileError !== 'invalid-password'
			? profileErrorMessage
			: null;
	const profileCurrentPasswordErrorMessage =
		profileError === 'invalid-password' ? profileErrorMessage : null;
	const visibleSsoGrants = user?.id === ssoGrantsUserId ? ssoGrants : [];
	const isSsoGrantsReady = user !== null && ssoGrantsUserId === user.id;
	const visibleAccountSessions =
		user?.id === accountSessionsUserId ? accountSessions : [];
	const isAccountSessionsReady =
		user !== null && accountSessionsUserId === user.id;
	const visiblePasskeys = user?.id === passkeysUserId ? passkeys : [];
	const isPasskeyListReady = user !== null && passkeysUserId === user.id;

	return (
		<section
			ref={accountManagerRootRef}
			aria-label={user === null ? '账号登录' : '账号管理'}
			tabIndex={-1}
			className="space-y-4 rounded-small p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
		>
			<Heading
				as="h2"
				isFirst
				subTitle={
					user === null
						? isSsoContext
							? '登录小助手账号以授权给外部应用'
							: '登录后可在不同设备间同步此浏览器保存的数据'
						: '管理当前账号、同步状态和云端数据'
				}
				classNames={{ subTitle: '!-mt-3' }}
			>
				{isSsoContext && user === null ? 'SSO登录' : '账号'}
			</Heading>
			{user === null ? (
				<AccountAuthPanel
					{...authentication}
					authCredentialErrorMessage={authCredentialErrorMessage}
					handleOpenLegalModal={handleOpenLegalModal}
					isSubmitting={isSubmitting}
					passwordDescription={passwordDescription}
					registrationNicknameErrorMessage={
						registrationNicknameErrorMessage
					}
				/>
			) : (
				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<div className="space-y-4">
						<AccountProfileSummary
							accountStatusDescription={accountStatusDescription}
							accountStatusMessage={accountStatusMessage}
							isAccountSyncPaused={isAccountSyncPaused}
							isMessageSuccess={isMessageSuccess}
							passwordMustChange={passwordMustChange}
							user={user}
						/>
						{!passwordMustChange && (
							<AccountPasskeysPanel
								{...passkeyController}
								isPasskeyListReady={isPasskeyListReady}
								isSubmitting={isSubmitting}
								visiblePasskeys={visiblePasskeys}
							/>
						)}
						<AccountProfilePanel
							{...profileController}
							csrfToken={csrfToken}
							isSubmitting={isSubmitting}
							passwordChangeErrorMessage={
								passwordChangeErrorMessage
							}
							passwordMustChange={passwordMustChange}
							profileCurrentPasswordErrorMessage={
								profileCurrentPasswordErrorMessage
							}
							profileNicknameErrorMessage={
								profileNicknameErrorMessage
							}
							profileUsernameErrorMessage={
								profileUsernameErrorMessage
							}
						/>
					</div>
					{!passwordMustChange && (
						<AccountPanel className="space-y-4">
							<div>
								<AccountPanelTitle icon={faDatabase}>
									数据与会话
								</AccountPanelTitle>
								<div className="flex flex-col gap-2">
									<Button
										fullWidth
										className="justify-start"
										isDisabled={isSubmitting}
										startContent={
											<FontAwesomeIcon
												icon={faDatabase}
												className="w-4"
											/>
										}
										variant="flat"
										onPress={handleOpenDataManagerModal}
									>
										数据管理
									</Button>
									<Button
										fullWidth
										className="justify-start"
										isDisabled={
											isSubmitting || csrfToken === null
										}
										isLoading={isSubmitting}
										startContent={
											isSubmitting ? null : (
												<FontAwesomeIcon
													icon={
														faArrowRightFromBracket
													}
													className="w-4"
												/>
											)
										}
										variant="flat"
										onPress={handleLogout}
									>
										退出登录
									</Button>
									<Button
										fullWidth
										className="justify-start"
										isDisabled={
											isSubmitting || csrfToken === null
										}
										isLoading={isSubmitting}
										startContent={
											isSubmitting ? null : (
												<FontAwesomeIcon
													icon={faPowerOff}
													className="w-4"
												/>
											)
										}
										variant="flat"
										onPress={handleLogoutAll}
									>
										退出全部设备
									</Button>
								</div>
								<AccountSessionsPanel
									{...sessionsController}
									isAccountSessionsReady={
										isAccountSessionsReady
									}
									isSubmitting={isSubmitting}
									visibleAccountSessions={
										visibleAccountSessions
									}
								/>
								<AccountSsoGrantsPanel
									{...ssoGrantsController}
									csrfToken={csrfToken}
									isSsoGrantsReady={isSsoGrantsReady}
									isSubmitting={isSubmitting}
									visibleSsoGrants={visibleSsoGrants}
								/>
							</div>
							<AccountDangerZone
								{...destructiveActions}
								csrfToken={csrfToken}
								isSubmitting={isSubmitting}
								user={user}
							/>
						</AccountPanel>
					)}
				</div>
			)}
			<CoordinatedModal
				coordination={{ id: 'account.data-manager' }}
				isOpen={isDataManagerModalOpen}
				size="2xl"
				onClose={handleCloseDataManagerModal}
			>
				<div className="space-y-4">
					<Heading as="h2" isFirst>
						数据管理
					</Heading>
					<LocalDataManager isFullWidth />
				</div>
			</CoordinatedModal>
			<CoordinatedModal
				coordination={{ id: 'account.legal' }}
				isOpen={isLegalModalOpen}
				size="2xl"
				onClose={handleCloseLegalModal}
			>
				<LegalStatement />
			</CoordinatedModal>
		</section>
	);
});
