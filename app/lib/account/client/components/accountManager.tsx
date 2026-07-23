'use client';

import {
	type ChangeEvent,
	type PointerEvent,
	type PropsWithChildren,
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
	WebAuthnAbortService,
	browserSupportsWebAuthn,
	browserSupportsWebAuthnAutofill,
	bufferToBase64URLString,
} from '@simplewebauthn/browser';

import { usePathname, useRouter } from 'next/navigation';
import { useReducedMotion } from '@/design/ui/hooks';
import { useVibrate } from '@/hooks';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import {
	faArrowRightFromBracket,
	faCheck,
	faCircleInfo,
	faCloudArrowUp,
	faDesktop,
	faDownload,
	faFingerprint,
	faKey,
	faPen,
	faPlug,
	faPlus,
	faPowerOff,
	faRightToBracket,
	faRotate,
	faShieldHalved,
	faTrash,
	faTriangleExclamation,
	faUser,
	faUserPlus,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Card,
	Input,
	Modal,
	Tooltip,
	cn,
} from '@/design/ui/components';

import AccountConfirmButton from './accountConfirmButton';
import AccountSyncStatus from './accountSyncStatus';
import LegalStatement from '@/(pages)/about/legalStatement';
import { trackEvent } from '@/components/analytics';
import Heading from '@/components/heading';
import TimeAgo from '@/components/timeAgo';

import { publishAccountRuntimeInvalidation } from '@/lib/account/client/accountRuntimeInvalidation';
import {
	AccountApiError,
	type IWebauthnCredentialSummary,
	type TAccountApiResult,
	type TAuthLoginSuccessData,
	changeAccountPassword,
	changeAccountProfile,
	deleteAccount,
	deleteAccountData,
	deleteWebAuthnCredential,
	exportAccountData,
	listWebAuthnCredentials,
	loginAccount,
	logoutAccount,
	logoutAllAccount,
	refreshAccountSessions,
	refreshAccountSsoGrants,
	registerAccount,
	renameWebAuthnCredential,
	revokeAccountSession,
	revokeAccountSsoGrant,
	setInitialAccountPassword,
	startWebAuthnAccountRegistration,
	startWebAuthnLogin,
	startWebAuthnRegistration,
} from '@/lib/account/client/api';
import { removeAccountSyncBaseSnapshotsForAccountDeletion } from '@/lib/account/client/baseSnapshot';
import {
	postAccountSyncBroadcastMessage,
	postAccountWebauthnBroadcastMessage,
	subscribeAccountWebauthnBroadcastMessage,
} from '@/lib/account/client/broadcast';
import { removeAccountSyncConflictResolutionJournals } from '@/lib/account/client/conflictResolutionJournal';
import { getAccountClientErrorMessage } from '@/lib/account/client/errorMessage';
import { removeDirtyQueueEntries } from '@/lib/account/client/queue';
import { createAccountClientId } from '@/lib/account/client/random';
import {
	markAccountSyncResetGenerationDeleted,
	withAccountSyncResetGenerationLock,
} from '@/lib/account/client/resetGeneration';
import {
	applyAccountAuthSuccessResponse,
	checkCurrentAccountAuthContext,
	refreshAccountState,
	refreshAccountStateFromInvalidation,
	resetAccountStateForUnauthorizedError,
	resetAccountStateIfCurrent,
} from '@/lib/account/client/session';
import {
	flushAccountSyncQueueUntilIdle,
	pauseAccountSyncForEmptyCloud,
} from '@/lib/account/client/syncClient';
import {
	removeAccountSyncOperationForAccountDeletion,
	withAccountSyncOperationLease,
} from '@/lib/account/client/syncOperationLease';
import { removeAccountSyncLeaseForAccountDeletion } from '@/lib/account/client/lease';
import { removeAccountSyncMetaForAccountDeletion } from '@/lib/account/client/snapshot';
import { createRecommendationBridgeContinuationUrl } from '@/lib/recommendations/bridge/launchDescriptor';
import {
	ACCOUNT_SYNC_STATUS_MAP,
	NICKNAME_RULE_DESCRIPTION,
	PASSWORD_RULE_DESCRIPTION,
	USERNAME_RULE_DESCRIPTION,
	WEBAUTHN_BROWSER_CEREMONY_TIMEOUT_MS,
	WEBAUTHN_CREDENTIAL_NAME_MAX_LENGTH,
	WEBAUTHN_CREDENTIAL_NAME_RULE_DESCRIPTION,
	checkNicknamePolicy,
	checkPasswordPolicy,
	checkUsernamePolicy,
	checkWebauthnCredentialNamePolicy,
	normalizeNickname,
	normalizeWebauthnCredentialName,
} from '@/lib/account/shared/constants';
import { getLogSafeErrorCode } from '@/lib/logging';
import type {
	IAccountSessionRecord,
	IAccountSsoGrant,
	IAccountSsoGrantListData,
} from '@/lib/account/shared/types';
import {
	pushOverlayChild,
	requestOverlayClose,
} from '@/lib/overlayCoordinator';
import { accountStore, globalStore } from '@/stores';
import { downloadJson } from '@/utilities';

type TAuthMode = 'login' | 'register';
type TAuthEntryMode = 'passkey' | 'password';
type TWebAuthnSupportStatus = 'supported' | 'unsupported';
type TAccountAuthContext = Parameters<typeof resetAccountStateIfCurrent>[0];

const ACCOUNT_COLLAPSE_MOTION_TRANSITION = {
	duration: 0.18,
	ease: 'easeInOut',
} as const;

const ACCOUNT_AUTH_ENTRY_MOTION_TRANSITION = {
	duration: 0.26,
	ease: 'linear',
} as const;

const AUTH_TERMS_REQUIRED_MESSAGE = '请先阅读并同意法律声明';
const ACCOUNT_AUTH_PASSWORD_FORM_ID = 'account-auth-password-form';

interface IAccountPanelProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

const AccountPanel = memo<IAccountPanelProps>(function AccountPanel({
	children,
	className,
}) {
	const isHighAppearance = globalStore.persistence.highAppearance.use();

	return (
		<Card
			as="section"
			fullWidth
			shadow="sm"
			classNames={{
				base: cn('p-4', className, {
					'bg-content1/40 backdrop-blur': isHighAppearance,
				}),
			}}
		>
			{children}
		</Card>
	);
});

interface IAccountPanelTitleProps {
	children: ReactNodeWithoutBoolean;
	className?: string;
	icon: FontAwesomeIconProps['icon'];
	iconClassName?: string;
}

const AccountPanelTitle = memo<IAccountPanelTitleProps>(
	function AccountPanelTitle({ children, className, icon, iconClassName }) {
		return (
			<div
				className={cn(
					'mb-3 flex items-center gap-2 text-small font-medium text-foreground-700',
					className
				)}
			>
				<FontAwesomeIcon
					icon={icon}
					className={cn('w-4 text-primary-600', iconClassName)}
				/>
				<span>{children}</span>
			</div>
		);
	}
);

interface IAccountCollapseMotionProps extends PropsWithChildren<object> {
	className?: string;
	motionKey: number | string;
}

const AccountCollapseMotion = memo<IAccountCollapseMotionProps>(
	function AccountCollapseMotion({ children, className, motionKey }) {
		const isReducedMotion = useReducedMotion();
		const shouldRender = children !== null && children !== undefined;

		return (
			<AnimatePresence initial={false}>
				{shouldRender ? (
					isReducedMotion ? (
						<div key={motionKey} className={className}>
							<div className="flow-root">{children}</div>
						</div>
					) : (
						<motion.div
							key={motionKey}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							initial={{ height: 0, opacity: 0 }}
							style={{ overflow: 'hidden' }}
							transition={ACCOUNT_COLLAPSE_MOTION_TRANSITION}
							className={className}
						>
							<div className="flow-root">{children}</div>
						</motion.div>
					)
				) : null}
			</AnimatePresence>
		);
	}
);

interface IAccountAuthEntryMotionProps extends PropsWithChildren<object> {
	motionKey: TAuthEntryMode;
}

