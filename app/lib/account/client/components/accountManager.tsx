'use client';

import {
	type PropsWithChildren,
	memo,
	useCallback,
	useEffect,
	useState,
} from 'react';

import { usePathname, useRouter } from 'next/navigation';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import {
	faArrowRightFromBracket,
	faCloudArrowUp,
	faDownload,
	faKey,
	faPlug,
	faRightToBracket,
	faRotate,
	faShieldHalved,
	faTrash,
	faTriangleExclamation,
	faUser,
	faUserPlus,
} from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Card,
	type IButtonProps,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	cn,
} from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import Heading from '@/components/heading';
import AccountSyncStatus from './accountSyncStatus';

import {
	AccountApiError,
	type TAccountApiResult,
	changeAccountPassword,
	deleteAccount,
	deleteAccountData,
	exportAccountData,
	loginAccount,
	logoutAccount,
	logoutAllAccount,
	refreshAccountSsoGrants,
	registerAccount,
	revokeAccountSsoGrant,
} from '@/lib/account/client/api';
import { postAccountSyncBroadcastMessage } from '@/lib/account/client/broadcast';
import { getAccountClientErrorMessage } from '@/lib/account/client/errorMessage';
import { createAccountClientId } from '@/lib/account/client/random';
import {
	applyAccountAuthSuccessResponse,
	checkCurrentAccountAuthContext,
	refreshAccountState,
	resetAccountStateIfCurrent,
} from '@/lib/account/client/session';
import {
	flushAccountSyncQueueUntilIdle,
	resetAccountSyncCloudStateAfterDelete,
	scheduleAccountSyncFlush,
} from '@/lib/account/client/syncClient';
import {
	PASSWORD_RULE_DESCRIPTION,
	USERNAME_RULE_DESCRIPTION,
	checkPasswordPolicy,
} from '@/lib/account/shared/constants';
import { getLogSafeErrorCode } from '@/lib/logging';
import type {
	IAccountSsoGrant,
	IAccountSsoGrantListData,
} from '@/lib/account/shared/types';
import { accountStore, globalStore } from '@/stores';
import { downloadJson } from '@/utilities';

type TAuthMode = 'login' | 'register';
type TAccountAuthContext = Parameters<typeof resetAccountStateIfCurrent>[0];

interface IAccountPanelProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

const AccountPanel = memo<IAccountPanelProps>(function AccountPanel({
	children,
	className,
}) {
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
});

interface IAccountPanelTitleProps {
	children: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
	iconClassName?: string;
}

