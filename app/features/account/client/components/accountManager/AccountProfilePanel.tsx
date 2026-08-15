'use client';

import { faCircleInfo, faKey, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { type SyntheticEvent, memo } from 'react';

import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';

import AccountSyncStatus from '@/features/account/client/components/AccountSyncStatus';
import {
	NICKNAME_RULE_DESCRIPTION,
	PASSWORD_RULE_DESCRIPTION,
	USERNAME_RULE_DESCRIPTION,
} from '@/features/account/constants';
import type { IAccountUserProfile } from '@/features/account/contracts';

import {
	AccountCollapseMotion,
	AccountInputIcon,
	AccountPanel,
	AccountPanelTitle,
} from './accountPanelLayout';

interface IAccountProfileSummaryProps {
	accountStatusDescription: string;
	accountStatusMessage: string | null;
	isAccountSyncPaused: boolean;
	isMessageSuccess: boolean;
	passwordMustChange: boolean;
	user: IAccountUserProfile;
}

export const AccountProfileSummary = memo<IAccountProfileSummaryProps>(
	function AccountProfileSummary({
		accountStatusDescription,
		accountStatusMessage,
		isAccountSyncPaused,
		isMessageSuccess,
		passwordMustChange,
		user,
	}) {
		return (
			<AccountPanel className="space-y-4">
				<AccountPanelTitle icon={faUser}>当前账号</AccountPanelTitle>
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary-600">
						<FontAwesomeIcon icon={faUser} className="w-4" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-base font-medium leading-none">
							{user.nickname ?? user.username}
						</p>
						<AccountCollapseMotion motionKey="account-username-subtitle">
							{user.nickname === null ? null : (
								<div className="pt-1">
									<p className="truncate text-tiny text-foreground-500">
										用户名：{user.username}
									</p>
								</div>
							)}
						</AccountCollapseMotion>
					</div>
					<span
						aria-atomic="true"
						aria-live="polite"
						className={cn(
							'max-w-28 shrink truncate rounded-full px-2 py-1 text-tiny leading-none sm:max-w-40',
							isAccountSyncPaused
								? 'bg-warning/15 text-warning-700 dark:text-warning'
								: accountStatusMessage === null
									? 'bg-default-100 text-foreground-500 dark:bg-default-50/20'
									: isMessageSuccess
										? 'bg-success/15 text-success-700 dark:text-success'
										: 'bg-danger/15 text-danger-600 dark:text-danger'
						)}
						role={
							accountStatusMessage === null &&
							!isAccountSyncPaused
								? undefined
								: 'status'
						}
						title={accountStatusDescription}
					>
						{accountStatusDescription}
					</span>
				</div>
				{!passwordMustChange && (
					<div className="border-t border-default-200/80 pt-4">
						<AccountSyncStatus />
					</div>
				)}
			</AccountPanel>
		);
	}
);

interface IAccountProfilePanelProps {
	csrfToken: string | null;
	currentPassword: string;
	handleCurrentPasswordChange: (value: string) => void;
	handlePasswordChangeSubmit: (
		event: SyntheticEvent<HTMLFormElement>
	) => void;
	handleProfileChangeSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
	handleProfileCurrentPasswordChange: (value: string) => void;
	handleProfileNicknameChange: (value: string) => void;
	handleProfileUsernameChange: (value: string) => void;
	isInitialPasswordSetup: boolean;
	isNewPasswordInvalid: boolean;
	isProfileCurrentPasswordRequired: boolean;
	isProfileNicknameInvalid: boolean;
	isProfileUnchanged: boolean;
	isProfileUsernameChangeBlockedByMissingPassword: boolean;
	isProfileUsernameInvalid: boolean;
	isProfileUsernameReadOnly: boolean;
	isSubmitting: boolean;
	newPassword: string;
	passwordChangeErrorMessage: string | null;
	passwordMustChange: boolean;
	profileCurrentPassword: string;
	profileCurrentPasswordErrorMessage: string | null;
	profileNickname: string;
	profileNicknameErrorMessage: string | null;
	profileUsername: string;
	profileUsernameErrorMessage: string | null;
	setNewPassword: (value: string) => void;
}

export default memo<IAccountProfilePanelProps>(function AccountProfilePanel({
	csrfToken,
	currentPassword,
	handleCurrentPasswordChange,
	handlePasswordChangeSubmit,
	handleProfileChangeSubmit,
	handleProfileCurrentPasswordChange,
	handleProfileNicknameChange,
	handleProfileUsernameChange,
	isInitialPasswordSetup,
	isNewPasswordInvalid,
	isProfileCurrentPasswordRequired,
	isProfileNicknameInvalid,
	isProfileUnchanged,
	isProfileUsernameChangeBlockedByMissingPassword,
	isProfileUsernameInvalid,
	isProfileUsernameReadOnly,
	isSubmitting,
	newPassword,
	passwordChangeErrorMessage,
	passwordMustChange,
	profileCurrentPassword,
	profileCurrentPasswordErrorMessage,
	profileNickname,
	profileNicknameErrorMessage,
	profileUsername,
	profileUsernameErrorMessage,
	setNewPassword,
}) {
	const normalizedProfileUsername = profileUsername.trim();

	return (
		<AccountPanel className="space-y-4">
			<AccountPanelTitle icon={faKey}>
				{passwordMustChange
					? '更新密码'
					: isInitialPasswordSetup
						? '设置登录密码'
						: '账号设置'}
			</AccountPanelTitle>
			{!passwordMustChange && (
				<form onSubmit={handleProfileChangeSubmit}>
					<Input
						autoComplete="username"
						description={
							isInitialPasswordSetup
								? '请先设置登录密码后再修改用户名；昵称可直接修改'
								: USERNAME_RULE_DESCRIPTION
						}
						errorMessage={
							isProfileUsernameInvalid
								? USERNAME_RULE_DESCRIPTION
								: (profileUsernameErrorMessage ?? undefined)
						}
						isInvalid={
							isProfileUsernameInvalid ||
							profileUsernameErrorMessage !== null
						}
						isReadOnly={isProfileUsernameReadOnly}
						label="用户名"
						placeholder="输入新用户名"
						startContent={<AccountInputIcon icon={faUser} />}
						value={profileUsername}
						onValueChange={handleProfileUsernameChange}
					/>
					<AccountCollapseMotion motionKey="profile-current-password">
						{isProfileCurrentPasswordRequired ? (
							<div className="pt-3">
								<Input
									autoComplete="current-password"
									description="修改用户名需要确认当前密码"
									errorMessage={
										profileCurrentPasswordErrorMessage ??
										undefined
									}
									isInvalid={
										profileCurrentPasswordErrorMessage !==
										null
									}
									label="当前密码"
									placeholder="确认当前密码"
									startContent={
										<AccountInputIcon icon={faKey} />
									}
									type="password"
									value={profileCurrentPassword}
									onValueChange={
										handleProfileCurrentPasswordChange
									}
								/>
							</div>
						) : null}
					</AccountCollapseMotion>
					<div className="mt-3">
						<Input
							autoComplete="nickname"
							description={NICKNAME_RULE_DESCRIPTION}
							errorMessage={
								isProfileNicknameInvalid
									? NICKNAME_RULE_DESCRIPTION
									: (profileNicknameErrorMessage ?? undefined)
							}
							isInvalid={
								isProfileNicknameInvalid ||
								profileNicknameErrorMessage !== null
							}
							label="昵称"
							placeholder="显示名称"
							startContent={<AccountInputIcon icon={faUser} />}
							value={profileNickname}
							onValueChange={handleProfileNicknameChange}
						/>
					</div>
					<Button
						className="mt-3"
						fullWidth
						color="primary"
						isDisabled={
							csrfToken === null ||
							(isProfileCurrentPasswordRequired &&
								profileCurrentPassword.length === 0) ||
							normalizedProfileUsername.length === 0 ||
							isProfileUsernameInvalid ||
							isProfileNicknameInvalid ||
							isProfileUsernameChangeBlockedByMissingPassword ||
							isProfileUnchanged
						}
						isLoading={isSubmitting}
						startContent={
							isSubmitting ? null : (
								<FontAwesomeIcon
									icon={faUser}
									className="w-4"
								/>
							)
						}
						type="submit"
						variant="flat"
					>
						保存资料
					</Button>
				</form>
			)}
			<form className="space-y-3" onSubmit={handlePasswordChangeSubmit}>
				{passwordMustChange && (
					<p className="text-small leading-5 text-danger-600 dark:text-danger">
						管理员已要求更新密码，完成后才能继续同步。
					</p>
				)}
				<AccountCollapseMotion motionKey="initial-password-hint">
					{isInitialPasswordSetup ? (
						<div className="flex items-start gap-2 rounded-medium border border-default-200 bg-default-50/40 px-3 py-2 text-small leading-5 text-foreground-600">
							<FontAwesomeIcon
								icon={faCircleInfo}
								className="mt-1 w-3.5 shrink-0 text-primary-600"
							/>
							<p>
								设置登录密码后，可在不支持通行密钥的设备上使用用户名密码登录。
							</p>
						</div>
					) : null}
				</AccountCollapseMotion>
				<AccountCollapseMotion motionKey="password-current-input">
					{isInitialPasswordSetup ? null : (
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
					)}
				</AccountCollapseMotion>
				<Input
					autoComplete="new-password"
					description={PASSWORD_RULE_DESCRIPTION}
					errorMessage={
						isNewPasswordInvalid
							? PASSWORD_RULE_DESCRIPTION
							: undefined
					}
					isInvalid={isNewPasswordInvalid}
					label={isInitialPasswordSetup ? '登录密码' : '新密码'}
					placeholder={
						isInitialPasswordSetup ? '设置登录密码' : '输入新密码'
					}
					type="password"
					value={newPassword}
					onValueChange={setNewPassword}
				/>
				<Button
					fullWidth
					color={passwordMustChange ? 'danger' : 'primary'}
					isDisabled={
						csrfToken === null ||
						(!isInitialPasswordSetup &&
							currentPassword.length === 0) ||
						newPassword.length === 0 ||
						isNewPasswordInvalid
					}
					isLoading={isSubmitting}
					startContent={
						isSubmitting ? null : (
							<FontAwesomeIcon icon={faKey} className="w-4" />
						)
					}
					type="submit"
					variant="flat"
				>
					{passwordMustChange
						? '更新密码后继续'
						: isInitialPasswordSetup
							? '设置登录密码'
							: '修改密码'}
				</Button>
			</form>
		</AccountPanel>
	);
});
