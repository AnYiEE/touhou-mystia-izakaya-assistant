'use client';

import { useCallback, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowRightFromBracket,
	faCloudArrowUp,
	faDownload,
	faKey,
	faRightToBracket,
	faRotate,
	faShieldHalved,
	faTrash,
	faTriangleExclamation,
	faUser,
	faUserPlus,
} from '@fortawesome/free-solid-svg-icons';

import Heading from '@/components/heading';
import {
	Button,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	cn,
} from '@/design/ui/components';
import {
	AccountApiError,
	changeAccountPassword,
	deleteAccount,
	deleteAccountData,
	exportAccountData,
	loginAccount,
	logoutAccount,
	logoutAllAccount,
	registerAccount,
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
import { accountStore } from '@/stores/account';
import { downloadJson } from '@/utilities';
import AccountSyncStatus from './accountSyncStatus';

type TAuthMode = 'login' | 'register';
type TAccountAuthContext = Parameters<typeof resetAccountStateIfCurrent>[0];

function AccountPanel({
	children,
	className,
}: {
	children: ReactNodeWithoutBoolean;
	className?: string;
}) {
	return (
		<section
			className={cn(
				'rounded-small border border-default-200/80 bg-default-50/60 p-4 shadow-sm shadow-default-200/30 dark:bg-default-100/20 dark:shadow-none',
				className
			)}
		>
			{children}
		</section>
	);
}

function AccountPanelTitle({
	children,
	icon,
	iconClassName,
}: {
	children: ReactNodeWithoutBoolean;
	icon: Parameters<typeof FontAwesomeIcon>[0]['icon'];
	iconClassName?: string;
}) {
	return (
		<div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground-700">
			<FontAwesomeIcon
				icon={icon}
				className={cn('w-4 text-primary-600', iconClassName)}
			/>
			<span>{children}</span>
		</div>
	);
}

function AccountInputIcon({
	icon,
}: {
	icon: Parameters<typeof FontAwesomeIcon>[0]['icon'];
}) {
	return (
		<span className="pointer-events-none inline-flex -translate-y-px items-center text-default-400">
			<FontAwesomeIcon icon={icon} className="block w-3.5" />
		</span>
	);
}

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

const LOGOUT_SKIPPED = Symbol('logout-skipped');

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

export default function AccountManager() {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const csrfToken = accountStore.shared.csrfToken.use();
	const lastError = accountStore.shared.sync.lastError.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();
	const user = accountStore.shared.user.use();
	const [authMode, setAuthMode] = useState<TAuthMode>('login');
	const [currentPassword, setCurrentPassword] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [newPassword, setNewPassword] = useState('');
	const [password, setPassword] = useState('');
	const [username, setUsername] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteDataPopoverOpen, setIsDeleteDataPopoverOpen] =
		useState(false);
	const [isDeleteAccountPopoverOpen, setIsDeleteAccountPopoverOpen] =
		useState(false);
	const isRegistrationPasswordInvalid =
		authMode === 'register' &&
		password.length > 0 &&
		!checkPasswordPolicy(password);
	const isNewPasswordInvalid =
		newPassword.length > 0 && !checkPasswordPolicy(newPassword);

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

		setIsSubmitting(true);
		setMessage(null);
		const expectedAuthContext = {
			expectedCsrfToken: accountStore.shared.csrfToken.get(),
			expectedUserId: accountStore.shared.user.get()?.id ?? null,
		};
		const request = authMode === 'login' ? loginAccount : registerAccount;
		void request({ password, username: normalizedUsername })
			.then((data) => {
				if (
					!applyAccountAuthSuccessResponse(data, expectedAuthContext)
				) {
					return;
				}
				setPassword('');
				setMessage(authMode === 'login' ? '登录成功' : '注册成功');
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
	}, [authMode, isSubmitting, password, username]);

	const handlePasswordChange = useCallback(() => {
		if (csrfToken === null || isSubmitting || user === null) {
			return;
		}
		if (!checkPasswordPolicy(newPassword)) {
			setMessage(PASSWORD_RULE_DESCRIPTION);
			return;
		}
		setIsSubmitting(true);
		setMessage(null);
		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		void changeAccountPassword(
			{ current_password: currentPassword, new_password: newPassword },
			csrfToken
		)
			.then((data) => {
				if (
					!applyAccountAuthSuccessResponse(data, {
						...expectedAuthContext,
					})
				) {
					return;
				}
				setCurrentPassword('');
				setNewPassword('');
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
				if (
					error instanceof AccountApiError &&
					error.status === 401 &&
					error.message !== 'invalid-password'
				) {
					resetAccountStateIfCurrent(expectedAuthContext);
					return;
				}

				setMessage(error instanceof Error ? error.message : '改密失败');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, currentPassword, isSubmitting, newPassword, user]);

	const logoutAfterFlush = useCallback(
		(action: (csrfToken: string) => Promise<unknown>) => {
			if (csrfToken === null || isSubmitting || user === null) {
				return;
			}
			const expectedAuthContext = {
				expectedCsrfToken: csrfToken,
				expectedUserId: user.id,
			};

			setIsSubmitting(true);
			setMessage(null);
			void flushAccountSyncQueueUntilIdle()
				.then((isFlushed) => {
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

					return action(csrfToken);
				})
				.then((result) => {
					if (result !== LOGOUT_SKIPPED) {
						resetAccountStateIfCurrent(expectedAuthContext);
					}
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
	const handleExport = useCallback(() => {
		if (isSubmitting || user === null) {
			return;
		}
		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};

		setIsSubmitting(true);
		setMessage(null);
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
			.then((data) => {
				if (data === null) {
					return;
				}
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

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
			.then(({ state_epoch }) => {
				if (!checkCurrentAccountAuthContext(expectedUserContext)) {
					return;
				}
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
				if (error instanceof AccountApiError && error.status === 401) {
					resetAccountStateIfCurrent(expectedSessionContext);
					return;
				}
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
		setIsDeleteAccountPopoverOpen(false);
		setIsSubmitting(true);
		setMessage(null);
		const expectedSessionContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		const expectedUserContext = { expectedUserId: user.id };
		void deleteAccount(csrfToken)
			.then(() => {
				resetAccountStateIfCurrent(expectedUserContext);
			})
			.catch((error: unknown) => {
				if (error instanceof AccountApiError && error.status === 401) {
					resetAccountStateIfCurrent(expectedSessionContext);
					return;
				}
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

	if (bootstrapStatus === 'error') {
		return (
			<div className="space-y-4">
				<Heading as="h2" isFirst>
					账号
				</Heading>
				<p className="text-sm text-foreground-500">
					{getBootstrapErrorMessage(lastError)}
				</p>
			</div>
		);
	}

	if (bootstrapStatus !== 'anonymous' && bootstrapStatus !== 'loggedIn') {
		return null;
	}

	const isMessageSuccess =
		message === '登录成功' ||
		message === '注册成功' ||
		message === '密码已更新' ||
		message === '账号数据已导出' ||
		message === '云端数据已清空' ||
		message === '云端数据已清空，其他标签页可能需要手动刷新';
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

	return (
		<div className="space-y-4">
			<Heading
				as="h2"
				isFirst
				subTitle={
					user === null
						? '登录后可在不同设备间同步此浏览器保存的数据'
						: '管理当前账号、同步状态和云端数据'
				}
			>
				账号
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
								onPress={() => {
									setAuthMode('login');
									setMessage(null);
								}}
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
								onPress={() => {
									setAuthMode('register');
									setMessage(null);
								}}
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
					<AccountPanel className="space-y-3 text-sm leading-6 text-foreground-600">
						<AccountPanelTitle
							icon={faShieldHalved}
							iconClassName="text-default-500"
						>
							账号同步
						</AccountPanelTitle>
						<p>
							账号会同步此浏览器保存的数据，让其他设备继续使用相同配置。
						</p>
						<p>
							注册后会自动登录；登录后，本机尚未上传的更改会自动继续同步。
						</p>
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
								<div className="min-w-0">
									<p className="truncate text-base font-medium">
										{user.username}
									</p>
									<p
										aria-atomic="true"
										aria-live="polite"
										className={cn(
											'truncate text-xs',
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
								<p className="text-sm text-danger-600">
									管理员已要求更新密码，完成后才能继续同步。
								</p>
							)}
							<Input
								autoComplete="current-password"
								label="当前密码"
								placeholder="输入当前密码"
								type="password"
								value={currentPassword}
								onValueChange={setCurrentPassword}
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
										onPress={() => {
											logoutAfterFlush(logoutAccount);
										}}
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
										onPress={() => {
											logoutAfterFlush(logoutAllAccount);
										}}
									>
										退出全部设备
									</Button>
								</div>
							</div>
							<div className="space-y-3 border-t border-default-200/80 pt-4">
								<div className="flex items-start gap-2 rounded-small bg-warning/10 px-3 py-2 text-sm leading-5 text-warning-700 dark:text-warning-600">
									<FontAwesomeIcon
										icon={faTriangleExclamation}
										className="mt-1 w-4 shrink-0"
									/>
									<p>
										危险操作会影响云端数据或账号本身，请确认已经导出需要保留的数据。
									</p>
								</div>
								<div className="flex flex-col gap-2">
									<Popover
										shouldBlockScroll
										showArrow
										isOpen={isDeleteDataPopoverOpen}
										onOpenChange={
											handleDeleteDataPopoverOpenChange
										}
									>
										<PopoverTrigger>
											<Button
												fullWidth
												className="justify-start"
												color="warning"
												isDisabled={
													isSubmitting ||
													csrfToken === null
												}
												isLoading={isSubmitting}
												startContent={
													isSubmitting ? null : (
														<FontAwesomeIcon
															icon={
																faCloudArrowUp
															}
															className="w-4"
														/>
													)
												}
												variant="flat"
											>
												清空云端数据
											</Button>
										</PopoverTrigger>
										<PopoverContent className="space-y-1 p-1">
											<Button
												fullWidth
												color="danger"
												size="sm"
												variant="ghost"
												onPress={handleDeleteData}
											>
												确认清空
											</Button>
											<Button
												fullWidth
												color="primary"
												size="sm"
												variant="ghost"
												onPress={() => {
													setIsDeleteDataPopoverOpen(
														false
													);
												}}
											>
												取消清空
											</Button>
										</PopoverContent>
									</Popover>
									<Popover
										shouldBlockScroll
										showArrow
										isOpen={isDeleteAccountPopoverOpen}
										onOpenChange={
											handleDeleteAccountPopoverOpenChange
										}
									>
										<PopoverTrigger>
											<Button
												fullWidth
												className="justify-start"
												color="danger"
												isDisabled={
													isSubmitting ||
													csrfToken === null
												}
												isLoading={isSubmitting}
												startContent={
													isSubmitting ? null : (
														<FontAwesomeIcon
															icon={faTrash}
															className="w-4"
														/>
													)
												}
												variant="flat"
											>
												删除账号
											</Button>
										</PopoverTrigger>
										<PopoverContent className="space-y-1 p-1">
											<Button
												fullWidth
												color="danger"
												size="sm"
												variant="ghost"
												onPress={handleDeleteAccount}
											>
												确认删除
											</Button>
											<Button
												fullWidth
												color="primary"
												size="sm"
												variant="ghost"
												onPress={() => {
													setIsDeleteAccountPopoverOpen(
														false
													);
												}}
											>
												取消删除
											</Button>
										</PopoverContent>
									</Popover>
								</div>
							</div>
						</AccountPanel>
					)}
				</div>
			)}
		</div>
	);
}
