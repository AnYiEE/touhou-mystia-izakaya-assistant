'use client';

import {
	faCheck,
	faFingerprint,
	faKey,
	faRightToBracket,
	faShieldHalved,
	faUser,
	faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo } from 'react';

import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';

import { getAccountClientErrorMessage } from '@/features/account/client/errorMessage';
import {
	NICKNAME_RULE_DESCRIPTION,
	PASSWORD_RULE_DESCRIPTION,
	USERNAME_RULE_DESCRIPTION,
} from '@/features/account/constants';

import {
	AccountAuthEntryMotion,
	AccountCollapseMotion,
	AccountInputIcon,
	AccountPanel,
	AccountPanelTitle,
} from './layout';
import { type IUseAccountAuthenticationResult } from './useAccountAuthentication';

const ACCOUNT_AUTH_PASSWORD_FORM_ID = 'account-auth-password-form';

interface IAccountAuthPanelProps extends IUseAccountAuthenticationResult {
	authCredentialErrorMessage: string | null;
	handleOpenLegalModal: () => void;
	isSubmitting: boolean;
	passwordDescription: string | undefined;
	registrationNicknameErrorMessage: string | null;
}

export default memo<IAccountAuthPanelProps>(function AccountAuthPanel({
	authCredentialErrorMessage,
	handleOpenLegalModal,
	isSubmitting,
	passwordDescription,
	registrationNicknameErrorMessage,
	...authentication
}) {
	const {
		authMode,
		authTermsCheckboxRef,
		handleAuthCredentialInputFocus,
		handleAuthPasswordChange,
		handleAuthSubmit,
		handleAuthTermsAcceptedChange,
		handleAuthTermsLabelPointerDown,
		handleAuthUsernameChange,
		handleLoginModePress,
		handlePasskeyAuthEntryPress,
		handlePasswordAuthEntryPress,
		handleRegisterModePress,
		handleWebAuthnAccountRegistration,
		handleWebAuthnLogin,
		hasAcceptedAuthTerms,
		isPasskeyPreferredAuthAvailable,
		isPasskeyRegistrationPromptVisible,
		isRegistrationNicknameInvalid,
		isRegistrationPasswordInvalid,
		isSsoContext,
		isWebauthnAccountRegistrationPending,
		isWebauthnLoginPending,
		isWebauthnSlow,
		password,
		registrationNickname,
		setRegistrationNickname,
		shouldHighlightAuthTerms,
		shouldShowAuthTermsConfirmation,
		shouldShowPasskeyPrimaryAuth,
		username,
	} = authentication;

	const authTermsConfirmation = shouldShowAuthTermsConfirmation ? (
		<div
			className={cn(
				'flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-small px-1.5 py-1 text-tiny leading-5 text-foreground-500 transition-colors duration-200 motion-reduce:transition-none',
				{
					'bg-warning/10 ring-1 ring-inset ring-warning/20 dark:bg-warning/20 dark:ring-warning/40':
						shouldHighlightAuthTerms,
				}
			)}
		>
			<input
				id="account-auth-terms-confirmation"
				ref={authTermsCheckboxRef}
				checked={hasAcceptedAuthTerms}
				className="peer sr-only"
				type="checkbox"
				onChange={handleAuthTermsAcceptedChange}
			/>
			<label
				htmlFor="account-auth-terms-confirmation"
				className="group inline-flex shrink-0 cursor-pointer items-center rounded-small outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
				onPointerDown={handleAuthTermsLabelPointerDown}
			>
				<span
					aria-hidden
					className={cn(
						'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-small border transition-all duration-200 ease-out active:scale-90 motion-reduce:transition-none',
						hasAcceptedAuthTerms
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-default-300 bg-transparent text-transparent group-hover:border-primary-400'
					)}
				>
					<FontAwesomeIcon
						icon={faCheck}
						className={cn(
							'!h-2 !w-2 transition-transform duration-200 ease-out motion-reduce:transition-none',
							hasAcceptedAuthTerms ? 'scale-100' : 'scale-0'
						)}
					/>
				</span>
			</label>
			<span className="inline-flex min-w-0 flex-wrap items-baseline leading-5">
				<label
					htmlFor="account-auth-terms-confirmation"
					className="cursor-pointer rounded-small outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
					onPointerDown={handleAuthTermsLabelPointerDown}
				>
					我已阅读并同意
				</label>
				<Button
					disableRipple
					radius="none"
					size="sm"
					variant="light"
					className="h-auto min-h-0 min-w-0 overflow-visible p-0 align-baseline text-tiny leading-5 text-primary-600 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent"
					onPress={handleOpenLegalModal}
				>
					<span className="group relative inline-block leading-5">
						法律声明
						<span className="absolute bottom-0.5 left-1/2 h-px w-0 -translate-x-1/2 bg-current transition-width group-data-[focus-visible=true]:w-full group-data-[hover=true]:w-full motion-reduce:transition-none" />
					</span>
				</Button>
			</span>
		</div>
	) : null;

	return (
		<div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
			<AccountPanel className="flex flex-col gap-3">
				<AccountAuthEntryMotion
					motionKey={
						shouldShowPasskeyPrimaryAuth ? 'passkey' : 'password'
					}
				>
					{shouldShowPasskeyPrimaryAuth ? (
						<div className="space-y-3">
							<div className="space-y-3">
								<div className="flex items-center gap-3 px-1">
									<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-small bg-primary/10 text-primary-600">
										<FontAwesomeIcon
											icon={faFingerprint}
											className="w-4"
										/>
									</span>
									<div className="min-w-0">
										<p className="text-small font-medium leading-5 text-foreground-700">
											通行密钥
										</p>
										<p
											className={cn(
												'text-tiny leading-5',
												authCredentialErrorMessage ===
													null
													? 'text-foreground-500'
													: 'text-danger-600 dark:text-danger'
											)}
										>
											{authCredentialErrorMessage ??
												(isWebauthnSlow
													? getAccountClientErrorMessage(
															'webauthn-timeout'
														)
													: isWebauthnLoginPending ||
														  isWebauthnAccountRegistrationPending
														? '正在等待系统验证…'
														: '无需输入密码，按系统提示确认即可')}
										</p>
									</div>
								</div>
								<Button
									fullWidth
									color="primary"
									isDisabled={
										isWebauthnAccountRegistrationPending
									}
									isLoading={isWebauthnLoginPending}
									startContent={
										isWebauthnLoginPending ? null : (
											<FontAwesomeIcon
												icon={faFingerprint}
												className="w-4"
											/>
										)
									}
									variant="flat"
									onPress={handleWebAuthnLogin}
								>
									使用通行密钥继续
								</Button>
							</div>
							{authTermsConfirmation}
							<div className="space-y-3">
								<AccountCollapseMotion motionKey="passkey-registration-prompt">
									{isPasskeyRegistrationPromptVisible ? (
										<Button
											fullWidth
											color="primary"
											isDisabled={isWebauthnLoginPending}
											isLoading={
												isWebauthnAccountRegistrationPending
											}
											startContent={
												isWebauthnAccountRegistrationPending ? null : (
													<FontAwesomeIcon
														icon={faUserPlus}
														className="w-4"
													/>
												)
											}
											variant="flat"
											onPress={
												handleWebAuthnAccountRegistration
											}
										>
											使用通行密钥注册新账号
										</Button>
									) : null}
								</AccountCollapseMotion>
								<Button
									fullWidth
									size="sm"
									startContent={
										<FontAwesomeIcon
											icon={faKey}
											className="w-4"
										/>
									}
									className="h-9 text-foreground-600"
									variant="light"
									onPress={handlePasswordAuthEntryPress}
								>
									使用用户名和密码注册/登录
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-3">
							{isPasskeyPreferredAuthAvailable
								? null
								: authTermsConfirmation}
							<div>
								<div className="flex gap-1 rounded-small bg-default-100 p-1 dark:bg-default-50/20">
									<Button
										fullWidth
										color={
											authMode === 'login'
												? 'primary'
												: 'default'
										}
										startContent={
											<FontAwesomeIcon
												icon={faRightToBracket}
												className="w-4"
											/>
										}
										variant={
											authMode === 'login'
												? 'flat'
												: 'light'
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
											authMode === 'register'
												? 'flat'
												: 'light'
										}
										onPress={handleRegisterModePress}
									>
										注册
									</Button>
								</div>
								<form
									id={ACCOUNT_AUTH_PASSWORD_FORM_ID}
									className="mt-3"
									onSubmit={handleAuthSubmit}
								>
									<Input
										autoComplete={
											authMode === 'login'
												? 'username webauthn'
												: 'username'
										}
										description={USERNAME_RULE_DESCRIPTION}
										isInvalid={
											authCredentialErrorMessage !== null
										}
										label="用户名"
										placeholder="输入账号用户名"
										startContent={
											<AccountInputIcon icon={faUser} />
										}
										value={username}
										validationBehavior="aria"
										onFocus={handleAuthCredentialInputFocus}
										onValueChange={handleAuthUsernameChange}
									/>
									<AccountCollapseMotion motionKey="registration-nickname">
										{authMode === 'register' ? (
											<div className="pt-3">
												<Input
													autoComplete="nickname"
													description={
														NICKNAME_RULE_DESCRIPTION
													}
													errorMessage={
														isRegistrationNicknameInvalid
															? NICKNAME_RULE_DESCRIPTION
															: (registrationNicknameErrorMessage ??
																undefined)
													}
													isInvalid={
														isRegistrationNicknameInvalid ||
														registrationNicknameErrorMessage !==
															null
													}
													label="昵称（可选）"
													placeholder="设置显示名称"
													startContent={
														<AccountInputIcon
															icon={faUser}
														/>
													}
													value={registrationNickname}
													onValueChange={
														setRegistrationNickname
													}
												/>
											</div>
										) : null}
									</AccountCollapseMotion>
									<div className="mt-3">
										<Input
											autoComplete={
												authMode === 'login'
													? 'current-password webauthn'
													: 'new-password'
											}
											description={passwordDescription}
											errorMessage={
												isRegistrationPasswordInvalid
													? PASSWORD_RULE_DESCRIPTION
													: (authCredentialErrorMessage ??
														undefined)
											}
											isInvalid={
												isRegistrationPasswordInvalid ||
												authCredentialErrorMessage !==
													null
											}
											label="密码"
											placeholder={
												authMode === 'login'
													? '输入密码'
													: '设置登录密码'
											}
											startContent={
												<AccountInputIcon
													icon={faKey}
												/>
											}
											type="password"
											value={password}
											validationBehavior="aria"
											onFocus={
												handleAuthCredentialInputFocus
											}
											onValueChange={
												handleAuthPasswordChange
											}
										/>
									</div>
								</form>
							</div>
							<div className="space-y-3">
								<Button
									fullWidth
									color="primary"
									form={ACCOUNT_AUTH_PASSWORD_FORM_ID}
									isDisabled={
										username.trim().length === 0 ||
										password.length === 0 ||
										!hasAcceptedAuthTerms ||
										isRegistrationPasswordInvalid ||
										isRegistrationNicknameInvalid
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
									type="submit"
									variant="flat"
								>
									{authMode === 'login'
										? '登录账号'
										: '创建账号'}
								</Button>
								{isPasskeyPreferredAuthAvailable ? (
									<Button
										fullWidth
										size="sm"
										startContent={
											<FontAwesomeIcon
												icon={faFingerprint}
												className="w-4"
											/>
										}
										className="h-9 text-foreground-600"
										variant="light"
										onPress={handlePasskeyAuthEntryPress}
									>
										使用通行密钥注册/登录
									</Button>
								) : null}
							</div>
						</div>
					)}
				</AccountAuthEntryMotion>
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
						<p>注册后会自动登录；登录后即可在授权页面完成确认。</p>
					</>
				) : (
					<>
						<p>
							账号会同步此浏览器保存的数据，让其他设备继续使用相同配置。
						</p>
						<p>
							注册后会自动登录；登录后，本设备尚未上传的更改会自动继续同步。
						</p>
					</>
				)}
			</AccountPanel>
		</div>
	);
});
