'use client';

import {
	faArrowRightFromBracket,
	faCheck,
	faKey,
	faShieldHalved,
	faTriangleExclamation,
	faUser,
} from '@fortawesome/free-solid-svg-icons';
import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { usePathname } from 'next/navigation';
import {
	type PropsWithChildren,
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Card from '@/design/ui/components/card';
import Heading from '@/design/ui/components/heading';
import Input from '@/design/ui/components/input';

import { publishAccountRuntimeInvalidation } from '@/features/account/client/accountRuntimeInvalidation';
import { changeAccountPassword } from '@/features/account/client/api';
import { ACCOUNT_CLIENT_MESSAGE_KEYS } from '@/features/account/client/copy';
import { getAccountClientErrorMessage } from '@/features/account/client/errorMessage';
import { accountMessages } from '@/features/account/client/messages';
import {
	checkCurrentAccountAuthContext,
	refreshAccountState,
	refreshAccountStateFromInvalidation,
} from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	accountWorkspacePendingAuthStore,
	checkCurrentAccountWorkspacePendingAuth,
} from '@/features/account/client/workspace/authRuntime';
import {
	cancelPasswordRequiredLogin,
	completeAccountAuthenticationSuccess,
	executeAccountLogoutWorkspace,
	reconcileAccountWorkspace,
} from '@/features/account/client/workspace/lifecycle';
import {
	captureAccountWorkspace,
	workspaceStore,
} from '@/features/account/client/workspace/workspaceStore';
import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	checkPasswordPolicy,
} from '@/features/account/constants';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { CoordinatedModal } from '@/features/overlays/client';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import { createRecommendationBridgeContinuationUrl } from '@/features/recommendations/client/bridge/launchDescriptor';

import { createMainSiteUrl } from '@/infrastructure/http/siteUrl';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { useI18n } from '@/shared/i18n/useI18n';

import {
	handleUnauthorizedAccountActionError,
	handleUnauthorizedAccountError,
} from './accountManager/controller';
import { ACCOUNT_MODAL_CLASS_NAMES } from './accountModalSpacing';

const ACCOUNT_PASSWORD_MODAL_COORDINATION = {
	id: 'account.password-required',
	requestOwnership: 'external',
} as const;
const ACCOUNT_PASSWORD_MODAL_HEADING_CLASS_NAMES = {
	subTitle: '!-mt-3',
} as const;

interface IPasswordChangePanelProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

const PasswordChangePanel = memo<IPasswordChangePanelProps>(
	function PasswordChangePanel({ children, className }) {
		const { isHighAppearance } = useDesignPreferences();

		const classNames = useMemo(
			() => ({
				base: cn('p-4', className, {
					'bg-content1/40 backdrop-blur': isHighAppearance,
				}),
			}),
			[className, isHighAppearance]
		);

		return (
			<Card as="section" fullWidth shadow="sm" classNames={classNames}>
				{children}
			</Card>
		);
	}
);

interface IPasswordChangePanelTitleProps {
	children: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
	iconClassName?: string;
}

const PasswordChangePanelTitle = memo<IPasswordChangePanelTitleProps>(
	function PasswordChangePanelTitle({ children, icon, iconClassName }) {
		return (
			<div className="mb-3 flex items-center gap-2 text-small font-medium text-foreground-700">
				<FontAwesomeIcon
					icon={icon}
					className={cn('w-4 text-primary-600', iconClassName)}
				/>
				<span>{children}</span>
			</div>
		);
	}
);

interface IPasswordChangeInputIconProps {
	icon: FontAwesomeIconProps['icon'];
}

const PasswordChangeInputIcon = memo<IPasswordChangeInputIconProps>(
	function PasswordChangeInputIcon({ icon }) {
		return (
			<span className="pointer-events-none inline-flex -translate-y-px items-center text-default-400">
				<FontAwesomeIcon icon={icon} className="block w-3.5" />
			</span>
		);
	}
);

interface IProps {}