const AccountPanelTitle = memo<IAccountPanelTitleProps>(
	function AccountPanelTitle({ children, icon, iconClassName }) {
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

interface IAccountInputIconProps extends Pick<FontAwesomeIconProps, 'icon'> {}

const AccountInputIcon = memo<IAccountInputIconProps>(
	function AccountInputIcon({ icon }) {
		return (
			<span className="pointer-events-none inline-flex -translate-y-px items-center text-default-400">
				<FontAwesomeIcon icon={icon} className="block w-3.5" />
			</span>
		);
	}
);

interface IAccountConfirmButtonProps {
	buttonLabel: ReactNodeWithoutBoolean;
	color: IButtonProps['color'];
	confirmLabel: ReactNodeWithoutBoolean;
	fullWidth?: boolean;
	icon: FontAwesomeIconProps['icon'];
	isDisabled: boolean;
	isLoading: boolean;
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	onOpenChange: (isOpen: boolean) => void;
}

const AccountConfirmButton = memo<IAccountConfirmButtonProps>(
	function AccountConfirmButton({
		buttonLabel,
		color,
		confirmLabel,
		fullWidth = true,
		icon,
		isDisabled,
		isLoading,
		isOpen,
		onCancel,
		onConfirm,
		onOpenChange,
	}) {
		return (
			<Popover
				shouldBlockScroll
				showArrow
				isOpen={isOpen}
				onOpenChange={onOpenChange}
			>
				<PopoverTrigger>
					<Button
						fullWidth={fullWidth}
						className="justify-start"
						color={color}
						isDisabled={isDisabled}
						isLoading={isLoading}
						startContent={
							isLoading ? null : (
								<FontAwesomeIcon icon={icon} className="w-4" />
							)
						}
						variant="flat"
					>
						{buttonLabel}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="space-y-1 p-1">
					<Button
						fullWidth
						color="danger"
						size="sm"
						variant="ghost"
						onPress={onConfirm}
					>
						{confirmLabel}
					</Button>
					<Button
						fullWidth
						color="primary"
						size="sm"
						variant="ghost"
						onPress={onCancel}
					>
						取消
					</Button>
				</PopoverContent>
			</Popover>
		);
	}
);

function handleUnauthorizedAccountError(
	error: unknown,
	context: TAccountAuthContext = {}
) {
	if (error instanceof AccountApiError && error.status === 401) {
		resetAccountStateIfCurrent(context);
		return true;
	}

	return false;
}

function handleUnauthorizedAccountActionError(
	error: Extract<TAccountApiResult, { status: 'error' }>,
	context: TAccountAuthContext = {}
) {
	if (error.httpStatus === 401) {
		resetAccountStateIfCurrent(context);
		return true;
	}

	return false;
}

const LOGOUT_SKIPPED = Symbol('logout-skipped');
type TLogoutAfterFlushResult =
	| TAccountApiResult<unknown>
	| typeof LOGOUT_SKIPPED;
const accountSsoGrantsRequestMap = new Map<
	string,
	Promise<TAccountApiResult<IAccountSsoGrantListData>>
>();

const BOOTSTRAP_ERROR_MESSAGE_MAP: Record<string, string> = {
	'bootstrap-failed': '账号服务初始化失败，请刷新页面重试',
	'server-misconfigured': '服务器配置异常',
};

function getBootstrapErrorMessage(errorCode: string | null) {
	if (errorCode === null) {
		return '账号功能暂不可用：服务器配置异常';
	}
	return `账号功能暂不可用：${BOOTSTRAP_ERROR_MESSAGE_MAP[errorCode] ?? errorCode}`;
}

function refreshAccountSsoGrantsOnce(userId: string) {
	const currentRequest = accountSsoGrantsRequestMap.get(userId);
	if (currentRequest !== undefined) {
		return currentRequest;
	}

	const nextRequest = refreshAccountSsoGrants().finally(() => {
		if (accountSsoGrantsRequestMap.get(userId) === nextRequest) {
			accountSsoGrantsRequestMap.delete(userId);
		}
	});
	accountSsoGrantsRequestMap.set(userId, nextRequest);

	return nextRequest;
}

interface IProps {}

export default memo<IProps>(function AccountManager() {
	const pathname = usePathname();
	const router = useRouter();
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const csrfToken = accountStore.shared.csrfToken.use();
	const lastError = accountStore.shared.sync.lastError.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();
	const ssoGrantInitialData = accountStore.shared.ssoGrantInitialData.use();
	const user = accountStore.shared.user.use();

	const [authMode, setAuthMode] = useState<TAuthMode>('login');
	const [currentPassword, setCurrentPassword] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [newPassword, setNewPassword] = useState('');
	const [passwordChangeError, setPasswordChangeError] = useState<
		string | null
	>(null);
	const [password, setPassword] = useState('');
	const [username, setUsername] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDataPopoverOpen, setIsDeleteDataPopoverOpen] =
		useState(false);
	const [isDeleteAccountPopoverOpen, setIsDeleteAccountPopoverOpen] =
		useState(false);
	const [shouldHideAfterSsoAuth, setShouldHideAfterSsoAuth] = useState(false);
	const [ssoGrants, setSsoGrants] = useState<IAccountSsoGrant[]>([]);
	const [ssoGrantsUserId, setSsoGrantsUserId] = useState<string | null>(null);
	const [revokeTargetClientId, setRevokeTargetClientId] = useState<
		string | null
	>(null);

	const isRegistrationPasswordInvalid =
		authMode === 'register' &&
		password.length > 0 &&
		!checkPasswordPolicy(password);
	const isNewPasswordInvalid =
		newPassword.length > 0 && !checkPasswordPolicy(newPassword);
	const isSsoContext = pathname === '/sso/authorize';

	useEffect(() => {
		setShouldHideAfterSsoAuth(false);
	}, [pathname]);

	const handleAuth = useCallback(() => {
		if (isSubmitting) {
			return;
		}

		const normalizedUsername = username.trim();
		if (normalizedUsername !== username) {
			setUsername(normalizedUsername);
		}

		if (normalizedUsername.length === 0 || password.length === 0) {
			setMessage('请输入用户名和密码');
			return;
		}
		if (authMode === 'register' && !checkPasswordPolicy(password)) {
			setMessage(PASSWORD_RULE_DESCRIPTION);
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			authMode === 'login' ? 'Login' : 'Register'
		);

		setIsSubmitting(true);
		setMessage(null);

		const expectedAuthContext = {
			expectedCsrfToken: accountStore.shared.csrfToken.get(),
			expectedUserId: accountStore.shared.user.get()?.id ?? null,
		};

		const request = authMode === 'login' ? loginAccount : registerAccount;
		void request({ password, username: normalizedUsername })
			.then((result) => {
				if (result.status === 'error') {
					setMessage(result.message);
					return;
				}

				const { redirect_to: redirectTo, ...data } = result.data;
				if (
					!applyAccountAuthSuccessResponse(data, expectedAuthContext)
				) {
					return;
				}

				setPassword('');
				setMessage(authMode === 'login' ? '登录成功' : '注册成功');
				if (redirectTo !== undefined) {
					globalThis.location.assign(redirectTo);
					return;
				}
				if (isSsoContext) {
					setShouldHideAfterSsoAuth(true);
					accountStore.shared.accountModal.isOpen.set(false);
					router.refresh();
					return;
				}

				refreshAccountState().catch((error: unknown) => {
					if (
						handleUnauthorizedAccountError(error, {
							expectedCsrfToken: data.csrf_token,
							expectedUserId: data.user.id,
						})
					) {
						return;
					}
					console.warn(
						'Account state refresh failed after successful authentication.',
						{ errorCode: getLogSafeErrorCode(error) }
					);
				});
			})
			.catch((error: unknown) => {
				setMessage(error instanceof Error ? error.message : '认证失败');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [authMode, isSsoContext, isSubmitting, password, router, username]);

	const handleLoginModePress = useCallback(() => {
		setAuthMode('login');
		setMessage(null);
	}, []);

	const handleRegisterModePress = useCallback(() => {
		setAuthMode('register');
		setMessage(null);
	}, []);

	const handleCurrentPasswordChange = useCallback((value: string) => {
		setCurrentPassword(value);
		setPasswordChangeError(null);
	}, []);

	const handlePasswordChange = useCallback(() => {
		if (csrfToken === null || isSubmitting || user === null) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Password Button',
			passwordMustChange ? 'Force Change' : 'Change'
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
					if (result.message === 'invalid-password') {
						if (
							!checkCurrentAccountAuthContext(expectedAuthContext)
						) {
							return;
						}

						setPasswordChangeError(result.message);
						setMessage(null);
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

				setCurrentPassword('');
				setNewPassword('');
				setPasswordChangeError(null);
				setMessage('密码已更新');

				refreshAccountState().catch((error: unknown) => {
					if (
						handleUnauthorizedAccountError(error, {
							expectedCsrfToken: data.csrf_token,
							expectedUserId: data.user.id,
						})
					) {
						return;
					}
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
		csrfToken,
		currentPassword,
		isSubmitting,
		newPassword,
		passwordMustChange,
		user,
	]);

	const logoutAfterFlush = useCallback(
		(
			action: (csrfToken: string) => Promise<TAccountApiResult<unknown>>,
			trackName: string
		) => {
			if (csrfToken === null || isSubmitting || user === null) {
				return;
			}

			trackEvent(
				trackEvent.category.click,
				'Account Auth Button',
				trackName
			);

			setIsSubmitting(true);
			setMessage(null);

			const expectedAuthContext = {
				expectedCsrfToken: csrfToken,
				expectedUserId: user.id,
			};

			void flushAccountSyncQueueUntilIdle()
				.then(async (isFlushed): Promise<TLogoutAfterFlushResult> => {
					if (!isFlushed) {
						if (
							!checkCurrentAccountAuthContext(expectedAuthContext)
						) {
							return LOGOUT_SKIPPED;
						}
						if (accountStore.shared.user.get() === null) {
							resetAccountStateIfCurrent(expectedAuthContext);
							return LOGOUT_SKIPPED;
						}

						const syncLastError =
							accountStore.shared.sync.lastError.get();
						if (syncLastError === 'unauthorized') {
							resetAccountStateIfCurrent(expectedAuthContext);
							return LOGOUT_SKIPPED;
						}

						setMessage('同步尚未完成，请先重试同步后再退出');

						return LOGOUT_SKIPPED;
					}

					return await action(csrfToken);
				})
				.then((result) => {
					if (result === LOGOUT_SKIPPED) {
						return;
					}
					if (result.status === 'error') {
						if (
							handleUnauthorizedAccountActionError(
								result,
								expectedAuthContext
							)
						) {
							return;
						}
						setMessage(result.message);
						return;
					}

					resetAccountStateIfCurrent(expectedAuthContext);
				})
				.catch((error: unknown) => {
					if (
						error instanceof AccountApiError &&
						error.status === 401
					) {
						resetAccountStateIfCurrent(expectedAuthContext);
						return;
					}

					setMessage(
						error instanceof Error
							? error.message
							: '退出前同步失败'
					);
				})
				.finally(() => {
					setIsSubmitting(false);
				});
		},
		[csrfToken, isSubmitting, user]
	);

	const handleLogout = useCallback(() => {
		logoutAfterFlush(logoutAccount, 'Logout');
	}, [logoutAfterFlush]);

	const handleLogoutAll = useCallback(() => {
		logoutAfterFlush(logoutAllAccount, 'Logout All');
	}, [logoutAfterFlush]);

	const handleExport = useCallback(() => {
		if (isSubmitting || user === null) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Sync Button',
			'Export Data'
		);

		setIsSubmitting(true);
		setMessage(null);

		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};

		void flushAccountSyncQueueUntilIdle()
			.then((isFlushed) => {
				if (!isFlushed) {
					if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
						return null;
					}
					if (accountStore.shared.user.get() === null) {
						resetAccountStateIfCurrent(expectedAuthContext);
						return null;
					}

					const syncLastError =
						accountStore.shared.sync.lastError.get();
					if (syncLastError === 'unauthorized') {
						resetAccountStateIfCurrent(expectedAuthContext);
						return null;
					}

					setMessage('同步尚未完成，请先重试同步后再导出');

					return null;
				}

				return exportAccountData();
			})
			.then((result) => {
				if (result === null) {
					return;
				}
				if (result.status === 'error') {
					if (
						handleUnauthorizedAccountActionError(
							result,
							expectedAuthContext
						)
					) {
						return;
					}
					if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
						return;
					}

					setMessage(result.message);
					return;
				}
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				const { data } = result;

				downloadJson(
					`mystia-account-${user.username}`,
					JSON.stringify(data, null, 2)
				);
				setMessage('账号数据已导出');
			})
			.catch((error: unknown) => {
				if (
					handleUnauthorizedAccountError(error, expectedAuthContext)
				) {
					return;
				}
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				setMessage(error instanceof Error ? error.message : '导出失败');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, isSubmitting, user]);
	const handleDeleteData = useCallback(() => {
		if (csrfToken === null || isSubmitting || user === null) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Sync Button',
			'Delete Data'
		);

		setIsDeleteDataPopoverOpen(false);
		setIsSubmitting(true);
		setMessage(null);

		const deleteStartedAt = Date.now();

		const expectedSessionContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		const expectedUserContext = { expectedUserId: user.id };

		void deleteAccountData(csrfToken)
			.then((result) => {
				if (result.status === 'error') {
					if (
						handleUnauthorizedAccountActionError(
							result,
							expectedSessionContext
						)
					) {
						return;
					}
					if (
						!checkCurrentAccountAuthContext(expectedSessionContext)
					) {
						return;
					}

					setMessage(result.message);
					return;
				}
				if (!checkCurrentAccountAuthContext(expectedUserContext)) {
					return;
				}

				const { state_epoch } = result.data;

				const shouldFlushPreservedDirty =
					resetAccountSyncCloudStateAfterDelete({
						deleteStartedAt,
						stateEpoch: state_epoch,
						userId: user.id,
					});

				if (shouldFlushPreservedDirty) {
					scheduleAccountSyncFlush();
				}

				return postAccountSyncBroadcastMessage({
					deleteStartedAt,
					namespaces: [],
					operationId: createAccountClientId(),
					state_epoch,
					tabId: 'local',
					type: 'data-deleted',
					userId: user.id,
				})
					.then((didBroadcast) => {
						if (
							!checkCurrentAccountAuthContext(expectedUserContext)
						) {
							return;
						}

						setMessage(
							didBroadcast
								? '云端数据已清空'
								: '云端数据已清空，其他标签页可能需要手动刷新'
						);
					})
					.catch((error: unknown) => {
						console.warn(
							'Account data deletion broadcast failed.',
							{ errorCode: getLogSafeErrorCode(error) }
						);
						if (
							!checkCurrentAccountAuthContext(expectedUserContext)
						) {
							return;
						}

						setMessage(
							'云端数据已清空，其他标签页可能需要手动刷新'
						);
					});
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountAuthContext(expectedSessionContext)) {
					return;
				}

				setMessage(
					error instanceof Error ? error.message : '清空云端数据失败'
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, isSubmitting, user]);
	const handleDeleteAccount = useCallback(() => {
		if (csrfToken === null || isSubmitting || user === null) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Delete Account'
		);

		setIsDeleteAccountPopoverOpen(false);
		setIsSubmitting(true);
		setMessage(null);

		const expectedSessionContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		const expectedUserContext = { expectedUserId: user.id };

		void deleteAccount(csrfToken)
			.then((result) => {
				if (result.status === 'error') {
					if (
						handleUnauthorizedAccountActionError(
							result,
							expectedSessionContext
						)
					) {
						return;
					}
					if (
						!checkCurrentAccountAuthContext(expectedSessionContext)
					) {
						return;
					}

					setMessage(result.message);
					return;
				}

				resetAccountStateIfCurrent(expectedUserContext);
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountAuthContext(expectedSessionContext)) {
					return;
				}

				setMessage(
					error instanceof Error ? error.message : '删除账号失败'
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, isSubmitting, user]);
	const handleDeleteDataPopoverOpenChange = useCallback((isOpen: boolean) => {
		setIsDeleteDataPopoverOpen(isOpen);
		if (isOpen) {
			setIsDeleteAccountPopoverOpen(false);
		}
	}, []);
	const handleDeleteAccountPopoverOpenChange = useCallback(
		(isOpen: boolean) => {
			setIsDeleteAccountPopoverOpen(isOpen);
			if (isOpen) {
				setIsDeleteDataPopoverOpen(false);
			}
		},
		[]
	);
	const handleDeleteDataCancel = useCallback(() => {
		setIsDeleteDataPopoverOpen(false);
	}, []);

	const handleDeleteAccountCancel = useCallback(() => {
		setIsDeleteAccountPopoverOpen(false);
	}, []);

	useEffect(() => {
		if (user === null || csrfToken === null || passwordMustChange) {
			if (
				bootstrapStatus === 'anonymous' ||
				bootstrapStatus === 'loggedIn' ||
				passwordMustChange
			) {
				accountStore.shared.ssoGrantInitialData.set(null);
				setSsoGrants([]);
				setSsoGrantsUserId(null);
			}
			return;
		}

		if (ssoGrantInitialData?.user_id === user.id) {
			accountStore.shared.ssoGrantInitialData.set(null);
			setSsoGrants(ssoGrantInitialData.grants);
			setSsoGrantsUserId(user.id);
			return;
		}
		if (ssoGrantInitialData !== null) {
			accountStore.shared.ssoGrantInitialData.set(null);
			setSsoGrants([]);
			setSsoGrantsUserId(null);
		}
		if (ssoGrantsUserId === user.id) {
			return;
		}

		let cancelled = false;
		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};

		refreshAccountSsoGrantsOnce(user.id)
			.then((result) => {
				if (
					cancelled ||
					!checkCurrentAccountAuthContext(expectedAuthContext)
				) {
					return;
				}

				if (result.status === 'error') {
					if (
						handleUnauthorizedAccountActionError(
							result,
							expectedAuthContext
						)
					) {
						return;
					}
					console.warn('Failed to list SSO grants.', {
						errorCode: result.message,
					});
					return;
				}

				setSsoGrants(result.data.grants);
				setSsoGrantsUserId(user.id);
			})
			.catch((error: unknown) => {
				if (
					cancelled ||
					!checkCurrentAccountAuthContext(expectedAuthContext)
				) {
					return;
				}
				console.warn('Failed to list SSO grants.', {
					errorCode: getLogSafeErrorCode(error),
				});
			});

		return () => {
			cancelled = true;
		};
	}, [
		bootstrapStatus,
		csrfToken,
		passwordMustChange,
		ssoGrantInitialData,
		ssoGrantsUserId,
		user,
	]);

	const handleRevokeSsoGrantOpen = useCallback((clientId: string) => {
		setRevokeTargetClientId(clientId);
	}, []);

	const handleRevokeSsoGrantCancel = useCallback(() => {
		setRevokeTargetClientId(null);
	}, []);

	const handleRevokeSsoGrant = useCallback(() => {
		if (
			csrfToken === null ||
			user === null ||
			revokeTargetClientId === null ||
			isSubmitting
		) {
			return;
		}

		const clientId = revokeTargetClientId;
		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		setRevokeTargetClientId(null);
		setIsSubmitting(true);

		revokeAccountSsoGrant(clientId, csrfToken)
			.then((result) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				if (result.status === 'error') {
					if (
						handleUnauthorizedAccountActionError(
							result,
							expectedAuthContext
						)
					) {
						return;
					}

					setMessage(result.message);
					return;
				}

				setSsoGrants((prev) =>
					prev.filter((grant) => grant.client.id !== clientId)
				);
				setMessage('已撤销授权');
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				if (
					handleUnauthorizedAccountError(error, expectedAuthContext)
				) {
					return;
				}

				setMessage(
					error instanceof Error ? error.message : '撤销授权失败'
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, isSubmitting, revokeTargetClientId, user]);

	if (bootstrapStatus === 'error') {
		return (
			<div className="space-y-4">
				<Heading as="h2" isFirst>
					账号
				</Heading>
				<p className="text-small text-foreground-500">
					{getBootstrapErrorMessage(lastError)}
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
		message !== null &&
		[
			'登录成功',
			'注册成功',
			'密码已更新',
			'已撤销授权',
			'账号数据已导出',
			'云端数据已清空',
			'云端数据已清空，其他标签页可能需要手动刷新',
		].includes(message);
	const messageText =
		message === null ? null : getAccountClientErrorMessage(message);
	const authErrorMessage =
		user === null && messageText !== null && !isMessageSuccess
			? messageText
			: null;
	const accountStatusMessage =
		messageText !== null && authErrorMessage === null ? messageText : null;
	const accountStatusDescription = accountStatusMessage ?? '账号同步已连接';
	const passwordDescription =
		authErrorMessage === null
			? authMode === 'register'
				? PASSWORD_RULE_DESCRIPTION
				: '使用账号密码登录'
			: undefined;
	const passwordChangeErrorMessage =
		passwordChangeError === null
			? null
			: getAccountClientErrorMessage(passwordChangeError);
	const visibleSsoGrants = user?.id === ssoGrantsUserId ? ssoGrants : [];

	return (
		<div className="space-y-4 p-1.5">
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
				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<AccountPanel className="space-y-4">
						<div className="flex gap-1 rounded-small bg-default-100 p-1 dark:bg-default-50/20">
							<Button
								fullWidth
								color={
									authMode === 'login' ? 'primary' : 'default'
								}
								startContent={
									<FontAwesomeIcon
										icon={faRightToBracket}
										className="w-4"
									/>
								}
								variant={
									authMode === 'login' ? 'flat' : 'light'
								}
								onPress={handleLoginModePress}
							>
								登录
							</Button>
							<Button
								fullWidth
								color={
									authMode === 'register'
										? 'primary'
										: 'default'
								}
								startContent={
									<FontAwesomeIcon
										icon={faUserPlus}
										className="w-4"
									/>
								}
								variant={
									authMode === 'register' ? 'flat' : 'light'
								}
								onPress={handleRegisterModePress}
							>
								注册
							</Button>
						</div>
						<div className="space-y-3">
							<Input
								autoComplete="username"
								description={USERNAME_RULE_DESCRIPTION}
								isInvalid={authErrorMessage !== null}
								label="用户名"
								placeholder="输入账号用户名"
								startContent={
									<AccountInputIcon icon={faUser} />
								}
								value={username}
								onValueChange={setUsername}
							/>
							<Input
								autoComplete={
									authMode === 'login'
										? 'current-password'
										: 'new-password'
								}
								description={passwordDescription}
								errorMessage={
									isRegistrationPasswordInvalid
										? PASSWORD_RULE_DESCRIPTION
										: (authErrorMessage ?? undefined)
								}
								isInvalid={
									isRegistrationPasswordInvalid ||
									authErrorMessage !== null
								}
								label="密码"
								placeholder={
									authMode === 'login'
										? '输入密码'
										: '设置登录密码'
								}
								startContent={<AccountInputIcon icon={faKey} />}
								type="password"
								value={password}
								onValueChange={setPassword}
							/>
						</div>
						<Button
							fullWidth
							color="primary"
							isDisabled={
								username.trim().length === 0 ||
								password.length === 0 ||
								isRegistrationPasswordInvalid
							}
							isLoading={isSubmitting}
							startContent={
								isSubmitting ? null : (
									<FontAwesomeIcon
										icon={
											authMode === 'login'
												? faRightToBracket
												: faUserPlus
										}
										className="w-4"
									/>
								)
							}
							variant="flat"
							onPress={handleAuth}
						>
							{authMode === 'login' ? '登录账号' : '创建账号'}
						</Button>
					</AccountPanel>
					<AccountPanel className="space-y-3 text-small leading-6 text-foreground-600">
						<AccountPanelTitle
							icon={faShieldHalved}
							iconClassName="text-default-500"
						>
							{isSsoContext ? 'SSO授权' : '账号同步'}
						</AccountPanelTitle>
						{isSsoContext ? (
							<>
								<p>
									登录后，您可以授权外部应用获取您的小助手账号身份。
								</p>
								<p>
									注册后会自动登录；登录后即可在授权页面完成确认。
								</p>
							</>
						) : (
							<>
								<p>
									账号会同步此浏览器保存的数据，让其他设备继续使用相同配置。
								</p>
								<p>
									注册后会自动登录；登录后，本机尚未上传的更改会自动继续同步。
								</p>
							</>
						)}
					</AccountPanel>
				</div>
			) : (
				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<div className="space-y-4">
						<AccountPanel>
							<AccountPanelTitle icon={faUser}>
								当前账号
							</AccountPanelTitle>
							<div className="flex flex-wrap items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary-600">
									<FontAwesomeIcon
										icon={faUser}
										className="w-4"
									/>
								</div>
								<div className="min-w-0 space-y-1">
									<p className="truncate text-base font-medium leading-none">
										{user.username}
									</p>
									<p
										aria-atomic="true"
										aria-live="polite"
										className={cn(
											'truncate text-tiny',
											accountStatusMessage === null
												? 'text-foreground-500'
												: isMessageSuccess
													? 'text-success-700 dark:text-success'
													: 'text-danger-600 dark:text-danger'
										)}
										role={
											accountStatusMessage === null
												? undefined
												: 'status'
										}
										title={accountStatusDescription}
									>
										{accountStatusDescription}
									</p>
								</div>
							</div>
						</AccountPanel>
						<AccountPanel className="space-y-3">
							<AccountPanelTitle icon={faKey}>
								{passwordMustChange ? '更新密码' : '修改密码'}
							</AccountPanelTitle>
							{passwordMustChange && (
								<p className="text-small text-danger-600">
									管理员已要求更新密码，完成后才能继续同步。
								</p>
							)}
							<Input
								autoComplete="current-password"
								errorMessage={
									passwordChangeErrorMessage ?? undefined
								}
								isInvalid={passwordChangeErrorMessage !== null}
								label="当前密码"
								placeholder="输入当前密码"
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
								placeholder="输入新密码"
								type="password"
								value={newPassword}
								onValueChange={setNewPassword}
							/>
							<Button
								fullWidth
								color={
									passwordMustChange ? 'danger' : 'primary'
								}
								isDisabled={
									csrfToken === null ||
									currentPassword.length === 0 ||
									newPassword.length === 0 ||
									isNewPasswordInvalid
								}
								isLoading={isSubmitting}
								startContent={
									isSubmitting ? null : (
										<FontAwesomeIcon
											icon={faKey}
											className="w-4"
										/>
									)
								}
								variant="flat"
								onPress={handlePasswordChange}
							>
								{passwordMustChange
									? '更新密码后继续'
									: '修改密码'}
							</Button>
						</AccountPanel>
						{!passwordMustChange && (
							<AccountPanel>
								<AccountPanelTitle icon={faCloudArrowUp}>
									同步状态
								</AccountPanelTitle>
								<AccountSyncStatus />
							</AccountPanel>
						)}
					</div>
					{!passwordMustChange && (
						<AccountPanel className="space-y-4">
							<div>
								<AccountPanelTitle icon={faDownload}>
									数据与会话
								</AccountPanelTitle>
								<div className="flex flex-col gap-2">
									<Button
										fullWidth
										className="justify-start"
										isDisabled={isSubmitting}
										isLoading={isSubmitting}
										startContent={
											isSubmitting ? null : (
												<FontAwesomeIcon
													icon={faDownload}
													className="w-4"
												/>
											)
										}
										variant="flat"
										onPress={handleExport}
									>
										导出账号数据
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
													icon={faRotate}
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
							</div>
							<div className="space-y-3 border-t border-default-200/80 pt-4">
								<div className="flex items-start gap-2 rounded-small bg-warning/10 px-3 py-2 text-small leading-5 text-warning-700 dark:text-warning-600">
									<FontAwesomeIcon
										icon={faTriangleExclamation}
										className="mt-1 w-4 shrink-0"
									/>
									<p>
										危险操作会影响云端数据或账号本身，请确认已经导出需要保留的数据。
									</p>
								</div>
								<div className="flex flex-col gap-2">
									<AccountConfirmButton
										buttonLabel="清空云端数据"
										color="warning"
										confirmLabel="确认清空"
										icon={faCloudArrowUp}
										isDisabled={
											isSubmitting || csrfToken === null
										}
										isLoading={isSubmitting}
										isOpen={isDeleteDataPopoverOpen}
										onOpenChange={
											handleDeleteDataPopoverOpenChange
										}
										onConfirm={handleDeleteData}
										onCancel={handleDeleteDataCancel}
									/>
									<AccountConfirmButton
										buttonLabel="删除账号"
										color="danger"
										confirmLabel="确认删除"
										icon={faTrash}
										isDisabled={
											isSubmitting || csrfToken === null
										}
										isLoading={isSubmitting}
										isOpen={isDeleteAccountPopoverOpen}
										onOpenChange={
											handleDeleteAccountPopoverOpenChange
										}
										onConfirm={handleDeleteAccount}
										onCancel={handleDeleteAccountCancel}
									/>
								</div>
							</div>
						</AccountPanel>
					)}
					{!passwordMustChange && visibleSsoGrants.length > 0 && (
						<AccountPanel className="space-y-3">
							<AccountPanelTitle icon={faPlug}>
								已授权应用
							</AccountPanelTitle>
							<div className="flex flex-col gap-1">
								{visibleSsoGrants.map((grant) => (
									<div
										key={grant.client.id}
										className="flex items-center justify-between gap-2"
									>
										<span
											className="truncate text-small text-foreground-600"
											title={grant.client.id}
										>
											{grant.client.name}
										</span>
										<AccountConfirmButton
											buttonLabel="撤销"
											color="warning"
											confirmLabel="确认撤销"
											fullWidth={false}
											icon={faPlug}
											isDisabled={
												isSubmitting ||
												csrfToken === null
											}
											isLoading={
												isSubmitting &&
												revokeTargetClientId ===
													grant.client.id
											}
											isOpen={
												revokeTargetClientId ===
												grant.client.id
											}
											onCancel={
												handleRevokeSsoGrantCancel
											}
											onConfirm={handleRevokeSsoGrant}
											onOpenChange={(isOpen) => {
												if (isOpen) {
													handleRevokeSsoGrantOpen(
														grant.client.id
													);
												} else {
													handleRevokeSsoGrantCancel();
												}
											}}
										/>
									</div>
								))}
							</div>
						</AccountPanel>
					)}
				</div>
			)}
		</div>
	);
});
