'use client';

import { useCallback, useState } from 'react';

import { Input } from '@heroui/input';

import { Button, Modal } from '@/design/ui/components';
import {
	AccountApiError,
	changeAccountPassword,
	logoutAccount,
} from '@/lib/account/client/api';
import {
	refreshAccountState,
	resetAccountState,
} from '@/lib/account/client/session';
import { accountStore } from '@/stores/account';
import Heading from './heading';

export default function AccountPasswordMustChangeModal() {
	const csrfToken = accountStore.shared.csrfToken.use();
	const isLoggedIn = accountStore.shared.isLoggedIn.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();
	const [currentPassword, setCurrentPassword] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [newPassword, setNewPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isOpen = isLoggedIn && passwordMustChange;

	const handlePasswordChange = useCallback(() => {
		if (csrfToken === null) {
			return;
		}

		setIsSubmitting(true);
		setMessage(null);
		void changeAccountPassword(
			{ current_password: currentPassword, new_password: newPassword },
			csrfToken
		)
			.then(refreshAccountState)
			.then(() => {
				setCurrentPassword('');
				setNewPassword('');
			})
			.catch((error: unknown) => {
				setMessage(error instanceof Error ? error.message : '改密失败');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, currentPassword, newPassword]);

	const handleLogout = useCallback(() => {
		if (csrfToken === null) {
			setMessage(null);
			resetAccountState();
			return;
		}

		setIsSubmitting(true);
		setMessage(null);
		void logoutAccount(csrfToken)
			.then(() => {
				resetAccountState();
			})
			.catch((error: unknown) => {
				if (error instanceof AccountApiError && error.status === 401) {
					resetAccountState();
					return;
				}
				setMessage(error instanceof Error ? error.message : '退出失败');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken]);

	if (!isOpen) {
		return null;
	}

	return (
		<Modal
			isOpen
			portalContainer={document.querySelector('#modal-portal-container')}
		>
			<div className="w-full max-w-md space-y-4">
				<Heading as="h2" isFirst>
					更新密码
				</Heading>
				<p className="text-sm text-foreground-600">
					管理员已重置密码，请更新密码后继续使用账号同步。
				</p>
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
				{message !== null && (
					<p className="text-sm text-foreground-500">{message}</p>
				)}
				<div className="flex flex-wrap justify-end gap-2">
					<Button
						isLoading={isSubmitting}
						variant="flat"
						onPress={handleLogout}
					>
						退出登录
					</Button>
					<Button
						color="primary"
						isDisabled={
							csrfToken === null ||
							currentPassword.length === 0 ||
							newPassword.length === 0
						}
						isLoading={isSubmitting}
						variant="solid"
						onPress={handlePasswordChange}
					>
						更新密码
					</Button>
				</div>
			</div>
		</Modal>
	);
}
