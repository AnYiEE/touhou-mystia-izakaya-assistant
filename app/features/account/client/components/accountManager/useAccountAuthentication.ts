'use client';

import { usePathname, useRouter } from 'next/navigation';
import { WebAuthnAbortService } from '@simplewebauthn/browser';
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
	applyAccountAuthSuccessResponse,
	checkCurrentAccountAuthContext,
	refreshAccountState,
} from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	PASSWORD_RULE_DESCRIPTION,
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
import { ACCOUNT_MANAGER_MESSAGE_MAP } from './copy';
import { type IUseAccountPasskeysResult } from './useAccountPasskeys';

type TAuthMode = 'login' | 'register';
export type TAuthEntryMode = 'passkey' | 'password';
interface IUseAccountAuthenticationOptions {
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
				ACCOUNT_MANAGER_MESSAGE_MAP.authenticationCredentialsRequired
			);
			return;
		}
		if (!hasAcceptedAuthTerms) {
			setShouldHighlightAuthTerms(true);
			setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.termsRequired);
			return;
		}
		if (authMode === 'register' && !checkPasswordPolicy(password)) {
			setMessage(PASSWORD_RULE_DESCRIPTION);
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
			.then((result) => {
				if (result.status === 'error') {
					setMessage(result.message);
					return;
				}

				const { redirect_to: redirectTo, ...data } = result.data;
				stabilizeFocusBeforeAuthStateChange(expectedAuthContext);
				if (
					!applyAccountAuthSuccessResponse(data, expectedAuthContext)
				) {
					return;
				}

				setPassword('');
				setMessage(
					authMode === 'login'
						? ACCOUNT_MANAGER_MESSAGE_MAP.loginSuccess
						: ACCOUNT_MANAGER_MESSAGE_MAP.registrationSuccess
				);

				void publishAccountRuntimeInvalidation({
					reason: 'login',
					stateEpoch: data.user.state_epoch,
					userId: data.user.id,
				});

				if (redirectTo !== undefined) {
					globalThis.location.assign(
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
						: ACCOUNT_MANAGER_MESSAGE_MAP.authenticationFailed
				);
			})
			.finally(() => {
				setIsSubmitting(false);
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
	}, [setMessage, vibrate]);

	const handlePasswordAuthEntryPress = useCallback(() => {
		vibrate();

		if (!hasAcceptedAuthTerms) {
			setShouldHighlightAuthTerms(true);
			setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.termsRequired);
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
					currentMessage === ACCOUNT_MANAGER_MESSAGE_MAP.termsRequired
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
				currentMessage === 'invalid-credentials' ? null : currentMessage
			);
		},
		[setMessage]
	);

	const handleAuthPasswordChange = useCallback(
		(value: string) => {
			setPassword(value);
			setMessage((currentMessage) =>
				currentMessage === 'invalid-credentials' ? null : currentMessage
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
		WebAuthnAbortService.cancelCeremony();
	}, []);

	const handleWebAuthnLoginResult = useCallback(
		(
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
			if (!applyAccountAuthSuccessResponse(data, expectedAuthContext)) {
				return;
			}

			setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.loginSuccess);

			void publishAccountRuntimeInvalidation({
				reason: 'login',
				stateEpoch: data.user.state_epoch,
				userId: data.user.id,
			});

			if (redirectTo !== undefined) {
				globalThis.location.assign(
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

				handleWebAuthnLoginResult(result, expectedAuthContext);
			})
			.catch((error: unknown) => {
				if (webauthnAutofillRequestIdRef.current !== requestId) {
					return;
				}
				isWebauthnAutofillRequestActiveRef.current = false;
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				setMessage(
					Error.isError(error)
						? error.message
						: ACCOUNT_MANAGER_MESSAGE_MAP.authenticationFailed
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
			setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.termsRequired);
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'WebAuthn Login'
		);

		cancelWebAuthnAutofillLogin();
		setIsWebauthnLoginPending(true);
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

				handleWebAuthnLoginResult(result, expectedAuthContext);
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				setMessage(
					Error.isError(error)
						? error.message
						: ACCOUNT_MANAGER_MESSAGE_MAP.authenticationFailed
				);
			})
			.finally(() => {
				clearTimeout(slowTimerId);
				setIsWebauthnLoginPending(false);
				setIsWebauthnSlow(false);
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
		if (isWebauthnAccountRegistrationPending || isWebauthnLoginPending) {
			return;
		}

		vibrate();

		if (!hasAcceptedAuthTerms) {
			setShouldHighlightAuthTerms(true);
			setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.termsRequired);
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'WebAuthn Account Registration'
		);

		cancelWebAuthnAutofillLogin();
		setIsWebauthnAccountRegistrationPending(true);
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
			.then((result) => {
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
				if (
					!applyAccountAuthSuccessResponse(data, expectedAuthContext)
				) {
					return;
				}

				setPassword('');
				setIsPasskeyRegistrationPromptVisible(false);
				setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.registrationSuccess);

				void publishAccountRuntimeInvalidation({
					reason: 'login',
					stateEpoch: data.user.state_epoch,
					userId: data.user.id,
				});

				if (redirectTo !== undefined) {
					globalThis.location.assign(
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
						: ACCOUNT_MANAGER_MESSAGE_MAP.registrationFailed
				);
			})
			.finally(() => {
				clearTimeout(slowTimerId);
				setIsWebauthnAccountRegistrationPending(false);
				setIsWebauthnSlow(false);
			});
	}, [
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
