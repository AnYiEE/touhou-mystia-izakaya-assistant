'use client';

import { useRouter } from 'next/navigation';
import { type SyntheticEvent, useCallback, useEffect, useState } from 'react';

import { publishAccountRuntimeInvalidation } from '@/features/account/client/accountRuntimeInvalidation';
import {
	changeAccountPassword,
	changeAccountProfile,
	setInitialAccountPassword,
} from '@/features/account/client/api';
import { createAccountClientId } from '@/features/account/client/clientId';
import { ACCOUNT_CLIENT_MESSAGE_MAP } from '@/features/account/client/copy';
import { getAccountClientErrorMessage } from '@/features/account/client/errorMessage';
import {
	applyAccountAuthSuccessResponse,
	checkCurrentAccountAuthContext,
	refreshAccountState,
	refreshAccountStateFromInvalidation,
} from '@/features/account/client/session';
import { postAccountSyncBroadcastMessage } from '@/features/account/client/sync/broadcast';
import {
	PASSWORD_RULE_DESCRIPTION,
	checkNicknamePolicy,
	checkPasswordPolicy,
	checkUsernamePolicy,
	normalizeNickname,
} from '@/features/account/constants';
import type { IAccountUserProfile } from '@/features/account/contracts';
import { trackEvent } from '@/features/analytics/client/trackEvent';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	type IAccountActionController,
	handleUnauthorizedAccountActionError,
	handleUnauthorizedAccountError,
} from './controller';
import { ACCOUNT_MANAGER_MESSAGE_MAP } from './copy';
import { type IUseAccountPasskeysResult } from './useAccountPasskeys';

interface IUseAccountProfileOptions {
	controller: IAccountActionController;
	csrfToken: string | null;
	hasPassword: boolean;
	passwordMustChange: boolean;
	signalCurrentWebAuthnUserDetails: IUseAccountPasskeysResult['signalCurrentWebAuthnUserDetails'];
	user: IAccountUserProfile | null;
	vibrate: () => void;
}

interface IUseAccountProfileResult {
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
	newPassword: string;
	passwordChangeError: string | null;
	profileCurrentPassword: string;
	profileError: string | null;
	profileNickname: string;
	profileUsername: string;
	setNewPassword: (value: string) => void;
}

