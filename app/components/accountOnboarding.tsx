'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@heroui/input';

import { Button, Modal } from '@/design/ui/components';
import {
	AccountApiError,
	loginAccount,
	registerAccount,
} from '@/lib/account/client/api';
import {
	applyAccountAuthSuccessResponse,
	refreshAccountState,
	resetAccountState,
} from '@/lib/account/client/session';
import { accountStore, globalStore } from '@/stores';
import Heading from './heading';

type TAuthMode = 'login' | 'register';

export default function AccountOnboarding() {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const hasSkippedOnboarding =
		accountStore.persistence.hasSkippedOnboarding.use();
	const [authMode, setAuthMode] = useState<TAuthMode>('login');
	const [message, setMessage] = useState<string | null>(null);
	const [password, setPassword] = useState('');
	const [username, setUsername] = useState('');
	const [isAuthRefreshFailed, setIsAuthRefreshFailed] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isSubmittingRef = useRef(false);
	const [portalContainer, setPortalContainer] = useState<Element | null>(
		null
	);
	const cloudCode = globalStore.persistence.cloudCode.use();
	const isOpen =
		(bootstrapStatus === 'anonymous' || isAuthRefreshFailed) &&
		!hasSkippedOnboarding;

	useEffect(() => {
		setPortalContainer(document.querySelector('#modal-portal-container'));
	}, []);

	const handleAuth = useCallback(() => {
		if (isSubmittingRef.current) {
			return;
		}
		const normalizedUsername = username.trim();
		if (normalizedUsername.length === 0 || password.length === 0) {
			setMessage('请输入用户名和密码');
			return;
		}

		isSubmittingRef.current = true;
		setIsSubmitting(true);
		setMessage(null);
		const request = authMode === 'login' ? loginAccount : registerAccount;
		void request({ password, username: normalizedUsername })
			.then(async (data) => {
				applyAccountAuthSuccessResponse(data);
				try {
					const refreshResult = await refreshAccountState();
					if (refreshResult === null) {
						return;
					}

					setIsAuthRefreshFailed(false);
					accountStore.persistence.hasSkippedOnboarding.set(true);
					setPassword('');
				} catch (error) {
					console.warn(
						'Account state refresh failed after successful authentication.',
						error
					);
					if (
						error instanceof AccountApiError &&
						error.status === 401
					) {
						setPassword('');
						setMessage('账号状态已失效，请重新登录');
						resetAccountState();
						setIsAuthRefreshFailed(false);
						return;
					}
					setIsAuthRefreshFailed(true);
					setMessage('账号状态刷新失败，请稍后重试');
				}
			})
			.catch((error: unknown) => {
				setMessage(error instanceof Error ? error.message : '认证失败');
				if (accountStore.shared.bootstrapStatus.get() === 'anonymous') {
					setIsAuthRefreshFailed(false);
				}
			})
			.finally(() => {
				isSubmittingRef.current = false;
				setIsSubmitting(false);
			});
	}, [authMode, password, username]);

	if (!isOpen) {
		return null;
	}

	return (
		<Modal
			isOpen
			{...(portalContainer === null ? {} : { portalContainer })}
			onClose={() => {
				accountStore.persistence.hasSkippedOnboarding.set(true);
			}}
		>
			<div className="w-full max-w-md space-y-4">
				<Heading as="h2" isFirst>
					账号同步
				</Heading>
				<p className="text-sm text-foreground-600">
					登录后可在自托管环境同步套餐、偏好、主题和教程状态。
				</p>
				{cloudCode !== null && (
					<p className="text-sm text-foreground-500">
						检测到本地旧备份码，登录或注册后会自动导入。
					</p>
				)}
				<div className="flex gap-2">
					<Button
						color={authMode === 'login' ? 'primary' : 'default'}
						variant="flat"
						onPress={() => {
							setAuthMode('login');
							setMessage(null);
						}}
					>
						登录
					</Button>
					<Button
						color={authMode === 'register' ? 'primary' : 'default'}
						variant="flat"
						onPress={() => {
							setAuthMode('register');
							setMessage(null);
						}}
					>
						注册
					</Button>
				</div>
				<Input
					autoComplete="username"
					label="用户名"
					value={username}
					onValueChange={setUsername}
				/>
				<Input
					autoComplete={
						authMode === 'login'
							? 'current-password'
							: 'new-password'
					}
					label="密码"
					type="password"
					value={password}
					onValueChange={setPassword}
				/>
				{message !== null && (
					<p className="text-sm text-danger" role="alert">
						{message}
					</p>
				)}
				<div className="flex justify-end gap-2">
					<Button
						variant="flat"
						onPress={() => {
							accountStore.persistence.hasSkippedOnboarding.set(
								true
							);
						}}
					>
						继续本地使用
					</Button>
					<Button
						color="primary"
						isDisabled={
							isSubmitting ||
							username.trim().length === 0 ||
							password.length === 0
						}
						isLoading={isSubmitting}
						variant="solid"
						onPress={handleAuth}
					>
						{authMode === 'login' ? '登录' : '注册'}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
