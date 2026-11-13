'use client';

import { WebAuthnAbortService } from '@simplewebauthn/browser';
import { usePathname, useRouter } from 'next/navigation';
import {
	type ChangeEvent,
	type PointerEvent,
	type RefObject,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import { publishAccountRuntimeInvalidation } from '@/features/account/client/accountRuntimeInvalidation';
import {
	type TAccountApiResult,
	type TAuthLoginSuccessData,
	loginAccount,
	registerAccount,
	startWebAuthnAccountRegistration,
	startWebAuthnLogin,
} from '@/features/account/client/api';
import {
	checkCurrentAccountAuthContext,
	refreshAccountState,
} from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import { completeAccountAuthenticationSuccess } from '@/features/account/client/workspace/lifecycle';
import { workspaceUiStore } from '@/features/account/client/workspace/workspaceUiStore';
import {
	WEBAUTHN_BROWSER_CEREMONY_TIMEOUT_MS,
	checkNicknamePolicy,
	checkPasswordPolicy,
	normalizeNickname,
} from '@/features/account/constants';
import type { IAccountUserProfile } from '@/features/account/contracts';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { createRecommendationBridgeContinuationUrl } from '@/features/recommendations/client/bridge/launchDescriptor';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	type IAccountActionController,
	type TAccountAuthContext,
	handleUnauthorizedAccountError,
} from './controller';
import {
	ACCOUNT_MANAGER_MESSAGE_KEYS,
	checkAccountLoginCredentialError,
} from './copy';
import { type IUseAccountPasskeysResult } from './useAccountPasskeys';

type TAuthMode = 'login' | 'register';
export type TAccountAuthPurpose = 'default' | 'required-account';
export type TAuthEntryMode = 'passkey' | 'password';
interface IUseAccountAuthenticationOptions {
	authPurpose: TAccountAuthPurpose;
	bootstrapStatus: ReturnType<typeof accountStore.shared.bootstrapStatus.get>;
	controller: IAccountActionController;
	isAccountModalOpen: boolean;
	passkeyCapabilities: Pick<
		IUseAccountPasskeysResult,
		'isWebauthnAutofillSupported' | 'isWebauthnSupported'
	>;
	user: IAccountUserProfile | null;
	vibrate: () => void;
}

export interface IUseAccountAuthenticationResult {
	accountManagerRootRef: RefObject<HTMLElement | null>;
	canRegister: boolean;
	authEntryMode: TAuthEntryMode;
	authMode: TAuthMode;
	authTermsCheckboxRef: RefObject<HTMLInputElement | null>;
	handleAuthCredentialInputFocus: () => void;
	handleAuthPasswordChange: (value: string) => void;
	handleAuthSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
	handleAuthTermsAcceptedChange: (
		event: ChangeEvent<HTMLInputElement>
	) => void;
	handleAuthTermsLabelPointerDown: (
		event: PointerEvent<HTMLLabelElement>
	) => void;
	handleAuthUsernameChange: (value: string) => void;
	handleLoginModePress: () => void;
	handlePasskeyAuthEntryPress: () => void;
	handlePasswordAuthEntryPress: () => void;
	handleRegisterModePress: () => void;
	handleWebAuthnAccountRegistration: () => void;
	handleWebAuthnLogin: () => void;
	hasAcceptedAuthTerms: boolean;
	isPasskeyPreferredAuthAvailable: boolean;
	isPasskeyRegistrationPromptVisible: boolean;
	isRegistrationNicknameInvalid: boolean;
	isRegistrationPasswordInvalid: boolean;
	isSsoContext: boolean;
	isWebauthnAccountRegistrationPending: boolean;
	isWebauthnLoginPending: boolean;
	isWebauthnSlow: boolean;
	password: string;
	registrationNickname: string;
	setRegistrationNickname: (value: string) => void;
	shouldHideAfterSsoAuth: boolean;
	shouldHighlightAuthTerms: boolean;
	shouldShowAuthTermsConfirmation: boolean;
	shouldShowPasskeyPrimaryAuth: boolean;
	username: string;
}

