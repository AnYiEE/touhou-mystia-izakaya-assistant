'use client';

import {
	type PropsWithChildren,
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useState,
} from 'react';

import { usePathname } from 'next/navigation';
import { useVibrate } from '@/hooks';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import {
	faArrowRightFromBracket,
	faCheck,
	faKey,
	faShieldHalved,
	faTriangleExclamation,
	faUser,
} from '@fortawesome/free-solid-svg-icons';

import { Button, Card, Input, Modal, cn } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import Heading from '@/components/heading';

import { publishAccountRuntimeInvalidation } from '@/lib/account/client/accountRuntimeInvalidation';
import { changeAccountPassword, logoutAccount } from '@/lib/account/client/api';
import { getAccountClientErrorMessage } from '@/lib/account/client/errorMessage';
import {
	applyAccountAuthSuccessResponse,
	checkCurrentAccountAuthContext,
	refreshAccountState,
	refreshAccountStateFromInvalidation,
	resetAccountStateAfterSessionExpired,
	resetAccountStateForUnauthorizedError,
	resetAccountStateIfCurrent,
} from '@/lib/account/client/session';
import {
	PASSWORD_RULE_DESCRIPTION,
	checkPasswordPolicy,
} from '@/lib/account/shared/constants';
import { getLogSafeErrorCode } from '@/lib/logging';
import { createMainSiteUrl } from '@/lib/siteUrl';
import { accountStore, globalStore } from '@/stores';

interface IPasswordChangePanelProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

