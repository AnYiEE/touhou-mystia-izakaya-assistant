'use client';

import {
	faKey,
	faShieldHalved,
	faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type SyntheticEvent, memo, useCallback } from 'react';

import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';

import { AdminMessage } from '@/features/admin/client/components/feedback';
import { AdminInputIcon } from '@/features/admin/client/components/filters';
import {
	AdminPanel,
	AdminPanelTitle,
} from '@/features/admin/client/components/panels';

interface IAdminLoginPanelProps {
	isAdminActionLoading: boolean;
	message: string | null;
	onLogin: () => void;
	onPasswordChange: (value: string) => void;
	onUsernameChange: (value: string) => void;
	password: string;
	trimmedUsername: string;
	username: string;
}

export const AdminLoginPanel = memo<IAdminLoginPanelProps>(
	function AdminLoginPanel({
		isAdminActionLoading,
		message,
		onLogin,
		onPasswordChange,
		onUsernameChange,
		password,
		trimmedUsername,
		username,
	}) {
		const handleSubmit = useCallback(
			(event: SyntheticEvent<HTMLFormElement>) => {
				event.preventDefault();
				onLogin();
			},
			[onLogin]
		);

		return (
			<AdminPanel className="space-y-4">
				<AdminPanelTitle icon={faUser}>管理员凭据</AdminPanelTitle>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<Input
						autoComplete="username"
						label="管理员用户名"
						startContent={<AdminInputIcon icon={faUser} />}
						value={username}
						onValueChange={onUsernameChange}
					/>
					<Input
						autoComplete="current-password"
						label="管理员密码"
						startContent={<AdminInputIcon icon={faKey} />}
						type="password"
						value={password}
						onValueChange={onPasswordChange}
					/>
					<Button
						fullWidth
						color="primary"
						isDisabled={
							isAdminActionLoading ||
							trimmedUsername.length === 0 ||
							password.length === 0
						}
						isLoading={isAdminActionLoading}
						startContent={
							isAdminActionLoading ? null : (
								<FontAwesomeIcon
									icon={faShieldHalved}
									className="w-3.5"
								/>
							)
						}
						type="submit"
						variant="flat"
					>
						登录
					</Button>
				</form>
				{message !== null && <AdminMessage message={message} />}
			</AdminPanel>
		);
	}
);
