'use client';

import { faCircleInfo, faKey, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { type SyntheticEvent, memo } from 'react';

import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';

import AccountSyncStatus from '@/features/account/client/components/AccountSyncStatus';
import { accountMessages } from '@/features/account/client/messages';
import {
	NICKNAME_MAX_LENGTH,
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
} from '@/features/account/constants';
import type { IAccountUserProfile } from '@/features/account/contracts';

import {
	AccountCollapseMotion,
	AccountInputIcon,
	AccountPanel,
	AccountPanelTitle,
} from './accountPanelLayout';

import { useI18n } from '@/shared/i18n/useI18n';

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
		const { t } = useI18n(accountMessages);

		return (
			<AccountPanel className="space-y-4">
				<AccountPanelTitle icon={faUser}>
					{t('account.manager.passwordChange.currentAccount')}
				</AccountPanelTitle>
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
										{t(
											'account.manager.profile.usernameDisplay'
										)}
										{user.username}
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
	const { t } = useI18n(accountMessages);
	const normalizedProfileUsername = profileUsername.trim();

	return (
		<AccountPanel className="space-y-4">
			<AccountPanelTitle icon={faKey}>
				{passwordMustChange
					? t('account.manager.profile.titleUpdatePassword')
					: isInitialPasswordSetup
						? t('account.manager.profile.titleSetupPassword')
						: t('account.manager.profile.titleAccountSettings')}
			</AccountPanelTitle>
			{!passwordMustChange && (
				<form onSubmit={handleProfileChangeSubmit}>
					<Input
						autoComplete="username"
						description={
							isInitialPasswordSetup
								? t(
										'account.manager.profile.usernameChangeHint'
									)
								: t('account.usernameRule', {
										max: USERNAME_MAX_LENGTH,
										min: USERNAME_MIN_LENGTH,
									})
						}
						errorMessage={
							isProfileUsernameInvalid
								? t('account.usernameRule', {
										max: USERNAME_MAX_LENGTH,
										min: USERNAME_MIN_LENGTH,
									})
								: (profileUsernameErrorMessage ?? undefined)
						}
						isInvalid={
							isProfileUsernameInvalid ||
							profileUsernameErrorMessage !== null
						}
						isReadOnly={isProfileUsernameReadOnly}
						label={t('account.manager.field.username')}
						placeholder={t(
							'account.manager.profile.usernamePlaceholder'
						)}
						startContent={<AccountInputIcon icon={faUser} />}
						value={profileUsername}
						onValueChange={handleProfileUsernameChange}
					/>
					<AccountCollapseMotion motionKey="profile-current-password">
						{isProfileCurrentPasswordRequired ? (
							<div className="pt-3">
								<Input
									autoComplete="current-password"
									description={t(
										'account.manager.profile.currentPasswordRequired'
									)}
									errorMessage={
										profileCurrentPasswordErrorMessage ??
										undefined
									}
									isInvalid={
										profileCurrentPasswordErrorMessage !==
										null
									}
									label={t(
										'account.manager.field.currentPassword'
									)}
									placeholder={t(
										'account.manager.profile.currentPasswordPlaceholder'
									)}
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
							description={t('account.nicknameRule', {
								max: NICKNAME_MAX_LENGTH,
							})}
							errorMessage={
								isProfileNicknameInvalid
									? t('account.nicknameRule', {
											max: NICKNAME_MAX_LENGTH,
										})
									: (profileNicknameErrorMessage ?? undefined)
							}
							isInvalid={
								isProfileNicknameInvalid ||
								profileNicknameErrorMessage !== null
							}
							label={t('account.manager.field.nickname')}
							placeholder={t('account.manager.field.displayName')}
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
						{t('account.manager.profile.save')}
					</Button>
				</form>
			)}
			<form className="space-y-3" onSubmit={handlePasswordChangeSubmit}>
				{passwordMustChange && (
					<p className="text-small leading-5 text-danger-600 dark:text-danger">
						{t('account.manager.profile.passwordMustChangeNotice')}
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
								{t(
									'account.manager.profile.initialPasswordHint'
								)}
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
							label={t('account.manager.field.currentPassword')}
							placeholder={t(
								'account.manager.profile.currentPasswordPlaceholder'
							)}
							type="password"
							value={currentPassword}
							onValueChange={handleCurrentPasswordChange}
						/>
					)}
				</AccountCollapseMotion>
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
					label={
						isInitialPasswordSetup
							? t('account.manager.field.loginPassword')
							: t('account.manager.field.newPassword')
					}
					placeholder={
						isInitialPasswordSetup
							? t(
									'account.manager.auth.passwordPlaceholderRegister'
								)
							: t(
									'account.manager.profile.newPasswordPlaceholder'
								)
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
						? t('account.manager.profile.updatePasswordAndContinue')
						: isInitialPasswordSetup
							? t('account.manager.profile.titleSetupPassword')
							: t('account.manager.profile.changePassword')}
				</Button>
			</form>
		</AccountPanel>
	);
});