const AccountAuthEntryMotion = memo<IAccountAuthEntryMotionProps>(
	function AccountAuthEntryMotion({ children, motionKey }) {
		const isReducedMotion = useReducedMotion();

		if (isReducedMotion) {
			return <div className="flow-root">{children}</div>;
		}

		return (
			<AnimatePresence initial={false}>
				<motion.div
					key={motionKey}
					animate={{ height: 'auto', opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					initial={{ height: 0, opacity: 0 }}
					style={{ overflow: 'hidden' }}
					transition={ACCOUNT_AUTH_ENTRY_MOTION_TRANSITION}
				>
					<div className="flow-root">{children}</div>
				</motion.div>
			</AnimatePresence>
		);
	}
);

interface IAccountAnimatedListProps extends PropsWithChildren<object> {
	className?: string;
}

const AccountAnimatedList = memo<IAccountAnimatedListProps>(
	function AccountAnimatedList({ children, className }) {
		const isReducedMotion = useReducedMotion();

		if (isReducedMotion) {
			return <div className={cn('-mt-2', className)}>{children}</div>;
		}

		return (
			<motion.div
				layout
				transition={ACCOUNT_COLLAPSE_MOTION_TRANSITION}
				className={cn('-mt-2', className)}
			>
				<AnimatePresence initial={false}>{children}</AnimatePresence>
			</motion.div>
		);
	}
);

const AccountAnimatedListItem = memo<PropsWithChildren<object>>(
	function AccountAnimatedListItem({ children }) {
		const isReducedMotion = useReducedMotion();

		if (isReducedMotion) {
			return (
				<div>
					<div className="flow-root pt-2">{children}</div>
				</div>
			);
		}

		return (
			<motion.div
				layout
				animate={{ height: 'auto', opacity: 1 }}
				exit={{ height: 0, opacity: 0 }}
				initial={{ height: 0, opacity: 0 }}
				style={{ overflow: 'hidden' }}
				transition={ACCOUNT_COLLAPSE_MOTION_TRANSITION}
			>
				<div className="flow-root pt-2">{children}</div>
			</motion.div>
		);
	}
);

interface IAccountInputIconProps extends Pick<FontAwesomeIconProps, 'icon'> {}

const AccountInputIcon = memo<IAccountInputIconProps>(
	function AccountInputIcon({ icon }) {
		return (
			<span className="pointer-events-none inline-flex -translate-y-px items-center text-default-400">
				<FontAwesomeIcon icon={icon} className="block w-3.5" />
			</span>
		);
	}
);

function handleUnauthorizedAccountError(
	error: unknown,
	context: TAccountAuthContext = {}
) {
	return resetAccountStateForUnauthorizedError(error, context);
}

function handleUnauthorizedAccountActionError(
	error: Extract<TAccountApiResult, { status: 'error' }>,
	context: TAccountAuthContext = {}
) {
	if (error.httpStatus === 401) {
		const user = accountStore.shared.user.get();
		if (resetAccountStateIfCurrent(context) && user !== null) {
			void publishAccountRuntimeInvalidation({
				reason: 'session-expired',
				stateEpoch: user.state_epoch,
				userId: user.id,
			});
		}
		return true;
	}

	return false;
}

const LOGOUT_SKIPPED = Symbol('logout-skipped');
type TLogoutAfterFlushResult =
	| TAccountApiResult<unknown>
	| typeof LOGOUT_SKIPPED;
const accountSsoGrantsRequestMap = new Map<
	string,
	Promise<TAccountApiResult<IAccountSsoGrantListData>>
>();

function createAccountSsoGrantsRequestKey(userId: string, csrfToken: string) {
	return `${userId}:${csrfToken}`;
}

const BOOTSTRAP_ERROR_MESSAGE_MAP: Record<string, string> = {
	'bootstrap-failed': '账号服务初始化失败，请刷新页面重试',
	'server-misconfigured': '服务器配置异常',
};

function getBootstrapErrorMessage(errorCode: string | null) {
	if (errorCode === null) {
		return '账号功能暂不可用：服务器配置异常';
	}
	return `账号功能暂不可用：${BOOTSTRAP_ERROR_MESSAGE_MAP[errorCode] ?? errorCode}`;
}

function refreshAccountSsoGrantsOnce(userId: string, csrfToken: string) {
	const requestKey = createAccountSsoGrantsRequestKey(userId, csrfToken);
	const currentRequest = accountSsoGrantsRequestMap.get(requestKey);
	if (currentRequest !== undefined) {
		return currentRequest;
	}

	const nextRequest = refreshAccountSsoGrants().finally(() => {
		if (accountSsoGrantsRequestMap.get(requestKey) === nextRequest) {
			accountSsoGrantsRequestMap.delete(requestKey);
		}
	});
	accountSsoGrantsRequestMap.set(requestKey, nextRequest);

	return nextRequest;
}

function formatSessionTimestamp(timestamp: number) {
	return new Date(timestamp).toLocaleString('zh-CN');
}

interface IProps {}

export default memo<IProps>(function AccountManager() {
	const pathname = usePathname();
	const router = useRouter();
	const vibrate = useVibrate();

	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const csrfToken = accountStore.shared.csrfToken.use();
	const hasPassword = accountStore.shared.hasPassword.use();
	const lastError = accountStore.shared.sync.lastError.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();
	const sessionInitialData = accountStore.shared.sessionInitialData.use();
	const ssoGrantInitialData = accountStore.shared.ssoGrantInitialData.use();
	const user = accountStore.shared.user.use();
	const webauthnInitialData = accountStore.shared.webauthnInitialData.use();
	const isAccountModalOpen = accountStore.shared.accountModal.isOpen.use();

	const [authMode, setAuthMode] = useState<TAuthMode>('login');
	const [authEntryMode, setAuthEntryMode] =
		useState<TAuthEntryMode>('passkey');
	const [currentPassword, setCurrentPassword] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [newPassword, setNewPassword] = useState('');
	const [passwordChangeError, setPasswordChangeError] = useState<
		string | null
	>(null);
	const [password, setPassword] = useState('');
	const [hasAcceptedAuthTerms, setHasAcceptedAuthTerms] = useState(false);
	const [shouldHighlightAuthTerms, setShouldHighlightAuthTerms] =
		useState(false);
	const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
	const [registrationNickname, setRegistrationNickname] = useState('');
	const [username, setUsername] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSessionListLoading, setIsSessionListLoading] = useState(false);
	const [isSsoGrantListLoading, setIsSsoGrantListLoading] = useState(false);
	const [accountSessions, setAccountSessions] = useState<
		IAccountSessionRecord[]
	>([]);
	const [accountSessionsUserId, setAccountSessionsUserId] = useState<
		string | null
	>(null);
	const [profileUsername, setProfileUsername] = useState('');
	const [profileNickname, setProfileNickname] = useState('');
	const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
	const [profileError, setProfileError] = useState<string | null>(null);
	const [isDeleteDataPopoverOpen, setIsDeleteDataPopoverOpen] =
		useState(false);
	const [isDeleteAccountPopoverOpen, setIsDeleteAccountPopoverOpen] =
		useState(false);
	const [shouldHideAfterSsoAuth, setShouldHideAfterSsoAuth] = useState(false);
	const [ssoGrants, setSsoGrants] = useState<IAccountSsoGrant[]>([]);
	const [ssoGrantsUserId, setSsoGrantsUserId] = useState<string | null>(null);
	const [revokeTargetClientId, setRevokeTargetClientId] = useState<
		string | null
	>(null);
	const [revokingClientId, setRevokingClientId] = useState<string | null>(
		null
	);
	const [revokeTargetSessionId, setRevokeTargetSessionId] = useState<
		string | null
	>(null);
	const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
		null
	);
	const [webauthnSupportStatus, setWebauthnSupportStatus] =
		useState<TWebAuthnSupportStatus>('supported');
	const [isWebauthnAutofillSupported, setIsWebauthnAutofillSupported] =
		useState(false);
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
	const [passkeys, setPasskeys] = useState<IWebauthnCredentialSummary[]>([]);
	const [passkeysRpId, setPasskeysRpId] = useState<string | null>(null);
	const [isPasskeyListLoading, setIsPasskeyListLoading] = useState(false);
	const [passkeysUserId, setPasskeysUserId] = useState<string | null>(null);
	const [isAddingPasskey, setIsAddingPasskey] = useState(false);
	const [deleteTargetPasskeyId, setDeleteTargetPasskeyId] = useState<
		string | null
	>(null);
	const [deletingPasskeyId, setDeletingPasskeyId] = useState<string | null>(
		null
	);
	const [newPasskeyName, setNewPasskeyName] = useState('');
	const [isAddPasskeyFormOpen, setIsAddPasskeyFormOpen] = useState(false);
	const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(
		null
	);
	const [editingPasskeyName, setEditingPasskeyName] = useState('');
	const [renamingPasskeyId, setRenamingPasskeyId] = useState<string | null>(
		null
	);
	const accountManagerRootRef = useRef<HTMLElement>(null);
	const webauthnBroadcastTabIdRef = useRef<string | null>(null);
	const authTermsCheckboxRef = useRef<HTMLInputElement>(null);
	const isWebauthnAutofillRequestActiveRef = useRef(false);
	const webauthnAutofillRequestIdRef = useRef(0);
	const passkeyListRequestIdRef = useRef(0);
	const passkeyListUpdatedAtRef = useRef(0);
	const passkeysFetchRequestedUserIdRef = useRef<string | null>(null);
	const sessionListUpdatedAtRef = useRef(0);
	const sessionListRequestIdRef = useRef(0);
	const sessionsFetchRequestedUserIdRef = useRef<string | null>(null);

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

	const ssoGrantListUpdatedAtRef = useRef(0);
	const ssoGrantListRequestIdRef = useRef(0);
	const ssoGrantsFetchRequestedUserIdRef = useRef<string | null>(null);

	const handleOpenLegalModal = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Open Legal Statement'
		);
		pushOverlayChild({
			childId: 'account.legal',
			onOpenChild: () => {
				setIsLegalModalOpen(true);
			},
			parentId: 'account.main',
		});
	}, []);

	const handleCloseLegalModal = useCallback(() => {
		vibrate();
		setIsLegalModalOpen(false);
		requestOverlayClose('account.legal');
	}, [vibrate]);

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
	const isSsoContext = pathname === '/sso/authorize';
	const isWebauthnSupported = webauthnSupportStatus === 'supported';
	const webauthnRpId =
		user !== null && passkeysUserId === user.id ? passkeysRpId : null;
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

	const signalCurrentWebAuthnUserDetails = useCallback(
		({
			displayName,
			userId,
			username,
		}: {
			displayName: string;
			userId: string;
			username: string;
		}) => {
			if (webauthnRpId === null) {
				return;
			}

			// eslint-disable-next-line compat/compat
			const publicKeyCredential = globalThis.PublicKeyCredential as
				| PublicKeyCredentialConstructor
				| undefined;
			if (publicKeyCredential === undefined) {
				return;
			}

			const { signalCurrentUserDetails } = publicKeyCredential;
			if (signalCurrentUserDetails === undefined) {
				return;
			}

			const userIdBytes = new TextEncoder().encode(userId);
			void signalCurrentUserDetails({
				displayName,
				name: username,
				rpId: webauthnRpId,
				userId: bufferToBase64URLString(userIdBytes.buffer),
			}).catch((error: unknown) => {
				console.warn(
					'Failed to signal updated WebAuthn user details.',
					{ errorCode: getLogSafeErrorCode(error) }
				);
			});
		},
		[webauthnRpId]
	);

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
		setProfileUsername(user?.username ?? '');
		setProfileNickname(user?.nickname ?? '');
		setProfileCurrentPassword('');
		setProfileError(null);
	}, [user?.id, user?.nickname, user?.username]);

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
			setMessage('请输入用户名和密码');
			return;
		}
		if (!hasAcceptedAuthTerms) {
			setShouldHighlightAuthTerms(true);
			setMessage(AUTH_TERMS_REQUIRED_MESSAGE);
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
				setMessage(authMode === 'login' ? '登录成功' : '注册成功');

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
				setMessage(error instanceof Error ? error.message : '认证失败');
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
	}, [vibrate]);

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
	}, [vibrate]);

	const handlePasswordAuthEntryPress = useCallback(() => {
		vibrate();

		if (!hasAcceptedAuthTerms) {
			setShouldHighlightAuthTerms(true);
			setMessage(AUTH_TERMS_REQUIRED_MESSAGE);
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
	}, [hasAcceptedAuthTerms, vibrate]);

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
	}, [vibrate]);

	const handleAuthTermsAcceptedChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const { checked } = event.currentTarget;
			setHasAcceptedAuthTerms(checked);
			if (checked) {
				setShouldHighlightAuthTerms(false);
				setMessage((currentMessage) =>
					currentMessage === AUTH_TERMS_REQUIRED_MESSAGE
						? null
						: currentMessage
				);
			}
		},
		[]
	);

	const handleAuthTermsLabelPointerDown = useCallback(
		(event: PointerEvent<HTMLLabelElement>) => {
			event.preventDefault();
			authTermsCheckboxRef.current?.focus();
		},
		[]
	);

	const handleAuthUsernameChange = useCallback((value: string) => {
		setUsername(value);
		setMessage((currentMessage) =>
			currentMessage === 'invalid-credentials' ? null : currentMessage
		);
	}, []);

	const handleAuthPasswordChange = useCallback((value: string) => {
		setPassword(value);
		setMessage((currentMessage) =>
			currentMessage === 'invalid-credentials' ? null : currentMessage
		);
	}, []);

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
										'账号状态刷新失败，请稍后重试'
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
					isInitialPasswordSetup ? '登录密码已设置' : '密码已更新'
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
				setMessage(error instanceof Error ? error.message : '改密失败');
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
			setMessage('资料已更新');
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
										'账号状态刷新失败，请稍后重试'
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
				setMessage('资料已更新');
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
					error instanceof Error ? error.message : '资料修改失败'
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

	const logoutAfterFlush = useCallback(
		(
			action: (csrfToken: string) => Promise<TAccountApiResult<unknown>>,
			trackName: string
		) => {
			if (csrfToken === null || isSubmitting || user === null) {
				return;
			}

			vibrate();

			trackEvent(
				trackEvent.category.click,
				'Account Auth Button',
				trackName
			);

			setIsSubmitting(true);
			setMessage(null);

			const expectedAuthContext = {
				expectedCsrfToken: csrfToken,
				expectedUserId: user.id,
			};

			void flushAccountSyncQueueUntilIdle()
				.then(async (isFlushed): Promise<TLogoutAfterFlushResult> => {
					if (!isFlushed) {
						if (
							!checkCurrentAccountAuthContext(expectedAuthContext)
						) {
							return LOGOUT_SKIPPED;
						}
						if (accountStore.shared.user.get() === null) {
							resetAccountStateIfCurrent(expectedAuthContext);
							return LOGOUT_SKIPPED;
						}

						const syncLastError =
							accountStore.shared.sync.lastError.get();
						if (syncLastError === 'unauthorized') {
							resetAccountStateIfCurrent(expectedAuthContext);
							return LOGOUT_SKIPPED;
						}

						setMessage('同步尚未完成，请先重试同步后再退出');

						return LOGOUT_SKIPPED;
					}

					return await action(csrfToken);
				})
				.then((result) => {
					if (result === LOGOUT_SKIPPED) {
						return;
					}
					if (result.status === 'error') {
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

					if (resetAccountStateIfCurrent(expectedAuthContext)) {
						void publishAccountRuntimeInvalidation({
							reason:
								trackName === 'Logout All'
									? 'logout-all'
									: 'logout',
							stateEpoch: user.state_epoch,
							userId: user.id,
						});
					}
				})
				.catch((error: unknown) => {
					if (
						error instanceof AccountApiError &&
						error.status === 401
					) {
						if (resetAccountStateIfCurrent(expectedAuthContext)) {
							void publishAccountRuntimeInvalidation({
								reason: 'session-expired',
								stateEpoch: user.state_epoch,
								userId: user.id,
							});
						}
						return;
					}

					setMessage(
						error instanceof Error
							? error.message
							: '退出前同步失败'
					);
				})
				.finally(() => {
					setIsSubmitting(false);
				});
		},
		[csrfToken, isSubmitting, user, vibrate]
	);

	const handleLogout = useCallback(() => {
		logoutAfterFlush(logoutAccount, 'Logout');
	}, [logoutAfterFlush]);

	const handleExport = useCallback(() => {
		if (isSubmitting || user === null) {
			return;
		}

		vibrate();

		trackEvent(
			trackEvent.category.click,
			'Account Sync Button',
			'Export Data'
		);

		setIsSubmitting(true);
		setMessage(null);

		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		const flushPromise =
			user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty
				? Promise.resolve(true)
				: flushAccountSyncQueueUntilIdle();

		void flushPromise
			.then((isFlushed) => {
				if (!isFlushed) {
					if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
						return null;
					}
					if (accountStore.shared.user.get() === null) {
						resetAccountStateIfCurrent(expectedAuthContext);
						return null;
					}

					const syncLastError =
						accountStore.shared.sync.lastError.get();
					if (syncLastError === 'unauthorized') {
						resetAccountStateIfCurrent(expectedAuthContext);
						return null;
					}

					setMessage('同步尚未完成，请先重试同步后再导出');

					return null;
				}

				return exportAccountData();
			})
			.then((result) => {
				if (result === null) {
					return;
				}
				if (result.status === 'error') {
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

					setMessage(result.message);
					return;
				}
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				const { data } = result;

				downloadJson(
					`mystia-account-${user.username}`,
					JSON.stringify(data, null, 2)
				);
				setMessage('账号数据已导出');
			})
			.catch((error: unknown) => {
				if (
					handleUnauthorizedAccountError(error, expectedAuthContext)
				) {
					return;
				}
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				setMessage(error instanceof Error ? error.message : '导出失败');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, isSubmitting, user, vibrate]);

	const handleLogoutAll = useCallback(() => {
		logoutAfterFlush(logoutAllAccount, 'Logout All');
	}, [logoutAfterFlush]);

	const handleDeleteData = useCallback(() => {
		if (csrfToken === null || isSubmitting || user === null) {
			return;
		}

		vibrate();

		trackEvent(
			trackEvent.category.click,
			'Account Sync Button',
			'Delete Data'
		);

		setIsDeleteDataPopoverOpen(false);
		setIsSubmitting(true);
		setMessage(null);

		const deleteStartedAt = Date.now();

		const expectedSessionContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		const expectedUserContext = { expectedUserId: user.id };

		void withAccountSyncOperationLease(
			user.id,
			'delete-data',
			async (operationId) => {
				const result = await deleteAccountData(
					csrfToken,
					user.state_epoch,
					user.sync_generation
				);
				if (result.status === 'error') {
					return { operationId, pauseResult: null, result };
				}
				const pauseResult = await pauseAccountSyncForEmptyCloud({
					stateEpoch: result.data.state_epoch,
					syncGeneration: result.data.sync_generation,
					userId: user.id,
				});
				return { operationId, pauseResult, result };
			}
		)
			.then(async (leaseResult) => {
				if (leaseResult === null) {
					setMessage('账号数据操作正在其他标签页进行，请稍后重试');
					return;
				}
				const { operationId, pauseResult, result } = leaseResult;
				if (result.status === 'error') {
					if (
						handleUnauthorizedAccountActionError(
							result,
							expectedSessionContext
						)
					) {
						return;
					}
					if (
						!checkCurrentAccountAuthContext(expectedSessionContext)
					) {
						return;
					}
					if (
						result.httpStatus === 409 &&
						(result.message === 'state-epoch-mismatch' ||
							result.message === 'sync-generation-mismatch')
					) {
						setMessage('云端数据已发生变化，正在刷新账号状态…');
						try {
							await refreshAccountState();
						} catch (error) {
							if (
								handleUnauthorizedAccountError(
									error,
									expectedSessionContext
								) ||
								!checkCurrentAccountAuthContext(
									expectedSessionContext
								)
							) {
								return;
							}
							setMessage('账号状态刷新失败，请稍后重试');
							return;
						}
						if (
							checkCurrentAccountAuthContext(
								expectedSessionContext
							)
						) {
							setMessage(
								'云端数据已发生变化，请重新确认后再清空'
							);
						}
						return;
					}

					setMessage(result.message);
					return;
				}
				if (!checkCurrentAccountAuthContext(expectedUserContext)) {
					return;
				}

				const { state_epoch } = result.data;

				if (!pauseResult) {
					throw new Error('account-sync-pause-incomplete');
				}
				return postAccountSyncBroadcastMessage({
					deleteStartedAt,
					namespaces: [],
					operationId,
					state_epoch,
					tabId: 'local',
					type: 'data-deleted',
					userId: user.id,
				})
					.then(() => {
						if (
							!checkCurrentAccountAuthContext(expectedUserContext)
						) {
							return;
						}

						setMessage('云端数据已清空');
					})
					.catch((error: unknown) => {
						console.warn(
							'Account data deletion broadcast failed.',
							{ errorCode: getLogSafeErrorCode(error) }
						);
						if (
							!checkCurrentAccountAuthContext(expectedUserContext)
						) {
							return;
						}

						setMessage('云端数据已清空');
					});
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountAuthContext(expectedSessionContext)) {
					return;
				}

				const errorCode =
					error instanceof Error
						? error.message
						: 'account-sync-pause-incomplete';
				if (errorCode === 'account-sync-pause-incomplete') {
					accountStore.shared.sync.lastError.set(errorCode);
				}
				setMessage(
					getAccountClientErrorMessage(errorCode, '清空云端数据失败')
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, isSubmitting, user, vibrate]);
	const handleDeleteAccount = useCallback(() => {
		if (csrfToken === null || isSubmitting || user === null) {
			return;
		}

		vibrate();

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Delete Account'
		);

		setIsDeleteAccountPopoverOpen(false);
		setIsSubmitting(true);
		setMessage(null);

		const expectedSessionContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		const expectedUserContext = { expectedUserId: user.id };

		void deleteAccount(csrfToken)
			.then(async (result) => {
				if (result.status === 'error') {
					if (
						handleUnauthorizedAccountActionError(
							result,
							expectedSessionContext
						)
					) {
						return;
					}
					if (
						!checkCurrentAccountAuthContext(expectedSessionContext)
					) {
						return;
					}

					setMessage(result.message);
					return;
				}

				void publishAccountRuntimeInvalidation({
					reason: 'account-deleted',
					stateEpoch: user.state_epoch,
					userId: user.id,
				});

				try {
					const didCleanUp = await withAccountSyncResetGenerationLock(
						user.id,
						() => {
							const deletedMarker =
								markAccountSyncResetGenerationDeleted({
									operationId: createAccountClientId(),
									stateEpoch: user.state_epoch,
									userId: user.id,
								});
							if (deletedMarker === null) {
								return false;
							}
							removeAccountSyncOperationForAccountDeletion(
								user.id
							);
							removeDirtyQueueEntries(user.id);
							removeAccountSyncBaseSnapshotsForAccountDeletion(
								user.id
							);
							removeAccountSyncConflictResolutionJournals(
								user.id
							);
							removeAccountSyncMetaForAccountDeletion(user.id);
							removeAccountSyncLeaseForAccountDeletion(user.id);
							return true;
						},
						{ ifAvailable: false }
					);
					if (didCleanUp !== true) {
						throw new Error(
							'account-deletion-local-cleanup-failed'
						);
					}
				} finally {
					resetAccountStateIfCurrent(expectedUserContext);
				}
			})
			.catch((error: unknown) => {
				console.warn('Failed to delete or clean up account state.', {
					errorCode: getLogSafeErrorCode(error),
				});
				if (!checkCurrentAccountAuthContext(expectedSessionContext)) {
					return;
				}

				setMessage(
					error instanceof Error ? error.message : '删除账号失败'
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, isSubmitting, user, vibrate]);
	const handleDeleteDataPopoverOpenChange = useCallback((isOpen: boolean) => {
		setIsDeleteDataPopoverOpen(isOpen);
		if (isOpen) {
			setIsDeleteAccountPopoverOpen(false);
		}
	}, []);
	const handleDeleteAccountPopoverOpenChange = useCallback(
		(isOpen: boolean) => {
			setIsDeleteAccountPopoverOpen(isOpen);
			if (isOpen) {
				setIsDeleteDataPopoverOpen(false);
			}
		},
		[]
	);
	const handleDeleteDataCancel = useCallback(() => {
		setIsDeleteDataPopoverOpen(false);
	}, []);

	const handleDeleteAccountCancel = useCallback(() => {
		setIsDeleteAccountPopoverOpen(false);
	}, []);

	const refreshAccountSsoGrantsForCurrentUser = useCallback(
		({ silent = false }: { silent?: boolean } = {}) => {
			if (user === null || csrfToken === null || passwordMustChange) {
				ssoGrantListRequestIdRef.current += 1;
				setIsSsoGrantListLoading(false);
				setSsoGrants([]);
				setSsoGrantsUserId(null);
				return Promise.resolve(false);
			}

			const userId = user.id;
			const expectedUserContext = { expectedUserId: userId };
			const requestId = ssoGrantListRequestIdRef.current + 1;
			ssoGrantListRequestIdRef.current = requestId;
			setIsSsoGrantListLoading(true);
			const isLatestRequest = () =>
				ssoGrantListRequestIdRef.current === requestId;
			const isCurrentUserRequest = () =>
				isLatestRequest() &&
				accountStore.shared.user.get()?.id === userId &&
				!accountStore.shared.passwordMustChange.get();

			return refreshAccountSsoGrantsOnce(userId, csrfToken)
				.then((result) => {
					if (!isCurrentUserRequest()) {
						return false;
					}

					if (result.status === 'error') {
						if (
							handleUnauthorizedAccountActionError(
								result,
								expectedUserContext
							)
						) {
							return false;
						}

						if (!silent) {
							setMessage(result.message);
						}
						return false;
					}

					setSsoGrants(result.data.grants);
					setSsoGrantsUserId(userId);
					return true;
				})
				.catch((error: unknown) => {
					if (!isCurrentUserRequest()) {
						return false;
					}
					if (
						handleUnauthorizedAccountError(
							error,
							expectedUserContext
						)
					) {
						return false;
					}

					console.warn('Failed to list SSO grants.', {
						errorCode: getLogSafeErrorCode(error),
					});
					if (!silent) {
						setMessage(
							error instanceof Error
								? error.message
								: '已授权应用刷新失败'
						);
					}

					return false;
				})
				.finally(() => {
					if (isLatestRequest()) {
						setIsSsoGrantListLoading(false);
					}
				});
		},
		[csrfToken, passwordMustChange, user]
	);

	useEffect(() => {
		if (user === null || csrfToken === null || passwordMustChange) {
			ssoGrantsFetchRequestedUserIdRef.current = null;
			ssoGrantListRequestIdRef.current += 1;
			setIsSsoGrantListLoading(false);
			if (
				bootstrapStatus === 'anonymous' ||
				bootstrapStatus === 'loggedIn' ||
				passwordMustChange
			) {
				setAccountSessions([]);
				sessionListUpdatedAtRef.current = Date.now();
				setAccountSessionsUserId(null);
				accountStore.shared.sessionInitialData.set(null);
				accountStore.shared.ssoGrantInitialData.set(null);
				setSsoGrants([]);
				ssoGrantListUpdatedAtRef.current = Date.now();
				setSsoGrantsUserId(null);
			}
			return;
		}

		if (ssoGrantInitialData?.user_id === user.id) {
			accountStore.shared.ssoGrantInitialData.set(null);
			ssoGrantsFetchRequestedUserIdRef.current = user.id;
			if (
				ssoGrantInitialData.rendered_at <
				ssoGrantListUpdatedAtRef.current
			) {
				return;
			}
			setSsoGrants(ssoGrantInitialData.grants);
			ssoGrantListUpdatedAtRef.current = ssoGrantInitialData.rendered_at;
			setSsoGrantsUserId(user.id);
			return;
		}
		if (ssoGrantInitialData !== null) {
			accountStore.shared.ssoGrantInitialData.set(null);
			setSsoGrants([]);
			ssoGrantListUpdatedAtRef.current = Date.now();
			setSsoGrantsUserId(null);
			ssoGrantsFetchRequestedUserIdRef.current = null;
		}
		if (
			ssoGrantsUserId === user.id ||
			ssoGrantsFetchRequestedUserIdRef.current === user.id
		) {
			return;
		}

		ssoGrantsFetchRequestedUserIdRef.current = user.id;
		ssoGrantListUpdatedAtRef.current = Date.now();
		void refreshAccountSsoGrantsForCurrentUser({ silent: true });
	}, [
		bootstrapStatus,
		csrfToken,
		passwordMustChange,
		refreshAccountSsoGrantsForCurrentUser,
		ssoGrantInitialData,
		ssoGrantsUserId,
		user,
	]);

	const handleRefreshSsoGrants = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account SSO Button',
			'Refresh Grants'
		);
		void refreshAccountSsoGrantsForCurrentUser();
	}, [refreshAccountSsoGrantsForCurrentUser, vibrate]);

	const refreshAccountSessionsForCurrentUser = useCallback(
		({ silent = false }: { silent?: boolean } = {}) => {
			if (user === null || csrfToken === null || passwordMustChange) {
				sessionListRequestIdRef.current += 1;
				setIsSessionListLoading(false);
				setAccountSessions([]);
				sessionListUpdatedAtRef.current = Date.now();
				setAccountSessionsUserId(null);
				return Promise.resolve(false);
			}

			const userId = user.id;
			const expectedUserContext = { expectedUserId: userId };
			const requestId = sessionListRequestIdRef.current + 1;
			sessionListRequestIdRef.current = requestId;
			setIsSessionListLoading(true);
			const isLatestRequest = () =>
				sessionListRequestIdRef.current === requestId;
			const isCurrentUserRequest = () =>
				isLatestRequest() &&
				accountStore.shared.user.get()?.id === userId &&
				!accountStore.shared.passwordMustChange.get();

			return refreshAccountSessions()
				.then((result) => {
					if (!isCurrentUserRequest()) {
						return false;
					}

					if (result.status === 'error') {
						if (
							handleUnauthorizedAccountActionError(
								result,
								expectedUserContext
							)
						) {
							return false;
						}

						if (!silent) {
							setMessage(result.message);
						}
						return false;
					}

					setAccountSessions(result.data.sessions);
					sessionListUpdatedAtRef.current = Date.now();
					setAccountSessionsUserId(userId);
					return true;
				})
				.catch((error: unknown) => {
					if (!isCurrentUserRequest()) {
						return false;
					}
					if (
						handleUnauthorizedAccountError(
							error,
							expectedUserContext
						)
					) {
						return false;
					}

					console.warn('Failed to list account sessions.', {
						errorCode: getLogSafeErrorCode(error),
					});
					if (!silent) {
						setMessage(
							error instanceof Error
								? error.message
								: '登录设备刷新失败'
						);
					}

					return false;
				})
				.finally(() => {
					if (isLatestRequest()) {
						setIsSessionListLoading(false);
					}
				});
		},
		[csrfToken, passwordMustChange, user]
	);

	useEffect(() => {
		if (user === null || csrfToken === null || passwordMustChange) {
			sessionsFetchRequestedUserIdRef.current = null;
			sessionListRequestIdRef.current += 1;
			setIsSessionListLoading(false);
			if (
				bootstrapStatus === 'anonymous' ||
				bootstrapStatus === 'loggedIn' ||
				passwordMustChange
			) {
				setAccountSessions([]);
				sessionListUpdatedAtRef.current = Date.now();
				setAccountSessionsUserId(null);
				accountStore.shared.sessionInitialData.set(null);
			}
			return;
		}
		if (sessionInitialData?.user_id === user.id) {
			accountStore.shared.sessionInitialData.set(null);
			sessionsFetchRequestedUserIdRef.current = user.id;
			if (
				sessionInitialData.rendered_at < sessionListUpdatedAtRef.current
			) {
				return;
			}
			setAccountSessions(sessionInitialData.sessions);
			sessionListUpdatedAtRef.current = sessionInitialData.rendered_at;
			setAccountSessionsUserId(user.id);
			return;
		}
		if (sessionInitialData !== null) {
			accountStore.shared.sessionInitialData.set(null);
			setAccountSessions([]);
			sessionListUpdatedAtRef.current = Date.now();
			setAccountSessionsUserId(null);
			sessionsFetchRequestedUserIdRef.current = null;
		}
		if (
			accountSessionsUserId === user.id ||
			sessionsFetchRequestedUserIdRef.current === user.id
		) {
			return;
		}

		sessionsFetchRequestedUserIdRef.current = user.id;
		sessionListUpdatedAtRef.current = Date.now();
		void refreshAccountSessionsForCurrentUser({ silent: true });
	}, [
		accountSessionsUserId,
		bootstrapStatus,
		csrfToken,
		passwordMustChange,
		refreshAccountSessionsForCurrentUser,
		sessionInitialData,
		user,
	]);

	const handleRefreshSessions = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Refresh Sessions'
		);
		void refreshAccountSessionsForCurrentUser();
	}, [refreshAccountSessionsForCurrentUser, vibrate]);

	const handleRevokeSsoGrantOpen = useCallback((clientId: string) => {
		setRevokeTargetClientId(clientId);
	}, []);

	const handleRevokeSsoGrantCancel = useCallback(() => {
		setRevokeTargetClientId(null);
	}, []);

	const handleRevokeSsoGrant = useCallback(() => {
		if (
			csrfToken === null ||
			user === null ||
			revokeTargetClientId === null ||
			isSubmitting
		) {
			return;
		}

		vibrate();

		const clientId = revokeTargetClientId;

		trackEvent(
			trackEvent.category.click,
			'Account SSO Button',
			'Revoke Grant',
			clientId
		);

		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		setRevokeTargetClientId(null);
		setRevokingClientId(clientId);
		setIsSubmitting(true);

		revokeAccountSsoGrant(clientId, csrfToken)
			.then((result) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				if (result.status === 'error') {
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

				setSsoGrants((prev) =>
					prev.filter((grant) => grant.client.id !== clientId)
				);
				ssoGrantListUpdatedAtRef.current = Date.now();
				setMessage('已撤销授权');
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

				setMessage(
					error instanceof Error ? error.message : '撤销授权失败'
				);
			})
			.finally(() => {
				setRevokingClientId(null);
				setIsSubmitting(false);
			});
	}, [csrfToken, isSubmitting, revokeTargetClientId, user, vibrate]);

	const handleRevokeSessionOpen = useCallback((sessionId: string) => {
		setRevokeTargetSessionId(sessionId);
	}, []);

	const handleRevokeSessionCancel = useCallback(() => {
		setRevokeTargetSessionId(null);
	}, []);

	const handleRevokeSession = useCallback(() => {
		if (
			csrfToken === null ||
			user === null ||
			revokeTargetSessionId === null ||
			isSubmitting
		) {
			return;
		}

		vibrate();

		const sessionId = revokeTargetSessionId;

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Revoke Session'
		);

		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		setRevokeTargetSessionId(null);
		setRevokingSessionId(sessionId);
		setIsSubmitting(true);
		setMessage(null);

		revokeAccountSession(sessionId, csrfToken)
			.then((result) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				if (result.status === 'error') {
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

				setAccountSessions((prev) =>
					prev.filter((session) => session.id !== sessionId)
				);
				sessionListUpdatedAtRef.current = Date.now();
				setMessage('已下线登录设备');
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

				setMessage(
					error instanceof Error ? error.message : '登录设备撤销失败'
				);
			})
			.finally(() => {
				setRevokingSessionId(null);
				setIsSubmitting(false);
			});
	}, [csrfToken, isSubmitting, revokeTargetSessionId, user, vibrate]);

	useLayoutEffect(() => {
		const isSupported = browserSupportsWebAuthn();

		setWebauthnSupportStatus(isSupported ? 'supported' : 'unsupported');
		if (!isSupported) {
			setIsWebauthnAutofillSupported(false);
		}
	}, []);

	useEffect(() => {
		if (!isWebauthnSupported) {
			setIsWebauthnAutofillSupported(false);
			return;
		}

		let isCanceled = false;

		void browserSupportsWebAuthnAutofill()
			.then((isAutofillSupported) => {
				if (!isCanceled) {
					setIsWebauthnAutofillSupported(isAutofillSupported);
				}
			})
			.catch(() => {
				if (!isCanceled) {
					setIsWebauthnAutofillSupported(false);
				}
			});

		return () => {
			isCanceled = true;
		};
	}, [isWebauthnSupported]);

	useEffect(() => {
		webauthnBroadcastTabIdRef.current ??= createAccountClientId();
	}, []);

	const refreshPasskeysForCurrentUser = useCallback(
		({ silent = false }: { silent?: boolean } = {}) => {
			if (
				!isWebauthnSupported ||
				user === null ||
				csrfToken === null ||
				passwordMustChange
			) {
				passkeyListRequestIdRef.current += 1;
				setIsPasskeyListLoading(false);
				setPasskeys([]);
				setPasskeysRpId(null);
				passkeyListUpdatedAtRef.current = Date.now();
				setPasskeysUserId(null);
				return Promise.resolve(false);
			}

			const userId = user.id;
			const expectedUserContext = { expectedUserId: userId };
			const requestId = passkeyListRequestIdRef.current + 1;
			passkeyListRequestIdRef.current = requestId;
			setIsPasskeyListLoading(true);
			const isLatestRequest = () =>
				passkeyListRequestIdRef.current === requestId;
			const isCurrentUserRequest = () =>
				isLatestRequest() &&
				accountStore.shared.user.get()?.id === userId &&
				!accountStore.shared.passwordMustChange.get();

			return listWebAuthnCredentials()
				.then((result) => {
					if (!isCurrentUserRequest()) {
						return false;
					}
					if (result.status === 'error') {
						if (
							handleUnauthorizedAccountActionError(
								result,
								expectedUserContext
							)
						) {
							return false;
						}

						if (!silent) {
							setMessage(result.message);
						}
						return false;
					}

					setPasskeys(result.data.credentials);
					setPasskeysRpId(result.data.rp_id);
					passkeyListUpdatedAtRef.current = Date.now();
					setPasskeysUserId(userId);
					return true;
				})
				.catch((error: unknown) => {
					if (!isCurrentUserRequest()) {
						return false;
					}
					if (
						handleUnauthorizedAccountError(
							error,
							expectedUserContext
						)
					) {
						return false;
					}

					if (!silent) {
						setMessage(
							error instanceof Error
								? error.message
								: '通行密钥刷新失败'
						);
					}

					return false;
				})
				.finally(() => {
					if (isLatestRequest()) {
						setIsPasskeyListLoading(false);
					}
				});
		},
		[csrfToken, isWebauthnSupported, passwordMustChange, user]
	);

	useEffect(() => {
		if (
			!isWebauthnSupported ||
			user === null ||
			csrfToken === null ||
			passwordMustChange
		) {
			passkeysFetchRequestedUserIdRef.current = null;
			setPasskeys([]);
			setPasskeysRpId(null);
			passkeyListRequestIdRef.current += 1;
			setIsPasskeyListLoading(false);
			passkeyListUpdatedAtRef.current = Date.now();
			setPasskeysUserId(null);
			accountStore.shared.webauthnInitialData.set(null);
			return;
		}
		if (webauthnInitialData?.user_id === user.id) {
			accountStore.shared.webauthnInitialData.set(null);
			passkeysFetchRequestedUserIdRef.current = user.id;
			if (
				webauthnInitialData.rendered_at <
				passkeyListUpdatedAtRef.current
			) {
				return;
			}
			setPasskeys(webauthnInitialData.credentials);
			setPasskeysRpId(webauthnInitialData.rp_id);
			passkeyListUpdatedAtRef.current = webauthnInitialData.rendered_at;
			setPasskeysUserId(user.id);
			return;
		}
		if (webauthnInitialData !== null) {
			accountStore.shared.webauthnInitialData.set(null);
			setPasskeys([]);
			setPasskeysRpId(null);
			passkeyListUpdatedAtRef.current = Date.now();
			setPasskeysUserId(null);
			passkeysFetchRequestedUserIdRef.current = null;
		}
		if (
			passkeysUserId === user.id ||
			passkeysFetchRequestedUserIdRef.current === user.id
		) {
			return;
		}

		passkeysFetchRequestedUserIdRef.current = user.id;
		passkeyListUpdatedAtRef.current = Date.now();
		void refreshPasskeysForCurrentUser({ silent: true });
	}, [
		csrfToken,
		isWebauthnSupported,
		passkeysUserId,
		passwordMustChange,
		refreshPasskeysForCurrentUser,
		user,
		webauthnInitialData,
	]);

	useEffect(() => {
		if (!isWebauthnSupported) {
			return;
		}

		return subscribeAccountWebauthnBroadcastMessage((message) => {
			if (
				message.userId !== accountStore.shared.user.get()?.id ||
				message.tabId === webauthnBroadcastTabIdRef.current
			) {
				return;
			}

			void refreshPasskeysForCurrentUser({ silent: true });
		});
	}, [isWebauthnSupported, refreshPasskeysForCurrentUser]);

	const broadcastPasskeyChange = useCallback((userId: string) => {
		void postAccountWebauthnBroadcastMessage({
			tabId: webauthnBroadcastTabIdRef.current ?? '',
			userId,
		});
	}, []);

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

			setMessage('登录成功');

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
		[isSsoContext, router, stabilizeFocusBeforeAuthStateChange]
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

				setMessage(error instanceof Error ? error.message : '认证失败');
			});
	}, [handleWebAuthnLoginResult, isWebauthnAutofillLoginReady]);

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
			setMessage(AUTH_TERMS_REQUIRED_MESSAGE);
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

				setMessage(error instanceof Error ? error.message : '认证失败');
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
		vibrate,
	]);

	const handleWebAuthnAccountRegistration = useCallback(() => {
		if (isWebauthnAccountRegistrationPending || isWebauthnLoginPending) {
			return;
		}

		vibrate();

		if (!hasAcceptedAuthTerms) {
			setShouldHighlightAuthTerms(true);
			setMessage(AUTH_TERMS_REQUIRED_MESSAGE);
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
				setMessage('注册成功');

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

				setMessage(error instanceof Error ? error.message : '注册失败');
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
		stabilizeFocusBeforeAuthStateChange,
		vibrate,
	]);

	const handleAddPasskey = useCallback(() => {
		const currentCsrfToken = accountStore.shared.csrfToken.get();
		if (currentCsrfToken === null || isAddingPasskey) {
			return;
		}

		vibrate();

		const passkeyName = normalizeWebauthnCredentialName(newPasskeyName);
		if (!checkWebauthnCredentialNamePolicy(passkeyName)) {
			setMessage('invalid-passkey-name');
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Add Passkey'
		);

		setIsAddingPasskey(true);
		setMessage(null);

		const expectedAuthContext = {
			expectedCsrfToken: currentCsrfToken,
			expectedUserId: accountStore.shared.user.get()?.id ?? null,
		};

		void startWebAuthnRegistration(passkeyName ?? '', currentCsrfToken)
			.then((result) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}
				if (result.status === 'error') {
					if (
						handleUnauthorizedAccountActionError(
							result,
							expectedAuthContext
						)
					) {
						return;
					}
					if (result.message !== 'webauthn-canceled') {
						setMessage(result.message);
					}
					return;
				}

				setPasskeys(result.data.credentials);
				setPasskeysRpId(result.data.rp_id);
				setPasskeysUserId(expectedAuthContext.expectedUserId);
				passkeyListUpdatedAtRef.current = Date.now();
				setNewPasskeyName('');
				setIsAddPasskeyFormOpen(false);
				setMessage('通行密钥已添加');
				if (expectedAuthContext.expectedUserId !== null) {
					broadcastPasskeyChange(expectedAuthContext.expectedUserId);
				}
			})
			.catch((error: unknown) => {
				if (
					handleUnauthorizedAccountError(error, expectedAuthContext)
				) {
					return;
				}
				setMessage(
					error instanceof Error ? error.message : '通行密钥添加失败'
				);
			})
			.finally(() => {
				setIsAddingPasskey(false);
			});
	}, [broadcastPasskeyChange, isAddingPasskey, newPasskeyName, vibrate]);

	const handleOpenAddPasskeyForm = useCallback(() => {
		setNewPasskeyName('');
		setIsAddPasskeyFormOpen(true);
		setMessage(null);
	}, []);

	const handleCancelAddPasskey = useCallback(() => {
		setNewPasskeyName('');
		setIsAddPasskeyFormOpen(false);
	}, []);

	const handleDeletePasskeyOpen = useCallback((id: string) => {
		setDeleteTargetPasskeyId(id);
	}, []);

	const handleDeletePasskeyCancel = useCallback(() => {
		setDeleteTargetPasskeyId(null);
	}, []);

	const handleDeletePasskey = useCallback(() => {
		const currentCsrfToken = accountStore.shared.csrfToken.get();
		if (
			deleteTargetPasskeyId === null ||
			currentCsrfToken === null ||
			deletingPasskeyId !== null
		) {
			return;
		}
		vibrate();

		const id = deleteTargetPasskeyId;

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Delete Passkey'
		);

		const expectedAuthContext = {
			expectedCsrfToken: currentCsrfToken,
			expectedUserId: accountStore.shared.user.get()?.id ?? null,
		};
		setDeleteTargetPasskeyId(null);
		setDeletingPasskeyId(id);
		setMessage(null);

		void deleteWebAuthnCredential(id, currentCsrfToken)
			.then((result) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}
				if (result.status === 'error') {
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

				setPasskeys((prev) =>
					prev.filter((credential) => credential.id !== id)
				);
				setPasskeysUserId(expectedAuthContext.expectedUserId);
				passkeyListUpdatedAtRef.current = Date.now();
				setMessage('通行密钥已删除');
				if (expectedAuthContext.expectedUserId !== null) {
					broadcastPasskeyChange(expectedAuthContext.expectedUserId);
				}
			})
			.catch((error: unknown) => {
				if (
					handleUnauthorizedAccountError(error, expectedAuthContext)
				) {
					return;
				}
				setMessage(
					error instanceof Error ? error.message : '通行密钥删除失败'
				);
			})
			.finally(() => {
				setDeletingPasskeyId(null);
			});
	}, [
		broadcastPasskeyChange,
		deleteTargetPasskeyId,
		deletingPasskeyId,
		vibrate,
	]);

	const handleRenamePasskeyOpen = useCallback(
		(id: string, currentName: string | null) => {
			setEditingPasskeyId(id);
			setEditingPasskeyName(currentName ?? '');
			setMessage(null);
		},
		[]
	);

	const handleRenamePasskeyCancel = useCallback(() => {
		setEditingPasskeyId(null);
		setEditingPasskeyName('');
	}, []);

	const handleRenamePasskeySave = useCallback(() => {
		const currentCsrfToken = accountStore.shared.csrfToken.get();
		if (
			editingPasskeyId === null ||
			currentCsrfToken === null ||
			renamingPasskeyId !== null
		) {
			return;
		}

		vibrate();

		const passkeyName = normalizeWebauthnCredentialName(editingPasskeyName);
		if (!checkWebauthnCredentialNamePolicy(passkeyName)) {
			setMessage('invalid-passkey-name');
			return;
		}

		const id = editingPasskeyId;

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Rename Passkey'
		);

		const expectedAuthContext = {
			expectedCsrfToken: currentCsrfToken,
			expectedUserId: accountStore.shared.user.get()?.id ?? null,
		};
		setRenamingPasskeyId(id);
		setMessage(null);

		void renameWebAuthnCredential(id, passkeyName ?? '', currentCsrfToken)
			.then((result) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}
				if (result.status === 'error') {
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

				setPasskeys(result.data.credentials);
				setPasskeysRpId(result.data.rp_id);
				setPasskeysUserId(expectedAuthContext.expectedUserId);
				passkeyListUpdatedAtRef.current = Date.now();
				setEditingPasskeyId(null);
				setEditingPasskeyName('');
				setMessage('通行密钥已重命名');
				if (expectedAuthContext.expectedUserId !== null) {
					broadcastPasskeyChange(expectedAuthContext.expectedUserId);
				}
			})
			.catch((error: unknown) => {
				if (
					handleUnauthorizedAccountError(error, expectedAuthContext)
				) {
					return;
				}
				setMessage(
					error instanceof Error
						? error.message
						: '通行密钥重命名失败'
				);
			})
			.finally(() => {
				setRenamingPasskeyId(null);
			});
	}, [
		broadcastPasskeyChange,
		editingPasskeyId,
		editingPasskeyName,
		renamingPasskeyId,
		vibrate,
	]);

	if (bootstrapStatus === 'error') {
		return (
			<div className="space-y-4">
				<Heading as="h2" isFirst>
					账号
				</Heading>
				<p className="text-small leading-5 text-danger-600 dark:text-danger">
					{getBootstrapErrorMessage(lastError)}
				</p>
			</div>
		);
	}

	if (bootstrapStatus !== 'anonymous' && bootstrapStatus !== 'loggedIn') {
		return null;
	}

	if (shouldHideAfterSsoAuth) {
		return null;
	}

	const isMessageSuccess =
		message !== null &&
		[
			'登录成功',
			'注册成功',
			'密码已更新',
			'登录密码已设置',
			'资料已更新',
			'已撤销授权',
			'已下线登录设备',
			'通行密钥已添加',
			'通行密钥已删除',
			'通行密钥已重命名',
			'账号数据已导出',
			'云端数据已清空',
		].includes(message);
	const messageText =
		message === null ? null : getAccountClientErrorMessage(message);
	const authErrorMessage =
		user === null && messageText !== null && !isMessageSuccess
			? messageText
			: null;
	const registrationNicknameErrorMessage =
		authMode === 'register' && message === 'invalid-nickname'
			? authErrorMessage
			: null;
	const authCredentialErrorMessage =
		registrationNicknameErrorMessage === null ? authErrorMessage : null;
	const accountStatusMessage =
		messageText !== null && authErrorMessage === null ? messageText : null;
	const isAccountSyncPaused =
		user?.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty;
	const accountStatusDescription = isAccountSyncPaused
		? '云同步已暂停'
		: (accountStatusMessage ?? '账号同步已连接');
	const passwordDescription =
		authCredentialErrorMessage === null
			? authMode === 'register'
				? PASSWORD_RULE_DESCRIPTION
				: '使用账号密码登录'
			: undefined;
	const passwordChangeErrorMessage =
		passwordChangeError === null
			? null
			: getAccountClientErrorMessage(passwordChangeError);
	const profileErrorMessage =
		profileError === null
			? null
			: getAccountClientErrorMessage(profileError);
	const profileNicknameErrorMessage =
		profileError === 'invalid-nickname' ? profileErrorMessage : null;
	const profileUsernameErrorMessage =
		profileError !== null &&
		profileError !== 'invalid-nickname' &&
		profileError !== 'invalid-password'
			? profileErrorMessage
			: null;
	const profileCurrentPasswordErrorMessage =
		profileError === 'invalid-password' ? profileErrorMessage : null;
	const visibleSsoGrants = user?.id === ssoGrantsUserId ? ssoGrants : [];
	const isSsoGrantsReady = user !== null && ssoGrantsUserId === user.id;
	const visibleAccountSessions =
		user?.id === accountSessionsUserId ? accountSessions : [];
	const isAccountSessionsReady =
		user !== null && accountSessionsUserId === user.id;
	const visiblePasskeys = user?.id === passkeysUserId ? passkeys : [];
	const isPasskeyListReady = user !== null && passkeysUserId === user.id;
	const shouldShowAuthTermsConfirmation =
		user === null &&
		(shouldShowPasskeyPrimaryAuth || !isPasskeyPreferredAuthAvailable);

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
		<section
			ref={accountManagerRootRef}
			aria-label={user === null ? '账号登录' : '账号管理'}
			tabIndex={-1}
			className="space-y-4 rounded-small p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
		>
			<Heading
				as="h2"
				isFirst
				subTitle={
					user === null
						? isSsoContext
							? '登录小助手账号以授权给外部应用'
							: '登录后可在不同设备间同步此浏览器保存的数据'
						: '管理当前账号、同步状态和云端数据'
				}
				classNames={{ subTitle: '!-mt-3' }}
			>
				{isSsoContext && user === null ? 'SSO登录' : '账号'}
			</Heading>
			{user === null ? (
				<div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<AccountPanel className="flex flex-col gap-3">
						<AccountAuthEntryMotion
							motionKey={
								shouldShowPasskeyPrimaryAuth
									? 'passkey'
									: 'password'
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
													isDisabled={
														isWebauthnLoginPending
													}
													isLoading={
														isWebauthnAccountRegistrationPending
													}
													startContent={
														isWebauthnAccountRegistrationPending ? null : (
															<FontAwesomeIcon
																icon={
																	faUserPlus
																}
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
											onPress={
												handlePasswordAuthEntryPress
											}
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
												onPress={
													handleRegisterModePress
												}
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
												description={
													USERNAME_RULE_DESCRIPTION
												}
												isInvalid={
													authCredentialErrorMessage !==
													null
												}
												label="用户名"
												placeholder="输入账号用户名"
												startContent={
													<AccountInputIcon
														icon={faUser}
													/>
												}
												value={username}
												validationBehavior="aria"
												onFocus={
													handleAuthCredentialInputFocus
												}
												onValueChange={
													handleAuthUsernameChange
												}
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
																	icon={
																		faUser
																	}
																/>
															}
															value={
																registrationNickname
															}
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
													description={
														passwordDescription
													}
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
												onPress={
													handlePasskeyAuthEntryPress
												}
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
								<p>
									注册后会自动登录；登录后即可在授权页面完成确认。
								</p>
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
			) : (
				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<div className="space-y-4">
						<AccountPanel className="space-y-4">
							<AccountPanelTitle icon={faUser}>
								当前账号
							</AccountPanelTitle>
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary-600">
									<FontAwesomeIcon
										icon={faUser}
										className="w-4"
									/>
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
						{!passwordMustChange && (
							<AccountPanel className="space-y-4">
								<div className="space-y-2">
									<div>
										<div className="flex min-h-8 items-center justify-between gap-3">
											<div className="flex min-w-0 items-center gap-2">
												<FontAwesomeIcon
													icon={faFingerprint}
													className="w-4 text-primary-600"
												/>
												<span className="text-small font-medium text-foreground-700">
													通行密钥
												</span>
											</div>
											{isWebauthnSupported &&
											!isAddPasskeyFormOpen ? (
												<Button
													className="h-8 text-primary-600"
													isDisabled={isSubmitting}
													radius="full"
													size="sm"
													startContent={
														<FontAwesomeIcon
															icon={faPlus}
															className="h-3.5 w-3.5"
														/>
													}
													variant="light"
													onPress={
														handleOpenAddPasskeyForm
													}
												>
													添加
												</Button>
											) : null}
										</div>
										{isWebauthnSupported ? (
											<AccountCollapseMotion motionKey="webauthn-add-form">
												{isAddPasskeyFormOpen ? (
													<div className="pt-2">
														<div className="space-y-2 rounded-medium border border-default-200 bg-default-50/40 p-3">
															<Input
																description={
																	WEBAUTHN_CREDENTIAL_NAME_RULE_DESCRIPTION
																}
																isDisabled={
																	isAddingPasskey
																}
																label="通行密钥名称（可选）"
																maxLength={
																	WEBAUTHN_CREDENTIAL_NAME_MAX_LENGTH
																}
																placeholder="例如：我的手机、YubiKey"
																size="sm"
																value={
																	newPasskeyName
																}
																onValueChange={
																	setNewPasskeyName
																}
															/>
															<div className="flex items-center justify-end gap-2">
																<Button
																	isDisabled={
																		isAddingPasskey
																	}
																	radius="full"
																	size="sm"
																	variant="light"
																	onPress={
																		handleCancelAddPasskey
																	}
																>
																	取消
																</Button>
																<Button
																	color="primary"
																	isLoading={
																		isAddingPasskey
																	}
																	radius="full"
																	size="sm"
																	startContent={
																		isAddingPasskey ? null : (
																			<FontAwesomeIcon
																				icon={
																					faFingerprint
																				}
																				className="h-3.5 w-3.5"
																			/>
																		)
																	}
																	variant="flat"
																	onPress={
																		handleAddPasskey
																	}
																>
																	确认添加
																</Button>
															</div>
														</div>
													</div>
												) : null}
											</AccountCollapseMotion>
										) : null}
									</div>
									<AccountAnimatedList>
										{isWebauthnSupported ? (
											isPasskeyListLoading &&
											!isPasskeyListReady ? (
												<AccountAnimatedListItem key="loading">
													<p className="text-small leading-5 text-foreground-500">
														正在读取通行密钥
													</p>
												</AccountAnimatedListItem>
											) : visiblePasskeys.length === 0 ? (
												<AccountAnimatedListItem key="empty">
													<p className="text-small leading-5 text-foreground-500">
														暂无通行密钥
													</p>
												</AccountAnimatedListItem>
											) : (
												visiblePasskeys.map(
													(passkey) => (
														<AccountAnimatedListItem
															key={passkey.id}
														>
															<div className="rounded-medium border border-default-200 bg-default-50/40 px-3 py-2">
																<div className="space-y-1">
																	<div className="flex items-center justify-between gap-3">
																		{editingPasskeyId ===
																		passkey.id ? (
																			<div className="flex min-w-0 flex-1 items-center gap-2">
																				<Input
																					autoFocus
																					isDisabled={
																						renamingPasskeyId ===
																						passkey.id
																					}
																					maxLength={
																						WEBAUTHN_CREDENTIAL_NAME_MAX_LENGTH
																					}
																					placeholder="通行密钥名称"
																					size="sm"
																					value={
																						editingPasskeyName
																					}
																					onValueChange={
																						setEditingPasskeyName
																					}
																				/>
																				<Button
																					isIconOnly
																					aria-label="保存名称"
																					className="h-8 w-8 min-w-8 text-primary-600"
																					isLoading={
																						renamingPasskeyId ===
																						passkey.id
																					}
																					radius="full"
																					size="sm"
																					variant="light"
																					onPress={
																						handleRenamePasskeySave
																					}
																				>
																					<FontAwesomeIcon
																						icon={
																							faCheck
																						}
																						className="h-3.5 w-3.5"
																					/>
																				</Button>
																				<Button
																					isIconOnly
																					aria-label="取消重命名"
																					className="h-8 w-8 min-w-8 text-foreground-500"
																					isDisabled={
																						renamingPasskeyId ===
																						passkey.id
																					}
																					radius="full"
																					size="sm"
																					variant="light"
																					onPress={
																						handleRenamePasskeyCancel
																					}
																				>
																					<FontAwesomeIcon
																						icon={
																							faXmark
																						}
																						className="h-3.5 w-3.5"
																					/>
																				</Button>
																			</div>
																		) : (
																			<div className="flex min-w-0 flex-1 items-center gap-1">
																				<p className="min-w-0 truncate text-small font-medium text-foreground-700">
																					{passkey.name ??
																						'通行密钥'}
																				</p>
																				<Tooltip
																					showArrow
																					content="重命名"
																					placement="left"
																				>
																					<span className="inline-flex shrink-0">
																						<Button
																							isIconOnly
																							aria-label="重命名通行密钥"
																							className="h-7 w-7 min-w-7 shrink-0 text-primary-600"
																							isDisabled={
																								isSubmitting
																							}
																							radius="full"
																							size="sm"
																							variant="light"
																							onPress={() => {
																								handleRenamePasskeyOpen(
																									passkey.id,
																									passkey.name
																								);
																							}}
																						>
																							<FontAwesomeIcon
																								icon={
																									faPen
																								}
																								className="h-3 w-3"
																							/>
																						</Button>
																					</span>
																				</Tooltip>
																			</div>
																		)}
																		<Tooltip
																			showArrow
																			content="删除通行密钥"
																			placement="left"
																		>
																			<span className="inline-flex shrink-0">
																				<AccountConfirmButton
																					ariaLabel="删除通行密钥"
																					buttonLabel="删除通行密钥"
																					className="h-8 w-8 min-w-8 justify-center text-warning-600"
																					color="warning"
																					confirmLabel="确认删除"
																					fullWidth={
																						false
																					}
																					icon={
																						faTrash
																					}
																					isDisabled={
																						isSubmitting
																					}
																					isIconOnly
																					isLoading={
																						deletingPasskeyId ===
																						passkey.id
																					}
																					isOpen={
																						deleteTargetPasskeyId ===
																						passkey.id
																					}
																					radius="full"
																					size="sm"
																					onCancel={
																						handleDeletePasskeyCancel
																					}
																					onConfirm={
																						handleDeletePasskey
																					}
																					onOpenChange={(
																						isOpen
																					) => {
																						if (
																							isOpen
																						) {
																							handleDeletePasskeyOpen(
																								passkey.id
																							);
																						} else {
																							handleDeletePasskeyCancel();
																						}
																					}}
																				/>
																			</span>
																		</Tooltip>
																	</div>
																	<div className="min-w-0 space-y-1">
																		<p
																			className="break-words text-tiny text-foreground-500"
																			title={formatSessionTimestamp(
																				passkey.created_at
																			)}
																		>
																			添加于
																			{formatSessionTimestamp(
																				passkey.created_at
																			)}
																		</p>
																		<p className="break-words text-tiny text-foreground-500">
																			最近使用：
																			{passkey.last_used_at ===
																			null ? (
																				'从未使用'
																			) : (
																				<TimeAgo
																					timestamp={
																						passkey.last_used_at
																					}
																				/>
																			)}
																		</p>
																	</div>
																</div>
															</div>
														</AccountAnimatedListItem>
													)
												)
											)
										) : (
											<AccountAnimatedListItem key="unsupported">
												<p className="text-small leading-5 text-foreground-500">
													当前环境不支持通行密钥
												</p>
											</AccountAnimatedListItem>
										)}
									</AccountAnimatedList>
								</div>
							</AccountPanel>
						)}
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
												: (profileUsernameErrorMessage ??
													undefined)
										}
										isInvalid={
											isProfileUsernameInvalid ||
											profileUsernameErrorMessage !== null
										}
										isReadOnly={isProfileUsernameReadOnly}
										label="用户名"
										placeholder="输入新用户名"
										startContent={
											<AccountInputIcon icon={faUser} />
										}
										value={profileUsername}
										onValueChange={
											handleProfileUsernameChange
										}
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
														<AccountInputIcon
															icon={faKey}
														/>
													}
													type="password"
													value={
														profileCurrentPassword
													}
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
											description={
												NICKNAME_RULE_DESCRIPTION
											}
											errorMessage={
												isProfileNicknameInvalid
													? NICKNAME_RULE_DESCRIPTION
													: (profileNicknameErrorMessage ??
														undefined)
											}
											isInvalid={
												isProfileNicknameInvalid ||
												profileNicknameErrorMessage !==
													null
											}
											label="昵称"
											placeholder="显示名称"
											startContent={
												<AccountInputIcon
													icon={faUser}
												/>
											}
											value={profileNickname}
											onValueChange={
												handleProfileNicknameChange
											}
										/>
									</div>
									<Button
										className="mt-3"
										fullWidth
										color="primary"
										isDisabled={
											csrfToken === null ||
											(isProfileCurrentPasswordRequired &&
												profileCurrentPassword.length ===
													0) ||
											normalizedProfileUsername.length ===
												0 ||
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
							<form
								className="space-y-3"
								onSubmit={handlePasswordChangeSubmit}
							>
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
												passwordChangeErrorMessage ??
												undefined
											}
											isInvalid={
												passwordChangeErrorMessage !==
												null
											}
											label="当前密码"
											placeholder="输入当前密码"
											type="password"
											value={currentPassword}
											onValueChange={
												handleCurrentPasswordChange
											}
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
									label={
										isInitialPasswordSetup
											? '登录密码'
											: '新密码'
									}
									placeholder={
										isInitialPasswordSetup
											? '设置登录密码'
											: '输入新密码'
									}
									type="password"
									value={newPassword}
									onValueChange={setNewPassword}
								/>
								<Button
									fullWidth
									color={
										passwordMustChange
											? 'danger'
											: 'primary'
									}
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
											<FontAwesomeIcon
												icon={faKey}
												className="w-4"
											/>
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
					</div>
					{!passwordMustChange && (
						<AccountPanel className="space-y-4">
							<div>
								<AccountPanelTitle icon={faDownload}>
									数据与会话
								</AccountPanelTitle>
								<div className="flex flex-col gap-2">
									<Button
										fullWidth
										className="justify-start"
										isDisabled={isSubmitting}
										isLoading={isSubmitting}
										startContent={
											isSubmitting ? null : (
												<FontAwesomeIcon
													icon={faDownload}
													className="w-4"
												/>
											)
										}
										variant="flat"
										onPress={handleExport}
									>
										导出账号数据
									</Button>
									<Button
										fullWidth
										className="justify-start"
										isDisabled={
											isSubmitting || csrfToken === null
										}
										isLoading={isSubmitting}
										startContent={
											isSubmitting ? null : (
												<FontAwesomeIcon
													icon={
														faArrowRightFromBracket
													}
													className="w-4"
												/>
											)
										}
										variant="flat"
										onPress={handleLogout}
									>
										退出登录
									</Button>
									<Button
										fullWidth
										className="justify-start"
										isDisabled={
											isSubmitting || csrfToken === null
										}
										isLoading={isSubmitting}
										startContent={
											isSubmitting ? null : (
												<FontAwesomeIcon
													icon={faPowerOff}
													className="w-4"
												/>
											)
										}
										variant="flat"
										onPress={handleLogoutAll}
									>
										退出全部设备
									</Button>
								</div>
								<div className="mt-4 space-y-2 border-t border-default-200/80 pt-4">
									<div className="flex min-h-8 items-center justify-between gap-3">
										<div className="flex min-w-0 items-center gap-2">
											<FontAwesomeIcon
												icon={faDesktop}
												className="w-4 text-primary-600"
											/>
											<span className="text-small font-medium text-foreground-700">
												登录设备
											</span>
										</div>
										<Tooltip
											showArrow
											content="刷新会话"
											placement="left"
										>
											<span className="inline-flex shrink-0">
												<Button
													isIconOnly
													aria-label="刷新会话"
													className="h-8 w-8 min-w-8 text-primary-600"
													isDisabled={isSubmitting}
													isLoading={
														isSessionListLoading
													}
													radius="full"
													size="sm"
													spinner={
														<FontAwesomeIcon
															icon={faRotate}
															className="h-3.5 w-3.5 animate-spin"
														/>
													}
													variant="light"
													onPress={
														handleRefreshSessions
													}
												>
													<FontAwesomeIcon
														icon={faRotate}
														className="h-3.5 w-3.5"
													/>
												</Button>
											</span>
										</Tooltip>
									</div>
									<AccountAnimatedList>
										{isSessionListLoading &&
										!isAccountSessionsReady ? (
											<AccountAnimatedListItem key="loading">
												<p className="text-small leading-5 text-foreground-500">
													正在读取登录设备
												</p>
											</AccountAnimatedListItem>
										) : visibleAccountSessions.length ===
										  0 ? (
											<AccountAnimatedListItem key="empty">
												<p className="text-small leading-5 text-foreground-500">
													暂无可见会话
												</p>
											</AccountAnimatedListItem>
										) : (
											visibleAccountSessions.map(
												(session) => {
													const isCurrentSession =
														session.is_current;

													return (
														<AccountAnimatedListItem
															key={session.id}
														>
															<div
																className={cn(
																	'rounded-medium border px-3 py-2',
																	isCurrentSession
																		? 'border-primary/30 bg-primary/5'
																		: 'border-default-200 bg-default-50/40'
																)}
															>
																<div className="space-y-1">
																	<div className="flex items-center justify-between gap-3">
																		<div className="flex min-w-0 flex-wrap items-center gap-2">
																			<p className="min-w-0 truncate text-small font-medium text-foreground-700">
																				{isCurrentSession
																					? '当前会话'
																					: '其他会话'}
																			</p>
																		</div>
																		{isCurrentSession ? (
																			<span className="my-1.5 inline-flex min-w-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-primary/10 px-2 py-1 text-tiny leading-none text-primary-700">
																				本设备
																			</span>
																		) : (
																			<Tooltip
																				showArrow
																				content="下线设备"
																				placement="left"
																			>
																				<span className="inline-flex shrink-0">
																					<AccountConfirmButton
																						ariaLabel="下线设备"
																						buttonLabel="下线设备"
																						className="h-8 w-8 min-w-8 justify-center text-warning-600"
																						color="warning"
																						confirmLabel="确认下线"
																						fullWidth={
																							false
																						}
																						icon={
																							faArrowRightFromBracket
																						}
																						isDisabled={
																							isSubmitting
																						}
																						isIconOnly
																						isLoading={
																							isSubmitting &&
																							revokingSessionId ===
																								session.id
																						}
																						isOpen={
																							revokeTargetSessionId ===
																							session.id
																						}
																						radius="full"
																						size="sm"
																						onCancel={
																							handleRevokeSessionCancel
																						}
																						onConfirm={
																							handleRevokeSession
																						}
																						onOpenChange={(
																							isOpen
																						) => {
																							if (
																								isOpen
																							) {
																								handleRevokeSessionOpen(
																									session.id
																								);
																							} else {
																								handleRevokeSessionCancel();
																							}
																						}}
																					/>
																				</span>
																			</Tooltip>
																		)}
																	</div>
																	<div className="min-w-0 space-y-1">
																		<p className="break-words text-tiny text-foreground-500">
																			{
																				session.user_agent_summary
																			}
																		</p>
																		<p
																			className="break-words text-tiny text-foreground-500"
																			title={formatSessionTimestamp(
																				session.last_seen_at
																			)}
																		>
																			最近活动：
																			<TimeAgo
																				timestamp={
																					session.last_seen_at
																				}
																			/>
																			<span className="mx-1 text-default-300">
																				·
																			</span>
																			来源：
																			{
																				session.ip_summary
																			}
																		</p>
																		<p className="break-words text-tiny text-foreground-500">
																			创建于
																			{formatSessionTimestamp(
																				session.created_at
																			)}
																		</p>
																	</div>
																</div>
															</div>
														</AccountAnimatedListItem>
													);
												}
											)
										)}
									</AccountAnimatedList>
								</div>
								<div className="mt-4 space-y-2 border-t border-default-200/80 pt-4">
									<div className="flex min-h-8 items-center justify-between gap-3">
										<div className="flex min-w-0 items-center gap-2">
											<FontAwesomeIcon
												icon={faPlug}
												className="w-4 text-primary-600"
											/>
											<span className="text-small font-medium text-foreground-700">
												已授权应用
											</span>
										</div>
										<Tooltip
											showArrow
											content="刷新授权"
											placement="left"
										>
											<span className="inline-flex shrink-0">
												<Button
													isIconOnly
													aria-label="刷新授权"
													className="h-8 w-8 min-w-8 text-primary-600"
													isDisabled={isSubmitting}
													isLoading={
														isSsoGrantListLoading
													}
													radius="full"
													size="sm"
													spinner={
														<FontAwesomeIcon
															icon={faRotate}
															className="h-3.5 w-3.5 animate-spin"
														/>
													}
													variant="light"
													onPress={
														handleRefreshSsoGrants
													}
												>
													<FontAwesomeIcon
														icon={faRotate}
														className="h-3.5 w-3.5"
													/>
												</Button>
											</span>
										</Tooltip>
									</div>
									<AccountAnimatedList>
										{isSsoGrantListLoading &&
										!isSsoGrantsReady ? (
											<AccountAnimatedListItem key="loading">
												<p className="text-small leading-5 text-foreground-500">
													正在读取已授权应用
												</p>
											</AccountAnimatedListItem>
										) : visibleSsoGrants.length === 0 ? (
											<AccountAnimatedListItem key="empty">
												<p className="text-small leading-5 text-foreground-500">
													暂无已授权应用
												</p>
											</AccountAnimatedListItem>
										) : (
											visibleSsoGrants.map((grant) => (
												<AccountAnimatedListItem
													key={grant.client.id}
												>
													<div className="flex items-center justify-between gap-2 rounded-medium border border-default-200 bg-default-50/40 px-3 py-2">
														<div className="min-w-0 flex-1 space-y-1">
															<p className="break-words text-small font-medium text-foreground-700">
																{
																	grant.client
																		.name
																}
															</p>
															<p
																className="break-words text-tiny text-foreground-500"
																title={
																	grant.client
																		.id
																}
															>
																{
																	grant.client
																		.id
																}
															</p>
														</div>
														<Tooltip
															showArrow
															content="撤销授权"
															placement="left"
														>
															<span className="inline-flex shrink-0">
																<AccountConfirmButton
																	ariaLabel="撤销授权"
																	buttonLabel="撤销授权"
																	className="h-8 w-8 min-w-8 justify-center text-warning-600"
																	color="warning"
																	confirmLabel="确认撤销"
																	fullWidth={
																		false
																	}
																	icon={
																		faPlug
																	}
																	isDisabled={
																		isSubmitting ||
																		csrfToken ===
																			null
																	}
																	isIconOnly
																	isLoading={
																		isSubmitting &&
																		revokingClientId ===
																			grant
																				.client
																				.id
																	}
																	isOpen={
																		revokeTargetClientId ===
																		grant
																			.client
																			.id
																	}
																	radius="full"
																	size="sm"
																	onCancel={
																		handleRevokeSsoGrantCancel
																	}
																	onConfirm={
																		handleRevokeSsoGrant
																	}
																	onOpenChange={(
																		isOpen
																	) => {
																		if (
																			isOpen
																		) {
																			handleRevokeSsoGrantOpen(
																				grant
																					.client
																					.id
																			);
																		} else {
																			handleRevokeSsoGrantCancel();
																		}
																	}}
																/>
															</span>
														</Tooltip>
													</div>
												</AccountAnimatedListItem>
											))
										)}
									</AccountAnimatedList>
								</div>
							</div>
							<div className="space-y-3 border-t border-default-200/80 pt-4">
								<div className="flex items-start gap-2 rounded-medium bg-warning/10 px-3 py-2 text-small leading-5 text-warning-700 dark:text-warning-600">
									<FontAwesomeIcon
										icon={faTriangleExclamation}
										className="mt-1 w-4 shrink-0"
									/>
									<p>
										危险操作会影响云端数据或账号本身，请确认已经导出需要保留的数据。
									</p>
								</div>
								<div className="flex flex-col gap-2">
									<AccountConfirmButton
										buttonLabel={
											user.sync_status ===
											ACCOUNT_SYNC_STATUS_MAP.pausedEmpty
												? '云端数据已清空'
												: '清空云端数据'
										}
										color="warning"
										confirmLabel="确认清空"
										icon={faCloudArrowUp}
										isDisabled={
											isSubmitting ||
											csrfToken === null ||
											user.sync_status ===
												ACCOUNT_SYNC_STATUS_MAP.pausedEmpty
										}
										isLoading={isSubmitting}
										isOpen={isDeleteDataPopoverOpen}
										onOpenChange={
											handleDeleteDataPopoverOpenChange
										}
										onConfirm={handleDeleteData}
										onCancel={handleDeleteDataCancel}
									/>
									<AccountConfirmButton
										buttonLabel="删除账号"
										color="danger"
										confirmLabel="确认删除"
										icon={faTrash}
										isDisabled={
											isSubmitting || csrfToken === null
										}
										isLoading={isSubmitting}
										isOpen={isDeleteAccountPopoverOpen}
										onOpenChange={
											handleDeleteAccountPopoverOpenChange
										}
										onConfirm={handleDeleteAccount}
										onCancel={handleDeleteAccountCancel}
									/>
								</div>
							</div>
						</AccountPanel>
					)}
				</div>
			)}
			<Modal
				coordination={{ id: 'account.legal' }}
				isOpen={isLegalModalOpen}
				size="2xl"
				onClose={handleCloseLegalModal}
			>
				<LegalStatement />
			</Modal>
		</section>
	);
});