export default memo<IProps>(function AccountPasswordMustChangeModal() {
	const { locale, t } = useI18n(accountMessages);
	const pathname = usePathname();
	const vibrate = useVibrate();

	const csrfToken = accountStore.shared.csrfToken.use();
	const isLoggedIn = accountStore.shared.isLoggedIn.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();
	const user = accountStore.shared.user.use();
	const pendingAuth = accountWorkspacePendingAuthStore.value.use();
	const workspacePhase = workspaceStore.phase.use();
	const isStaging =
		workspacePhase === 'password-required' &&
		pendingAuth?.reason === 'password-required' &&
		pendingAuth.passwordMustChange;
	const effectiveCsrfToken = isStaging ? pendingAuth.csrfToken : csrfToken;
	const effectiveUser = isStaging ? pendingAuth.user : user;

	const [currentPassword, setCurrentPassword] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [newPassword, setNewPassword] = useState('');
	const [passwordChangeError, setPasswordChangeError] = useState<
		string | null
	>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isOpen =
		isStaging ||
		((workspacePhase === 'ready' ||
			workspacePhase === 'password-required') &&
			isLoggedIn &&
			passwordMustChange);
	const checkCurrentAuthContext = useCallback(
		(context: {
			expectedCsrfToken?: string | null;
			expectedUserId?: string | null;
		}) => {
			if (
				isStaging &&
				checkCurrentAccountWorkspacePendingAuth(pendingAuth)
			) {
				return (
					(context.expectedCsrfToken === undefined ||
						context.expectedCsrfToken === pendingAuth.csrfToken) &&
					(context.expectedUserId === undefined ||
						context.expectedUserId === pendingAuth.user.id)
				);
			}
			return checkCurrentAccountAuthContext(context);
		},
		[isStaging, pendingAuth]
	);
	const isNewPasswordInvalid =
		newPassword.length > 0 && !checkPasswordPolicy(newPassword);
	const shouldResumeSso = pathname === '/sso/authorize';

	useEffect(() => {
		if (isOpen) {
			trackEvent(
				trackEvent.category.show,
				'Modal',
				'Account Password Must Change'
			);
		}
	}, [isOpen]);

	const clearPasswordFields = useCallback(() => {
		setCurrentPassword('');
		setNewPassword('');
		setPasswordChangeError(null);
	}, []);

	const handleCurrentPasswordChange = useCallback((value: string) => {
		setCurrentPassword(value);
		setPasswordChangeError(null);
	}, []);

	const handlePasswordChange = useCallback(() => {
		if (
			isSubmitting ||
			effectiveCsrfToken === null ||
			effectiveUser === null
		) {
			return;
		}

		vibrate();

		trackEvent(
			trackEvent.category.click,
			'Account Password Button',
			'Force Change'
		);

		if (!checkPasswordPolicy(newPassword)) {
			setPasswordChangeError(null);
			setMessage('invalid-password-rule');
			return;
		}

		setIsSubmitting(true);
		setMessage(null);
		setPasswordChangeError(null);

		const expectedAuthContext = {
			expectedCsrfToken: effectiveCsrfToken,
			expectedUserId: effectiveUser.id,
		};

		void changeAccountPassword(
			{ current_password: currentPassword, new_password: newPassword },
			effectiveCsrfToken
		)
			.then(async (result) => {
				if (result.status === 'error') {
					if (result.message === 'credential-changed') {
						setMessage(result.message);
						void publishAccountRuntimeInvalidation({
							reason: 'credential-changed',
							stateEpoch: effectiveUser.state_epoch,
							userId: effectiveUser.id,
						});
						void refreshAccountStateFromInvalidation().catch(
							(error: unknown) => {
								if (
									handleUnauthorizedAccountError(
										error,
										expectedAuthContext
									) ||
									!checkCurrentAuthContext(
										expectedAuthContext
									)
								) {
									return;
								}
								setMessage(
									getAccountClientErrorMessage(
										Error.isError(error)
											? error.message
											: '',
										locale,
										t(
											ACCOUNT_CLIENT_MESSAGE_KEYS.accountStateRefreshFailed
										)
									)
								);
							}
						);
						return;
					}
					if (
						result.httpStatus === 401 &&
						result.message !== 'invalid-password'
					) {
						await reconcileAccountWorkspace({
							authOutcome: { kind: 'session-expired' },
							source: 'runtime-invalidation',
						});
						clearPasswordFields();
						return;
					}
					if (
						handleUnauthorizedAccountActionError(
							result,
							expectedAuthContext
						)
					) {
						return;
					}
					if (!checkCurrentAuthContext(expectedAuthContext)) {
						return;
					}
					if (result.message === 'invalid-password') {
						setPasswordChangeError(result.message);
						setMessage(null);
						return;
					}

					setMessage(result.message);
					return;
				}

				const { data } = result;
				const completion = await completeAccountAuthenticationSuccess(
					data,
					expectedAuthContext
				);
				if (completion === 'stale') {
					return;
				}

				clearPasswordFields();
				setMessage(null);
				if (completion !== 'ready') {
					return;
				}

				void publishAccountRuntimeInvalidation({
					reason: 'password-changed',
					stateEpoch: data.user.state_epoch,
					userId: data.user.id,
				});

				if (shouldResumeSso) {
					location.assign(
						createRecommendationBridgeContinuationUrl(
							createMainSiteUrl('/sso/authorize').toString()
						)
					);
					return;
				}

				refreshAccountState().catch((error: unknown) => {
					console.warn(
						'Account state refresh failed after successful password change.',
						{ errorCode: getLogSafeErrorCode(error) }
					);
				});
			})
			.catch((error: unknown) => {
				setMessage(
					Error.isError(error)
						? error.message
						: 'password-change-failed'
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [
		checkCurrentAuthContext,
		clearPasswordFields,
		effectiveCsrfToken,
		effectiveUser,
		currentPassword,
		isSubmitting,
		locale,
		newPassword,
		shouldResumeSso,
		t,
		vibrate,
	]);

	const handlePasswordChangeSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			handlePasswordChange();
		},
		[handlePasswordChange]
	);

	const handleLogout = useCallback(() => {
		if (isStaging) {
			if (isSubmitting) {
				return;
			}
			setIsSubmitting(true);
			setMessage(null);
			void cancelPasswordRequiredLogin()
				.then((result) => {
					if (result !== 'guest' && result !== 'locked') {
						setMessage('account-logout-failed');
					}
				})
				.catch(() => {
					setMessage('account-logout-failed');
				})
				.finally(() => {
					setIsSubmitting(false);
				});
			return;
		}

		if (isSubmitting || user === null) {
			return;
		}

		vibrate();

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Force Logout'
		);

		setIsSubmitting(true);
		setMessage(null);

		void executeAccountLogoutWorkspace({
			action: 'current',
			discardUnsyncedChanges: true,
			expected: captureAccountWorkspace(),
		})
			.then((completion) => {
				if (completion === 'guest') {
					clearPasswordFields();
					return;
				}
				if (typeof completion === 'object') {
					setMessage(completion.message);
					return;
				}
				if (
					completion !== 'locked' &&
					completion !== 'account-mismatch'
				) {
					setMessage('account-logout-failed');
				}
			})
			.catch((error: unknown) => {
				setMessage(
					Error.isError(error)
						? error.message
						: 'account-logout-failed'
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [clearPasswordFields, isSubmitting, isStaging, user, vibrate]);

	if (!isOpen) {
		return (
			<CoordinatedModal
				aria-label={t('account.manager.passwordChange.aria')}
				coordination={ACCOUNT_PASSWORD_MODAL_COORDINATION}
				isOpen={false}
			>
				<div />
			</CoordinatedModal>
		);
	}

	const messageText =
		message === null ? null : getAccountClientErrorMessage(message, locale);
	const passwordChangeErrorMessage =
		passwordChangeError === null
			? null
			: getAccountClientErrorMessage(passwordChangeError, locale);
	const isPasswordReady =
		effectiveCsrfToken !== null &&
		currentPassword.length > 0 &&
		newPassword.length > 0 &&
		!isNewPasswordInvalid;

	return (
		<CoordinatedModal
			aria-label={
				shouldResumeSso
					? t('account.manager.passwordChange.titleSso')
					: t('account.manager.passwordChange.aria')
			}
			coordination={ACCOUNT_PASSWORD_MODAL_COORDINATION}
			hideCloseButton
			isKeyboardDismissDisabled
			isOpen
			isDismissable={false}
			classNames={ACCOUNT_MODAL_CLASS_NAMES}
		>
			<div className="space-y-4 px-1.5">
				<Heading
					as="h2"
					isFirst
					subTitle={
						shouldResumeSso
							? t('account.manager.passwordChange.subtitleSso')
							: t(
									'account.manager.passwordChange.subtitleAccount'
								)
					}
					classNames={ACCOUNT_PASSWORD_MODAL_HEADING_CLASS_NAMES}
				>
					{shouldResumeSso
						? t('account.manager.passwordChange.titleSso')
						: t('account.manager.passwordChange.aria')}
				</Heading>

				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<div className="space-y-4">
						<PasswordChangePanel>
							<PasswordChangePanelTitle icon={faUser}>
								{t(
									'account.manager.passwordChange.currentAccount'
								)}
							</PasswordChangePanelTitle>
							<div className="flex flex-wrap items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/15 text-danger-600 dark:text-danger">
									<FontAwesomeIcon
										icon={faUser}
										className="w-4"
									/>
								</div>
								<div className="min-w-0 space-y-1">
									<p className="truncate text-base font-medium leading-none">
										{effectiveUser?.username ??
											t(
												'account.manager.passwordChange.currentAccount'
											)}
									</p>
									<p className="truncate text-tiny text-danger-600 dark:text-danger">
										{t(
											'account.manager.passwordChange.badge'
										)}
									</p>
								</div>
							</div>
						</PasswordChangePanel>

						<PasswordChangePanel>
							<PasswordChangePanelTitle icon={faKey}>
								{t('account.manager.passwordChange.setupTitle')}
							</PasswordChangePanelTitle>
							<form
								className="space-y-3"
								onSubmit={handlePasswordChangeSubmit}
							>
								<input
									readOnly
									aria-label={t(
										'account.manager.passwordChange.usernameAria'
									)}
									autoComplete="username"
									className="sr-only"
									name="username"
									tabIndex={-1}
									type="text"
									value={effectiveUser?.username ?? ''}
								/>
								<Input
									autoComplete="current-password"
									errorMessage={
										passwordChangeErrorMessage ?? undefined
									}
									isInvalid={
										passwordChangeErrorMessage !== null
									}
									label={t(
										'account.manager.passwordChange.currentPasswordLabel'
									)}
									placeholder={t(
										'account.manager.passwordChange.currentPasswordPlaceholder'
									)}
									startContent={
										<PasswordChangeInputIcon
											icon={faShieldHalved}
										/>
									}
									type="password"
									value={currentPassword}
									onValueChange={handleCurrentPasswordChange}
								/>
								<Input
									autoComplete="new-password"
									description={t('account.passwordRule', {
										max: PASSWORD_MAX_LENGTH,
										min: PASSWORD_MIN_LENGTH,
									})}
									errorMessage={
										isNewPasswordInvalid
											? t('account.passwordRule', {
													max: PASSWORD_MAX_LENGTH,
													min: PASSWORD_MIN_LENGTH,
												})
											: undefined
									}
									isInvalid={isNewPasswordInvalid}
									label={t(
										'account.manager.field.newPassword'
									)}
									placeholder={t(
										'account.manager.passwordChange.newPasswordPlaceholder'
									)}
									startContent={
										<PasswordChangeInputIcon icon={faKey} />
									}
									type="password"
									value={newPassword}
									onValueChange={setNewPassword}
								/>
								{messageText !== null && (
									<p
										aria-live="assertive"
										className="rounded-small bg-danger/10 px-3 py-2 text-small text-danger-700 dark:text-danger"
										role="alert"
									>
										{messageText}
									</p>
								)}
								<Button
									fullWidth
									color="danger"
									isDisabled={
										isSubmitting || !isPasswordReady
									}
									isLoading={isSubmitting}
									startContent={
										isSubmitting ? null : (
											<FontAwesomeIcon
												icon={faCheck}
												className="w-4"
											/>
										)
									}
									type="submit"
									variant="flat"
								>
									{t(
										'account.manager.passwordChange.updateAndContinue'
									)}
								</Button>
							</form>
						</PasswordChangePanel>
					</div>

					<PasswordChangePanel className="space-y-4">
						<div>
							<PasswordChangePanelTitle
								icon={faShieldHalved}
								iconClassName="text-default-500"
							>
								{shouldResumeSso
									? t(
											'account.manager.passwordChange.restrictedTitleSso'
										)
									: t(
											'account.manager.passwordChange.restrictedTitle'
										)}
							</PasswordChangePanelTitle>
							<div className="space-y-3 text-small leading-6 text-foreground-600">
								<div className="flex items-start gap-2 rounded-small bg-warning/10 px-3 py-2 text-warning-700 dark:text-warning-600">
									<FontAwesomeIcon
										icon={faTriangleExclamation}
										className="mt-1 w-4 shrink-0"
									/>
									<p>
										{shouldResumeSso
											? t(
													ACCOUNT_CLIENT_MESSAGE_KEYS.passwordMustChangeAuthorizePaused
												)
											: t(
													ACCOUNT_CLIENT_MESSAGE_KEYS.passwordMustChangeAccountPaused
												)}
									</p>
								</div>
								<p>
									{shouldResumeSso
										? t(
												ACCOUNT_CLIENT_MESSAGE_KEYS.passwordMustChangeLogoutAuthorize
											)
										: t(
												ACCOUNT_CLIENT_MESSAGE_KEYS.passwordMustChangeLogoutAccount
											)}
								</p>
							</div>
						</div>
						<Button
							fullWidth
							className="justify-start"
							isDisabled={isSubmitting}
							isLoading={isSubmitting}
							startContent={
								isSubmitting ? null : (
									<FontAwesomeIcon
										icon={faArrowRightFromBracket}
										className="w-4"
									/>
								)
							}
							variant="flat"
							onPress={handleLogout}
						>
							{shouldResumeSso
								? t(
										'account.manager.passwordChange.switchAccount'
									)
								: t('account.manager.ui.logout')}
						</Button>
					</PasswordChangePanel>
				</div>
			</div>
		</CoordinatedModal>
	);
});