export function useAccountProfile({
	controller: { isSubmitting, setIsSubmitting, setMessage },
	csrfToken,
	hasPassword,
	passwordMustChange,
	signalCurrentWebAuthnUserDetails,
	user,
	vibrate,
}: IUseAccountProfileOptions): IUseAccountProfileResult {
	const router = useRouter();

	const [currentPassword, setCurrentPassword] = useState('');

	const [newPassword, setNewPassword] = useState('');

	const [passwordChangeError, setPasswordChangeError] = useState<
		string | null
	>(null);

	const [profileUsername, setProfileUsername] = useState('');

	const [profileNickname, setProfileNickname] = useState('');

	const [profileCurrentPassword, setProfileCurrentPassword] = useState('');

	const [profileError, setProfileError] = useState<string | null>(null);

	const isNewPasswordInvalid =
		newPassword.length > 0 && !checkPasswordPolicy(newPassword);
	const normalizedProfileUsername = profileUsername.trim();
	const isProfileUsernameInvalid =
		normalizedProfileUsername.length > 0 &&
		!checkUsernamePolicy(normalizedProfileUsername);
	const isProfileUsernameUnchanged =
		user !== null &&
		normalizedProfileUsername.toLowerCase() === user.username.toLowerCase();
	const normalizedProfileNickname = normalizeNickname(profileNickname);
	const isProfileNicknameInvalid =
		normalizedProfileNickname !== null &&
		!checkNicknamePolicy(normalizedProfileNickname);
	const isProfileNicknameUnchanged =
		user !== null && normalizedProfileNickname === user.nickname;
	const isProfileUnchanged =
		isProfileUsernameUnchanged && isProfileNicknameUnchanged;
	const isInitialPasswordSetup = user !== null && !hasPassword;
	const isProfileUsernameReadOnly = !hasPassword;
	const isProfileUsernameChangeBlockedByMissingPassword =
		!hasPassword && !isProfileUsernameUnchanged;
	const isProfileCurrentPasswordRequired =
		hasPassword && !isProfileUsernameUnchanged;

	useEffect(() => {
		setProfileUsername(user?.username ?? '');
		setProfileNickname(user?.nickname ?? '');
		setProfileCurrentPassword('');
		setProfileError(null);
	}, [user?.id, user?.nickname, user?.username]);

	const handleCurrentPasswordChange = useCallback((value: string) => {
		setCurrentPassword(value);
		setPasswordChangeError(null);
	}, []);

	const handlePasswordChange = useCallback(() => {
		if (csrfToken === null || isSubmitting || user === null) {
			return;
		}

		vibrate();

		trackEvent(
			trackEvent.category.click,
			'Account Password Button',
			isInitialPasswordSetup
				? 'Initial Set'
				: passwordMustChange
					? 'Force Change'
					: 'Change'
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

		const request = isInitialPasswordSetup
			? setInitialAccountPassword(
					{ new_password: newPassword },
					csrfToken
				)
			: changeAccountPassword(
					{
						current_password: currentPassword,
						new_password: newPassword,
					},
					csrfToken
				);

		void request
			.then((result) => {
				if (result.status === 'error') {
					if (
						result.message === 'credential-changed' ||
						result.message === 'password-already-set'
					) {
						if (
							!checkCurrentAccountAuthContext(expectedAuthContext)
						) {
							return;
						}
						setMessage(result.message);
						void publishAccountRuntimeInvalidation({
							reason: 'credential-changed',
							stateEpoch: user.state_epoch,
							userId: user.id,
						});
						void refreshAccountStateFromInvalidation().catch(
							(error: unknown) => {
								if (
									handleUnauthorizedAccountError(
										error,
										expectedAuthContext
									) ||
									!checkCurrentAccountAuthContext(
										expectedAuthContext
									)
								) {
									return;
								}
								setMessage(
									getAccountClientErrorMessage(
										error instanceof Error
											? error.message
											: '',
										ACCOUNT_CLIENT_MESSAGE_MAP.accountStateRefreshFailed
									)
								);
							}
						);
						return;
					}
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
				setMessage(
					isInitialPasswordSetup
						? ACCOUNT_MANAGER_MESSAGE_MAP.passwordSet
						: ACCOUNT_MANAGER_MESSAGE_MAP.passwordUpdated
				);
				void publishAccountRuntimeInvalidation({
					reason: 'password-changed',
					stateEpoch: data.user.state_epoch,
					userId: data.user.id,
				});

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
				setMessage(
					error instanceof Error
						? error.message
						: ACCOUNT_CLIENT_MESSAGE_MAP.passwordChangeFailed
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [
		csrfToken,
		currentPassword,
		isInitialPasswordSetup,
		isSubmitting,
		newPassword,
		passwordMustChange,
		setIsSubmitting,
		setMessage,
		user,
		vibrate,
	]);

	const handlePasswordChangeSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			handlePasswordChange();
		},
		[handlePasswordChange]
	);

	const handleProfileUsernameChange = useCallback((value: string) => {
		setProfileUsername(value);
		setProfileError(null);
	}, []);

	const handleProfileNicknameChange = useCallback((value: string) => {
		setProfileNickname(value);
		setProfileError(null);
	}, []);

	const handleProfileCurrentPasswordChange = useCallback((value: string) => {
		setProfileCurrentPassword(value);
		setProfileError(null);
	}, []);

	const handleProfileChange = useCallback(() => {
		if (csrfToken === null || isSubmitting || user === null) {
			return;
		}

		vibrate();

		const usernameNext = profileUsername.trim();
		if (usernameNext !== profileUsername) {
			setProfileUsername(usernameNext);
		}

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Change Profile'
		);

		if (!checkUsernamePolicy(usernameNext)) {
			setProfileError('invalid-username');
			setMessage(null);
			return;
		}
		if (
			usernameNext.toLowerCase() === user.username.toLowerCase() &&
			isProfileNicknameUnchanged
		) {
			setProfileError(null);
			setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.profileUpdated);
			return;
		}
		if (isProfileNicknameInvalid) {
			setProfileError('invalid-nickname');
			setMessage(null);
			return;
		}
		if (isProfileUsernameChangeBlockedByMissingPassword) {
			setProfileError('password-not-set');
			setMessage(null);
			return;
		}

		setIsSubmitting(true);
		setMessage(null);
		setProfileError(null);

		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};

		void changeAccountProfile(
			{
				...(isProfileUsernameUnchanged
					? {}
					: {
							current_password: profileCurrentPassword,
							username: usernameNext,
						}),
				...(isProfileNicknameUnchanged
					? {}
					: { nickname: normalizedProfileNickname }),
			},
			csrfToken
		)
			.then((result) => {
				if (result.status === 'error') {
					if (result.message === 'credential-changed') {
						if (
							!checkCurrentAccountAuthContext(expectedAuthContext)
						) {
							return;
						}
						setProfileError(null);
						setMessage(result.message);
						void publishAccountRuntimeInvalidation({
							reason: 'credential-changed',
							stateEpoch: user.state_epoch,
							userId: user.id,
						});
						void refreshAccountStateFromInvalidation().catch(
							(error: unknown) => {
								if (
									handleUnauthorizedAccountError(
										error,
										expectedAuthContext
									) ||
									!checkCurrentAccountAuthContext(
										expectedAuthContext
									)
								) {
									return;
								}
								setProfileError(null);
								setMessage(
									getAccountClientErrorMessage(
										error instanceof Error
											? error.message
											: '',
										ACCOUNT_CLIENT_MESSAGE_MAP.accountStateRefreshFailed
									)
								);
							}
						);
						return;
					}
					if (result.message === 'invalid-password') {
						if (
							!checkCurrentAccountAuthContext(expectedAuthContext)
						) {
							return;
						}

						setProfileError(result.message);
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
					if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
						return;
					}

					setProfileError(result.message);
					setMessage(null);
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

				setProfileCurrentPassword('');
				setProfileNickname(data.user.nickname ?? '');
				setProfileUsername(data.user.username);
				setProfileError(null);
				setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.profileUpdated);
				signalCurrentWebAuthnUserDetails({
					displayName: data.user.nickname ?? data.user.username,
					userId: data.user.id,
					username: data.user.username,
				});
				void postAccountSyncBroadcastMessage({
					namespaces: [],
					operationId: createAccountClientId(),
					state_epoch: data.user.state_epoch,
					tabId: createAccountClientId(),
					type: 'profile-updated',
					userId: data.user.id,
				});
				router.refresh();
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

				setProfileError(
					error instanceof Error
						? error.message
						: ACCOUNT_MANAGER_MESSAGE_MAP.profileUpdateFailed
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [
		csrfToken,
		isSubmitting,
		profileCurrentPassword,
		profileUsername,
		isProfileNicknameInvalid,
		isProfileNicknameUnchanged,
		isProfileUsernameUnchanged,
		isProfileUsernameChangeBlockedByMissingPassword,
		normalizedProfileNickname,
		router,
		setIsSubmitting,
		setMessage,
		signalCurrentWebAuthnUserDetails,
		user,
		vibrate,
	]);

	const handleProfileChangeSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			handleProfileChange();
		},
		[handleProfileChange]
	);

	return {
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
		newPassword,
		passwordChangeError,
		profileCurrentPassword,
		profileError,
		profileNickname,
		profileUsername,
		setNewPassword,
	};
}
