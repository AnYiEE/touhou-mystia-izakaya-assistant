'use client';

import { useCallback, useEffect, useState } from 'react';

import { Input } from '@heroui/input';

import { Button, Modal } from '@/design/ui/components';
import { loginAccount, registerAccount } from '@/lib/account/client/api';
import { refreshAccountState } from '@/lib/account/client/session';
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
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [portalContainer, setPortalContainer] = useState<Element | null>(
		null
	);
	const cloudCode = globalStore.persistence.cloudCode.use();
	const isOpen = bootstrapStatus === 'anonymous' && !hasSkippedOnboarding;

	useEffect(() => {
		setPortalContainer(document.querySelector('#modal-portal-container'));
	}, []);

	const handleAuth = useCallback(() => {
		if (isSubmitting) {
			return;
		}

		setIsSubmitting(true);
		setMessage(null);
		const request = authMode === 'login' ? loginAccount : registerAccount;
		void request({ password, username })
			.then(refreshAccountState)
			.then(() => {
				accountStore.persistence.hasSkippedOnboarding.set(true);
			})
			.catch((error: unknown) => {
				setMessage(error instanceof Error ? error.message : '认证失败');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [authMode, isSubmitting, password, username]);

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
						}}
					>
						登录
					</Button>
					<Button
						color={authMode === 'register' ? 'primary' : 'default'}
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
				{message !== null && (
					<p className="text-sm text-foreground-500">{message}</p>
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
							username.length === 0 ||
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