const PasswordChangePanel = memo<IPasswordChangePanelProps>(
	function PasswordChangePanel({ children, className }) {
		const isHighAppearance = globalStore.persistence.highAppearance.use();

		return (
			<Card
				as="section"
				fullWidth
				shadow="sm"
				classNames={{
					base: cn('p-4', className, {
						'bg-content1/40 backdrop-blur': isHighAppearance,
					}),
				}}
			>
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
	const pathname = usePathname();
	const vibrate = useVibrate();

	const csrfToken = accountStore.shared.csrfToken.use();
	const isLoggedIn = accountStore.shared.isLoggedIn.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();
	const user = accountStore.shared.user.use();

	const [currentPassword, setCurrentPassword] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [newPassword, setNewPassword] = useState('');
	const [passwordChangeError, setPasswordChangeError] = useState<
		string | null
	>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isOpen = isLoggedIn && passwordMustChange;
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
		if (isSubmitting || csrfToken === null || user === null) {
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
			setMessage(PASSWORD_RULE_DESCRIPTION);
			return;
		}

		setIsSubmitting(true);
		setMessage(null);
		setPasswordChangeError(null);

		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};

		void changeAccountPassword(
			{ current_password: currentPassword, new_password: newPassword },
			csrfToken
		)
			.then((result) => {
				if (result.status === 'error') {
					if (result.message === 'credential-changed') {
						setMessage(result.message);
						void publishAccountRuntimeInvalidation({
							reason: 'credential-changed',
							stateEpoch: user.state_epoch,
							userId: user.id,
						});
						void refreshAccountStateFromInvalidation().catch(
							(error: unknown) => {
								if (
									resetAccountStateForUnauthorizedError(
										error,
										expectedAuthContext
									) ||
									!checkCurrentAccountAuthContext(
										expectedAuthContext
									)
								) {
									return;
								}
								setMessage(
									getAccountClientErrorMessage(
										error instanceof Error
											? error.message
											: '',
										'账号状态刷新失败，请稍后重试'
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
						if (
							resetAccountStateAfterSessionExpired({
								...expectedAuthContext,
								stateEpoch: user.state_epoch,
							})
						) {
							clearPasswordFields();
						}
						return;
					}
					if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
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
				if (
					!applyAccountAuthSuccessResponse(data, {
						...expectedAuthContext,
					})
				) {
					return;
				}

				clearPasswordFields();
				setMessage(null);

				void publishAccountRuntimeInvalidation({
					reason: 'password-changed',
					stateEpoch: data.user.state_epoch,
					userId: data.user.id,
				});

				if (shouldResumeSso) {
					globalThis.location.assign(
						createMainSiteUrl('/sso/authorize').toString()
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
				setMessage(error instanceof Error ? error.message : '改密失败');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [
		clearPasswordFields,
		csrfToken,
		currentPassword,
		isSubmitting,
		newPassword,
		shouldResumeSso,
		user,
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
		if (isSubmitting || user === null) {
			return;
		}

		vibrate();

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Force Logout'
		);

		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};

		if (csrfToken === null) {
			setMessage(null);
			if (resetAccountStateIfCurrent(expectedAuthContext)) {
				clearPasswordFields();
			}
			return;
		}

		setIsSubmitting(true);
		setMessage(null);

		void logoutAccount(csrfToken)
			.then((result) => {
				if (result.status === 'error') {
					if (result.httpStatus === 401) {
						if (
							resetAccountStateAfterSessionExpired({
								...expectedAuthContext,
								stateEpoch: user.state_epoch,
							})
						) {
							clearPasswordFields();
							if (shouldResumeSso) {
								trackEvent(
									trackEvent.category.show,
									'Modal',
									'Account From SSO Force Logout'
								);
								accountStore.openAccountModal();
							}
						}
						return;
					}
					if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
						return;
					}

					setMessage(result.message);
					return;
				}

				if (resetAccountStateIfCurrent(expectedAuthContext)) {
					void publishAccountRuntimeInvalidation({
						reason: 'logout',
						stateEpoch: user.state_epoch,
						userId: user.id,
					});
					clearPasswordFields();
					if (shouldResumeSso) {
						trackEvent(
							trackEvent.category.show,
							'Modal',
							'Account From SSO Force Logout'
						);
						accountStore.openAccountModal();
					}
				}
			})
			.catch((error: unknown) => {
				setMessage(error instanceof Error ? error.message : '退出失败');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [
		clearPasswordFields,
		csrfToken,
		isSubmitting,
		shouldResumeSso,
		user,
		vibrate,
	]);

	if (!isOpen) {
		return (
			<Modal
				aria-label="更新账号密码"
				coordination={{
					id: 'account.password-required',
					requestOwnership: 'external',
				}}
				isOpen={false}
			>
				<div />
			</Modal>
		);
	}

	const messageText =
		message === null ? null : getAccountClientErrorMessage(message);
	const passwordChangeErrorMessage =
		passwordChangeError === null
			? null
			: getAccountClientErrorMessage(passwordChangeError);
	const isPasswordReady =
		csrfToken !== null &&
		currentPassword.length > 0 &&
		newPassword.length > 0 &&
		!isNewPasswordInvalid;

	return (
		<Modal
			aria-label={
				shouldResumeSso ? 'SSO授权 - 更新账号密码' : '更新账号密码'
			}
			coordination={{
				id: 'account.password-required',
				requestOwnership: 'external',
			}}
			hideCloseButton
			isKeyboardDismissDisabled
			isOpen
			isDismissable={false}
			classNames={{ body: 'px-[18px] py-0.5' }}
		>
			<div className="space-y-4 p-1.5">
				<Heading
					as="h2"
					isFirst
					subTitle={
						shouldResumeSso
							? '管理员已重置此账号的登录凭据。请更新密码后继续授权给外部应用。'
							: '管理员已重置此账号的登录凭据。完成密码更新后，账号同步和数据操作会恢复可用。'
					}
					classNames={{ subTitle: '!-mt-3' }}
				>
					{shouldResumeSso
						? 'SSO授权 - 更新账号密码'
						: '更新账号密码'}
				</Heading>

				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<div className="space-y-4">
						<PasswordChangePanel>
							<PasswordChangePanelTitle icon={faUser}>
								当前账号
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
										{user?.username ?? '当前账号'}
									</p>
									<p className="truncate text-tiny text-danger-600 dark:text-danger">
										需要更新密码后继续使用
									</p>
								</div>
							</div>
						</PasswordChangePanel>

						<PasswordChangePanel>
							<PasswordChangePanelTitle icon={faKey}>
								设置新密码
							</PasswordChangePanelTitle>
							<form
								className="space-y-3"
								onSubmit={handlePasswordChangeSubmit}
							>
								<input
									readOnly
									aria-label="账号用户名"
									autoComplete="username"
									className="sr-only"
									name="username"
									tabIndex={-1}
									type="text"
									value={user?.username ?? ''}
								/>
								<Input
									autoComplete="current-password"
									errorMessage={
										passwordChangeErrorMessage ?? undefined
									}
									isInvalid={
										passwordChangeErrorMessage !== null
									}
									label="当前临时密码"
									placeholder="输入管理员提供或刚登录使用的密码"
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
									description={PASSWORD_RULE_DESCRIPTION}
									errorMessage={
										isNewPasswordInvalid
											? PASSWORD_RULE_DESCRIPTION
											: undefined
									}
									isInvalid={isNewPasswordInvalid}
									label="新密码"
									placeholder="输入之后要长期使用的新密码"
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
									更新密码后继续
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
								{shouldResumeSso ? 'SSO受限状态' : '受限状态'}
							</PasswordChangePanelTitle>
							<div className="space-y-3 text-small leading-6 text-foreground-600">
								<div className="flex items-start gap-2 rounded-small bg-warning/10 px-3 py-2 text-warning-700 dark:text-warning-600">
									<FontAwesomeIcon
										icon={faTriangleExclamation}
										className="mt-1 w-4 shrink-0"
									/>
									<p>
										{shouldResumeSso
											? '密码更新前无法完成SSO授权，也不会签发登录票据。'
											: '密码更新前，账号同步、云端数据操作和冲突处理会暂时暂停。'}
									</p>
								</div>
								<p>
									{shouldResumeSso
										? '如果暂时不处理，可以退出当前账号返回首页。'
										: '如果暂时不处理，可以退出当前账号；本机未完成的同步队列会留在本地，之后重新登录再继续。'}
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
							{shouldResumeSso ? '切换账号' : '退出登录'}
						</Button>
					</PasswordChangePanel>
				</div>
			</div>
		</Modal>
	);
});