export function useAccountAuthentication({
	authPurpose,
	bootstrapStatus,
	controller: { isSubmitting, setIsSubmitting, setMessage },
	isAccountModalOpen,
	passkeyCapabilities: { isWebauthnAutofillSupported, isWebauthnSupported },
	user,
	vibrate,
}: IUseAccountAuthenticationOptions): IUseAccountAuthenticationResult {
	const pathname = usePathname();
	const router = useRouter();

	const [authMode, setAuthMode] = useState<TAuthMode>('login');

	const [authEntryMode, setAuthEntryMode] =
		useState<TAuthEntryMode>('passkey');

	const [password, setPassword] = useState('');

	const [hasAcceptedAuthTerms, setHasAcceptedAuthTerms] = useState(false);

	const [shouldHighlightAuthTerms, setShouldHighlightAuthTerms] =
		useState(false);

	const [registrationNickname, setRegistrationNickname] = useState('');

	const [username, setUsername] = useState('');

	const [shouldHideAfterSsoAuth, setShouldHideAfterSsoAuth] = useState(false);

	const [isWebauthnLoginPending, setIsWebauthnLoginPending] = useState(false);

	const [isWebauthnSlow, setIsWebauthnSlow] = useState(false);

	const [
		isPasskeyRegistrationPromptVisible,
		setIsPasskeyRegistrationPromptVisible,
	] = useState(false);

	const [
		isWebauthnAccountRegistrationPending,
		setIsWebauthnAccountRegistrationPending,
	] = useState(false);

	const accountManagerRootRef = useRef<HTMLElement>(null);

	const authTermsCheckboxRef = useRef<HTMLInputElement>(null);

	const isWebauthnAutofillRequestActiveRef = useRef(false);

	const webauthnAutofillRequestIdRef = useRef(0);

	const stabilizeFocusBeforeAuthStateChange = useCallback(
		(expectedAuthContext: TAccountAuthContext) => {
			if (
				!checkCurrentAccountAuthContext(expectedAuthContext) ||
				accountStore.shared.user.get() !== null ||
				!accountStore.shared.accountModal.isOpen.get()
			) {
				return;
			}

			const rootElement = accountManagerRootRef.current;
			const { activeElement } = document;
			if (
				rootElement !== null &&
				activeElement instanceof HTMLElement &&
				activeElement !== rootElement &&
				rootElement.contains(activeElement)
			) {
				rootElement.focus({ preventScroll: true });
			}
		},
		[]
	);

	const isRegistrationPasswordInvalid =
		authMode === 'register' &&
		password.length > 0 &&
		!checkPasswordPolicy(password);
	const normalizedRegistrationNickname =
		normalizeNickname(registrationNickname);
	const isRegistrationNicknameInvalid =
		authMode === 'register' &&
		normalizedRegistrationNickname !== null &&
		!checkNicknamePolicy(normalizedRegistrationNickname);
	const isSsoContext = pathname === '/sso/authorize';
	const canRegister = authPurpose === 'default';
	const isPasskeyPreferredAuthAvailable =
		bootstrapStatus === 'anonymous' && isWebauthnSupported && user === null;
	const shouldShowPasskeyPrimaryAuth =
		isPasskeyPreferredAuthAvailable && authEntryMode === 'passkey';
	const isWebauthnAutofillLoginReady =
		isAccountModalOpen &&
		bootstrapStatus === 'anonymous' &&
		authEntryMode === 'password' &&
		authMode === 'login' &&
		hasAcceptedAuthTerms &&
		isWebauthnAutofillSupported &&
		user === null &&
		!shouldHideAfterSsoAuth;
	const shouldShowAuthTermsConfirmation =
		user === null &&
		(shouldShowPasskeyPrimaryAuth || !isPasskeyPreferredAuthAvailable);

	useEffect(() => {
		setShouldHideAfterSsoAuth(false);
	}, [pathname]);

	useEffect(() => {
		if (user !== null) {
			setAuthEntryMode('password');
			setIsPasskeyRegistrationPromptVisible(false);
			return;
		}

		if (!isAccountModalOpen) {
			return;
		}

		setAuthEntryMode(
			isPasskeyPreferredAuthAvailable ? 'passkey' : 'password'
		);
		setIsPasskeyRegistrationPromptVisible(false);
	}, [isAccountModalOpen, isPasskeyPreferredAuthAvailable, user]);

	useEffect(() => {
		if (authPurpose === 'required-account') {
			setAuthMode('login');
			setIsPasskeyRegistrationPromptVisible(false);
		}
	}, [authPurpose]);

	useEffect(() => {
		if (user?.id === undefined) {
			return;
		}

		setHasAcceptedAuthTerms(false);
		setShouldHighlightAuthTerms(false);
	}, [user?.id]);

	const handleAuth = useCallback(() => {
		if (isSubmitting) {
			return;
		}

		vibrate();

		const normalizedUsername = username.trim();
		if (normalizedUsername !== username) {
			setUsername(normalizedUsername);
		}
		if (authMode === 'register') {
			const normalizedNicknameText = normalizedRegistrationNickname ?? '';
			if (normalizedNicknameText !== registrationNickname) {
				setRegistrationNickname(normalizedNicknameText);
			}
		}

		if (normalizedUsername.length === 0 || password.length === 0) {
			setMessage(
				ACCOUNT_MANAGER_MESSAGE_KEYS.authenticationCredentialsRequired
			);
			return;
		}
		if (!hasAcceptedAuthTerms) {
			setShouldHighlightAuthTerms(true);
			setMessage(ACCOUNT_MANAGER_MESSAGE_KEYS.termsRequired);
			return;
		}
		if (authMode === 'register' && !checkPasswordPolicy(password)) {
			setMessage('invalid-password-rule');
			return;
		}
		if (isRegistrationNicknameInvalid) {
			setMessage('invalid-nickname');
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			authMode === 'login' ? 'Login' : 'Register'
		);

		setIsSubmitting(true);
		setMessage(null);
		workspaceUiStore.isAuthRequestPending.set(true);

		const expectedAuthContext = {
			expectedCsrfToken: accountStore.shared.csrfToken.get(),
			expectedUserId: accountStore.shared.user.get()?.id ?? null,
		};

		const request =
			authMode === 'login'
				? loginAccount({ password, username: normalizedUsername })
				: registerAccount({
						nickname: normalizedRegistrationNickname,
						password,
						username: normalizedUsername,
					});
		void request
			.then(async (result) => {
				if (result.status === 'error') {
					setMessage(result.message);
					return;
				}

				const { redirect_to: redirectTo, ...data } = result.data;
				stabilizeFocusBeforeAuthStateChange(expectedAuthContext);
				const completion = await completeAccountAuthenticationSuccess(
					data,
					expectedAuthContext
				);
				if (completion === 'stale') {
					return;
				}
				setPassword('');
				if (completion !== 'ready') {
					setMessage(null);
					return;
				}
				setMessage(
					authMode === 'login'
						? ACCOUNT_MANAGER_MESSAGE_KEYS.loginSuccess
						: ACCOUNT_MANAGER_MESSAGE_KEYS.registrationSuccess
				);
				accountStore.closeAccountModalAfterAuthentication();

				void publishAccountRuntimeInvalidation({
					reason: 'login',
					stateEpoch: data.user.state_epoch,
					userId: data.user.id,
				});

				if (redirectTo !== undefined) {
					location.assign(
						createRecommendationBridgeContinuationUrl(redirectTo)
					);
					return;
				}
				if (isSsoContext) {
					setShouldHideAfterSsoAuth(true);
					accountStore.closeAccountModal();
					router.refresh();
					return;
				}

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
				setMessage(
					Error.isError(error)
						? error.message
						: ACCOUNT_MANAGER_MESSAGE_KEYS.authenticationFailed
				);
			})
			.finally(() => {
				setIsSubmitting(false);
				workspaceUiStore.isAuthRequestPending.set(false);
			});
	}, [
		authMode,
		hasAcceptedAuthTerms,
		isRegistrationNicknameInvalid,
		isSsoContext,
		isSubmitting,
		normalizedRegistrationNickname,
		password,
		registrationNickname,
		router,
		setIsSubmitting,
		setMessage,
		stabilizeFocusBeforeAuthStateChange,
		username,
		vibrate,
	]);

	const handleAuthSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			handleAuth();
		},
		[handleAuth]
	);

	const handleLoginModePress = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Switch Login'
		);
		setAuthMode('login');
		setUsername('');
		setPassword('');
		setRegistrationNickname('');
		setIsPasskeyRegistrationPromptVisible(false);
		setMessage(null);
		setShouldHighlightAuthTerms(false);
	}, [setMessage, vibrate]);

	const handleRegisterModePress = useCallback(() => {
		if (!canRegister) {
			return;
		}
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Switch Register'
		);
		setAuthMode('register');
		setUsername('');
		setPassword('');
		setRegistrationNickname('');
		setIsPasskeyRegistrationPromptVisible(false);
		setMessage(null);
		setShouldHighlightAuthTerms(false);
	}, [canRegister, setMessage, vibrate]);

	const handlePasswordAuthEntryPress = useCallback(() => {
		vibrate();

		if (!hasAcceptedAuthTerms) {
			setShouldHighlightAuthTerms(true);
			setMessage(ACCOUNT_MANAGER_MESSAGE_KEYS.termsRequired);
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Switch Password Auth'
		);
		setAuthEntryMode('password');
		setIsPasskeyRegistrationPromptVisible(false);
		setMessage(null);
		setShouldHighlightAuthTerms(false);
	}, [hasAcceptedAuthTerms, setMessage, vibrate]);

	const handlePasskeyAuthEntryPress = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Switch Passkey Auth'
		);
		setAuthEntryMode('passkey');
		setIsPasskeyRegistrationPromptVisible(false);
		setMessage(null);
		setShouldHighlightAuthTerms(false);
	}, [setMessage, vibrate]);

	const handleAuthTermsAcceptedChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const { checked } = event.currentTarget;
			setHasAcceptedAuthTerms(checked);
			if (checked) {
				setShouldHighlightAuthTerms(false);
				setMessage((currentMessage) =>
					currentMessage ===
					ACCOUNT_MANAGER_MESSAGE_KEYS.termsRequired
						? null
						: currentMessage
				);
			}
		},
		[setMessage]
	);

	const handleAuthTermsLabelPointerDown = useCallback(
		(event: PointerEvent<HTMLLabelElement>) => {
			event.preventDefault();
			authTermsCheckboxRef.current?.focus();
		},
		[]
	);

	const handleAuthUsernameChange = useCallback(
		(value: string) => {
			setUsername(value);
			setMessage((currentMessage) =>
				checkAccountLoginCredentialError(currentMessage)
					? null
					: currentMessage
			);
		},
		[setMessage]
	);

	const handleAuthPasswordChange = useCallback(
		(value: string) => {
			setPassword(value);
			setMessage((currentMessage) =>
				currentMessage ===
				ACCOUNT_API_RESPONSE_CODE_MAP.invalidCredentials
					? null
					: currentMessage
			);
		},
		[setMessage]
	);

	const cancelWebAuthnAutofillLogin = useCallback(() => {
		if (!isWebauthnAutofillRequestActiveRef.current) {
			return;
		}

		webauthnAutofillRequestIdRef.current += 1;
		isWebauthnAutofillRequestActiveRef.current = false;
		workspaceUiStore.isAuthRequestPending.set(false);
		WebAuthnAbortService.cancelCeremony();
	}, []);

	const handleWebAuthnLoginResult = useCallback(
		async (
			result: TAccountApiResult<TAuthLoginSuccessData>,
			expectedAuthContext: TAccountAuthContext
		) => {
			if (result.status === 'error') {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}
				if (result.message !== 'webauthn-canceled') {
					setMessage(result.message);
				}
				return;
			}

			const { redirect_to: redirectTo, ...data } = result.data;
			stabilizeFocusBeforeAuthStateChange(expectedAuthContext);
			const completion = await completeAccountAuthenticationSuccess(
				data,
				expectedAuthContext
			);
			if (completion === 'stale') {
				return;
			}

			if (completion !== 'ready') {
				setMessage(null);
				return;
			}
			setMessage(ACCOUNT_MANAGER_MESSAGE_KEYS.loginSuccess);
			accountStore.closeAccountModalAfterAuthentication();

			void publishAccountRuntimeInvalidation({
				reason: 'login',
				stateEpoch: data.user.state_epoch,
				userId: data.user.id,
			});

			if (redirectTo !== undefined) {
				location.assign(
					createRecommendationBridgeContinuationUrl(redirectTo)
				);
				return;
			}
			if (isSsoContext) {
				setShouldHideAfterSsoAuth(true);
				accountStore.closeAccountModal();
				router.refresh();
				return;
			}

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
		},
		[isSsoContext, router, setMessage, stabilizeFocusBeforeAuthStateChange]
	);

	const startWebAuthnAutofillLogin = useCallback(() => {
		if (
			!isWebauthnAutofillLoginReady ||
			isWebauthnAutofillRequestActiveRef.current
		) {
			return;
		}

		const requestId = webauthnAutofillRequestIdRef.current + 1;
		webauthnAutofillRequestIdRef.current = requestId;
		isWebauthnAutofillRequestActiveRef.current = true;
		workspaceUiStore.isAuthRequestPending.set(true);

		const expectedAuthContext = {
			expectedCsrfToken: accountStore.shared.csrfToken.get(),
			expectedUserId: accountStore.shared.user.get()?.id ?? null,
		};

		void startWebAuthnLogin({ useBrowserAutofill: true })
			.then((result) => {
				if (webauthnAutofillRequestIdRef.current !== requestId) {
					return;
				}
				isWebauthnAutofillRequestActiveRef.current = false;
				workspaceUiStore.isAuthRequestPending.set(false);

				if (
					result.status === 'error' &&
					result.message === 'webauthn-canceled'
				) {
					return;
				}
				if (result.status !== 'error') {
					trackEvent(
						trackEvent.category.click,
						'Account Auth Button',
						'WebAuthn Autofill Login'
					);
				}

				void handleWebAuthnLoginResult(result, expectedAuthContext);
			})
			.catch((error: unknown) => {
				if (webauthnAutofillRequestIdRef.current !== requestId) {
					return;
				}
				isWebauthnAutofillRequestActiveRef.current = false;
				workspaceUiStore.isAuthRequestPending.set(false);
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				setMessage(
					Error.isError(error)
						? error.message
						: ACCOUNT_MANAGER_MESSAGE_KEYS.authenticationFailed
				);
			});
	}, [handleWebAuthnLoginResult, isWebauthnAutofillLoginReady, setMessage]);

	useEffect(() => {
		if (!isWebauthnAutofillLoginReady) {
			cancelWebAuthnAutofillLogin();
			return;
		}

		startWebAuthnAutofillLogin();

		return cancelWebAuthnAutofillLogin;
	}, [
		cancelWebAuthnAutofillLogin,
		isWebauthnAutofillLoginReady,
		startWebAuthnAutofillLogin,
	]);

	const handleAuthCredentialInputFocus = useCallback(() => {
		if (user !== null) {
			return;
		}
		if (authMode !== 'login') {
			return;
		}
		if (!hasAcceptedAuthTerms) {
			return;
		}
		if (!isWebauthnAutofillSupported) {
			return;
		}

		startWebAuthnAutofillLogin();
	}, [
		authMode,
		hasAcceptedAuthTerms,
		isWebauthnAutofillSupported,
		startWebAuthnAutofillLogin,
		user,
	]);

	const handleWebAuthnLogin = useCallback(() => {
		if (isWebauthnLoginPending) {
			return;
		}

		vibrate();

		if (!hasAcceptedAuthTerms) {
			setShouldHighlightAuthTerms(true);
			setMessage(ACCOUNT_MANAGER_MESSAGE_KEYS.termsRequired);
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'WebAuthn Login'
		);

		cancelWebAuthnAutofillLogin();
		setIsWebauthnLoginPending(true);
		workspaceUiStore.isAuthRequestPending.set(true);
		setIsWebauthnSlow(false);
		setIsPasskeyRegistrationPromptVisible(false);
		setMessage(null);

		const slowTimerId = setTimeout(() => {
			setIsWebauthnSlow(true);
		}, WEBAUTHN_BROWSER_CEREMONY_TIMEOUT_MS);

		const expectedAuthContext = {
			expectedCsrfToken: accountStore.shared.csrfToken.get(),
			expectedUserId: accountStore.shared.user.get()?.id ?? null,
		};

		void startWebAuthnLogin()
			.then((result) => {
				if (result.status === 'error') {
					if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
						return;
					}

					setIsPasskeyRegistrationPromptVisible(true);
					if (result.message !== 'webauthn-canceled') {
						setMessage(result.message);
					}
					return;
				}

				void handleWebAuthnLoginResult(result, expectedAuthContext);
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				setMessage(
					Error.isError(error)
						? error.message
						: ACCOUNT_MANAGER_MESSAGE_KEYS.authenticationFailed
				);
			})
			.finally(() => {
				clearTimeout(slowTimerId);
				setIsWebauthnLoginPending(false);
				setIsWebauthnSlow(false);
				workspaceUiStore.isAuthRequestPending.set(false);
			});
	}, [
		cancelWebAuthnAutofillLogin,
		handleWebAuthnLoginResult,
		hasAcceptedAuthTerms,
		isWebauthnLoginPending,
		setMessage,
		vibrate,
	]);

	const handleWebAuthnAccountRegistration = useCallback(() => {
		if (
			!canRegister ||
			isWebauthnAccountRegistrationPending ||
			isWebauthnLoginPending
		) {
			return;
		}

		vibrate();

		if (!hasAcceptedAuthTerms) {
			setShouldHighlightAuthTerms(true);
			setMessage(ACCOUNT_MANAGER_MESSAGE_KEYS.termsRequired);
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'WebAuthn Account Registration'
		);

		cancelWebAuthnAutofillLogin();
		setIsWebauthnAccountRegistrationPending(true);
		workspaceUiStore.isAuthRequestPending.set(true);
		setIsWebauthnSlow(false);
		setMessage(null);

		const slowTimerId = setTimeout(() => {
			setIsWebauthnSlow(true);
		}, WEBAUTHN_BROWSER_CEREMONY_TIMEOUT_MS);

		const expectedAuthContext = {
			expectedCsrfToken: accountStore.shared.csrfToken.get(),
			expectedUserId: accountStore.shared.user.get()?.id ?? null,
		};

		void startWebAuthnAccountRegistration()
			.then(async (result) => {
				if (result.status === 'error') {
					if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
						return;
					}

					if (result.message !== 'webauthn-canceled') {
						setMessage(result.message);
					}
					return;
				}

				const { redirect_to: redirectTo, ...data } = result.data;
				stabilizeFocusBeforeAuthStateChange(expectedAuthContext);
				const completion = await completeAccountAuthenticationSuccess(
					data,
					expectedAuthContext
				);
				if (completion === 'stale') {
					return;
				}

				setPassword('');
				setIsPasskeyRegistrationPromptVisible(false);
				if (completion !== 'ready') {
					setMessage(null);
					return;
				}
				setMessage(ACCOUNT_MANAGER_MESSAGE_KEYS.registrationSuccess);
				accountStore.closeAccountModalAfterAuthentication();

				void publishAccountRuntimeInvalidation({
					reason: 'login',
					stateEpoch: data.user.state_epoch,
					userId: data.user.id,
				});

				if (redirectTo !== undefined) {
					location.assign(
						createRecommendationBridgeContinuationUrl(redirectTo)
					);
					return;
				}
				if (isSsoContext) {
					setShouldHideAfterSsoAuth(true);
					accountStore.closeAccountModal();
					router.refresh();
					return;
				}

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
						'Account state refresh failed after successful passkey registration.',
						{ errorCode: getLogSafeErrorCode(error) }
					);
				});
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				setMessage(
					Error.isError(error)
						? error.message
						: ACCOUNT_MANAGER_MESSAGE_KEYS.registrationFailed
				);
			})
			.finally(() => {
				clearTimeout(slowTimerId);
				setIsWebauthnAccountRegistrationPending(false);
				setIsWebauthnSlow(false);
				workspaceUiStore.isAuthRequestPending.set(false);
			});
	}, [
		canRegister,
		cancelWebAuthnAutofillLogin,
		hasAcceptedAuthTerms,
		isSsoContext,
		isWebauthnAccountRegistrationPending,
		isWebauthnLoginPending,
		router,
		setMessage,
		stabilizeFocusBeforeAuthStateChange,
		vibrate,
	]);

	return {
		accountManagerRootRef,
		authEntryMode,
		authMode,
		authTermsCheckboxRef,
		canRegister,
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
		shouldHideAfterSsoAuth,
		shouldHighlightAuthTerms,
		shouldShowAuthTermsConfirmation,
		shouldShowPasskeyPrimaryAuth,
		username,
	};
}
