'use client';

import { useCallback, useState } from 'react';

import { Input } from '@heroui/input';

import Heading from '@/components/heading';
import { Button } from '@/design/ui/components';
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
import { createAccountClientId } from '@/lib/account/client/random';
import {
	refreshAccountState,
	resetAccountState,
} from '@/lib/account/client/session';
import {
	flushAccountSyncQueue,
	resetAccountSyncCloudStateAfterDelete,
} from '@/lib/account/client/syncClient';
import { accountStore } from '@/stores/account';
import { downloadJson } from '@/utilities';
import AccountSyncStatus from './accountSyncStatus';
import LegacyBackupImport from './legacyBackupImport';

type TAuthMode = 'login' | 'register';

function handleUnauthorizedAccountError(error: unknown) {
	if (error instanceof AccountApiError && error.status === 401) {
		resetAccountState();
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

	const handleAuth = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		const normalizedUsername = username.trim();
		if (normalizedUsername.length === 0 || password.length === 0) {
			setMessage('请输入用户名和密码');
			return;
		}

		setIsSubmitting(true);
		setMessage(null);
		const request = authMode === 'login' ? loginAccount : registerAccount;
		void request({ password, username: normalizedUsername })
			.then(() => {
				setPassword('');
				setMessage(authMode === 'login' ? '登录成功' : '注册成功');
				refreshAccountState().catch((error: unknown) => {
					console.warn(
						'Account state refresh failed after successful authentication.',
						error
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
		if (csrfToken === null || isSubmitting) {
			return;
		}
		setIsSubmitting(true);
		setMessage(null);
		void changeAccountPassword(
			{ current_password: currentPassword, new_password: newPassword },
			csrfToken
		)
			.then(() => {
				setCurrentPassword('');
				setNewPassword('');
				setMessage('密码已更新');
				refreshAccountState().catch((error: unknown) => {
					if (handleUnauthorizedAccountError(error)) {
						return;
					}
					console.warn(
						'Account state refresh failed after successful password change.',
						error
					);
				});
			})
			.catch((error: unknown) => {
				if (handleUnauthorizedAccountError(error)) {
					return;
				}

				setMessage(error instanceof Error ? error.message : '改密失败');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, currentPassword, isSubmitting, newPassword]);

	const logoutAfterFlush = useCallback(
		(action: (csrfToken: string) => Promise<unknown>) => {
			if (csrfToken === null || isSubmitting) {
				return;
			}

			setIsSubmitting(true);
			setMessage(null);
			void flushAccountSyncQueue()
				.then((isFlushed) => {
					if (!isFlushed) {
						if (accountStore.shared.user.get() === null) {
							resetAccountState();
							return LOGOUT_SKIPPED;
						}

						const syncLastError =
							accountStore.shared.sync.lastError.get();
						if (syncLastError === 'unauthorized') {
							resetAccountState();
							return LOGOUT_SKIPPED;
						}
						setMessage('同步尚未完成，请先重试同步后再退出');
						return LOGOUT_SKIPPED;
					}

					return action(csrfToken);
				})
				.then((result) => {
					if (result !== LOGOUT_SKIPPED) {
						resetAccountState();
					}
				})
				.catch((error: unknown) => {
					if (
						error instanceof AccountApiError &&
						error.status === 401
					) {
						resetAccountState();
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
		[csrfToken, isSubmitting]
	);
	const handleExport = useCallback(() => {
		if (isSubmitting || user === null) {
			return;
		}

		setIsSubmitting(true);
		setMessage(null);
		void exportAccountData()
			.then((data) => {
				downloadJson(
					`mystia-account-${user.username}`,
					JSON.stringify(data, null, 2)
				);
				setMessage('账号数据已导出');
			})
			.catch((error: unknown) => {
				if (handleUnauthorizedAccountError(error)) {
					return;
				}

				setMessage(error instanceof Error ? error.message : '导出失败');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [isSubmitting, user]);

	if (bootstrapStatus === 'error') {
		return (
			<div className="space-y-4">
				<Heading as="h3">账号</Heading>
				<p className="text-sm text-foreground-500">
					{getBootstrapErrorMessage(lastError)}
				</p>
			</div>
		);
	}

	if (bootstrapStatus !== 'anonymous' && bootstrapStatus !== 'loggedIn') {
		return null;
	}

	return (
		<div className="space-y-4">
			<Heading as="h3">账号</Heading>
			{user === null ? (
				<div className="w-full space-y-2 lg:w-1/2">
					<div className="flex gap-2">
						<Button
							color={authMode === 'login' ? 'primary' : 'default'}
							variant="flat"
							onPress={() => {
								setAuthMode('login');
							}}
						>
							登录
						</Button>
						<Button
							color={
								authMode === 'register' ? 'primary' : 'default'
							}
							variant="flat"
							onPress={() => {
								setAuthMode('register');
							}}
						>
							注册
						</Button>
					</div>
					<Input
						label="用户名"
						value={username}
						onValueChange={setUsername}
					/>
					<Input
						label="密码"
						type="password"
						value={password}
						onValueChange={setPassword}
					/>
					<Button
						color="primary"
						isDisabled={
							username.trim().length === 0 ||
							password.length === 0
						}
						isLoading={isSubmitting}
						variant="flat"
						onPress={handleAuth}
					>
						{authMode === 'login' ? '登录' : '注册'}
					</Button>
					<LegacyBackupImport />
				</div>
			) : (
				<div className="w-full space-y-3 lg:w-1/2">
					<p className="text-sm text-foreground-600">
						{user.username}
					</p>
					<div className="space-y-2">
						<Input
							label="当前密码"
							type="password"
							value={currentPassword}
							onValueChange={setCurrentPassword}
						/>
						<Input
							label="新密码"
							type="password"
							value={newPassword}
							onValueChange={setNewPassword}
						/>
						<Button
							color={passwordMustChange ? 'danger' : 'primary'}
							isDisabled={
								csrfToken === null ||
								currentPassword.length === 0 ||
								newPassword.length === 0
							}
							isLoading={isSubmitting}
							variant="flat"
							onPress={handlePasswordChange}
						>
							{passwordMustChange ? '更新密码后继续' : '修改密码'}
						</Button>
					</div>
					{!passwordMustChange && (
						<>
							<AccountSyncStatus />
							<LegacyBackupImport />
							<div className="flex flex-wrap gap-2">
								<Button
									isDisabled={isSubmitting}
									isLoading={isSubmitting}
									variant="flat"
									onPress={handleExport}
								>
									导出账号数据
								</Button>
								<Button
									isDisabled={
										isSubmitting || csrfToken === null
									}
									isLoading={isSubmitting}
									variant="flat"
									onPress={() => {
										logoutAfterFlush(logoutAccount);
									}}
								>
									退出登录
								</Button>
								<Button
									isDisabled={
										isSubmitting || csrfToken === null
									}
									isLoading={isSubmitting}
									variant="flat"
									onPress={() => {
										logoutAfterFlush(logoutAllAccount);
									}}
								>
									退出全部设备
								</Button>
								<Button
									color="warning"
									isDisabled={
										isSubmitting || csrfToken === null
									}
									isLoading={isSubmitting}
									variant="flat"
									onPress={() => {
										if (
											csrfToken === null ||
											isSubmitting
										) {
											return;
										}
										if (
											!globalThis.confirm(
												'确认清空账号云端数据？'
											)
										) {
											return;
										}
										setIsSubmitting(true);
										setMessage(null);
										void deleteAccountData(csrfToken)
											.then(({ state_epoch }) => {
												resetAccountSyncCloudStateAfterDelete(
													{
														stateEpoch: state_epoch,
														userId: user.id,
													}
												);
												void postAccountSyncBroadcastMessage(
													{
														namespaces: [],
														operationId:
															createAccountClientId(),
														state_epoch,
														tabId: 'local',
														type: 'data-deleted',
														userId: user.id,
													}
												);
												setMessage('云端数据已清空');
											})
											.catch((error: unknown) => {
												if (
													error instanceof
														AccountApiError &&
													error.status === 401
												) {
													resetAccountState();
													return;
												}
												setMessage(
													error instanceof Error
														? error.message
														: '清空云端数据失败'
												);
											})
											.finally(() => {
												setIsSubmitting(false);
											});
									}}
								>
									清空云端数据
								</Button>
								<Button
									color="danger"
									isDisabled={
										isSubmitting || csrfToken === null
									}
									isLoading={isSubmitting}
									variant="flat"
									onPress={() => {
										if (
											csrfToken === null ||
											isSubmitting
										) {
											return;
										}
										if (
											!globalThis.confirm(
												'确认删除账号？'
											)
										) {
											return;
										}
										setIsSubmitting(true);
										setMessage(null);
										void deleteAccount(csrfToken)
											.then(resetAccountState)
											.catch((error: unknown) => {
												if (
													error instanceof
														AccountApiError &&
													error.status === 401
												) {
													resetAccountState();
													return;
												}
												setMessage(
													error instanceof Error
														? error.message
														: '删除账号失败'
												);
											})
											.finally(() => {
												setIsSubmitting(false);
											});
									}}
								>
									删除账号
								</Button>
							</div>
						</>
					)}
				</div>
			)}
			{message !== null && (
				<p className="text-sm text-foreground-500">{message}</p>
			)}
		</div>
	);
}
