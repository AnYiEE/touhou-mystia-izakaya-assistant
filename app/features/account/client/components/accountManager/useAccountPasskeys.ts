'use client';

import {
	browserSupportsWebAuthn,
	browserSupportsWebAuthnAutofill,
	bufferToBase64URLString,
} from '@simplewebauthn/browser';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';

import {
	type IWebauthnCredentialSummary,
	deleteWebAuthnCredential,
	listWebAuthnCredentials,
	renameWebAuthnCredential,
	startWebAuthnRegistration,
} from '@/features/account/client/api';
import { createAccountClientId } from '@/features/account/client/clientId';
import { checkCurrentAccountAuthContext } from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	postAccountWebauthnBroadcastMessage,
	subscribeAccountWebauthnBroadcastMessage,
} from '@/features/account/client/sync/broadcast';
import {
	checkWebauthnCredentialNamePolicy,
	normalizeWebauthnCredentialName,
} from '@/features/account/constants';
import type {
	IAccountUserProfile,
	IAccountWebauthnInitialData,
} from '@/features/account/contracts';
import { trackEvent } from '@/features/analytics/client/trackEvent';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	type IAccountActionController,
	handleUnauthorizedAccountActionError,
	handleUnauthorizedAccountError,
} from './controller';
import { ACCOUNT_MANAGER_MESSAGE_MAP } from './copy';

type TWebAuthnSupportStatus = 'supported' | 'unsupported';

interface IUseAccountPasskeysOptions {
	controller: IAccountActionController;
	csrfToken: string | null;
	passwordMustChange: boolean;
	user: IAccountUserProfile | null;
	vibrate: () => void;
	webauthnInitialData: IAccountWebauthnInitialData | null;
}

export interface IUseAccountPasskeysResult {
	deleteTargetPasskeyId: string | null;
	deletingPasskeyId: string | null;
	editingPasskeyId: string | null;
	editingPasskeyName: string;
	handleAddPasskey: () => void;
	handleCancelAddPasskey: () => void;
	handleDeletePasskey: () => void;
	handleDeletePasskeyCancel: () => void;
	handleDeletePasskeyOpen: (id: string) => void;
	handleOpenAddPasskeyForm: () => void;
	handleRenamePasskeyCancel: () => void;
	handleRenamePasskeyOpen: (id: string, currentName: string | null) => void;
	handleRenamePasskeySave: () => void;
	isAddPasskeyFormOpen: boolean;
	isAddingPasskey: boolean;
	isPasskeyListLoading: boolean;
	isWebauthnAutofillSupported: boolean;
	isWebauthnSupported: boolean;
	newPasskeyName: string;
	passkeys: IWebauthnCredentialSummary[];
	passkeysUserId: string | null;
	renamingPasskeyId: string | null;
	setEditingPasskeyName: (value: string) => void;
	setNewPasskeyName: (value: string) => void;
	signalCurrentWebAuthnUserDetails: (details: {
		displayName: string;
		userId: string;
		username: string;
	}) => void;
}

export function useAccountPasskeys({
	controller: { setMessage },
	csrfToken,
	passwordMustChange,
	user,
	vibrate,
	webauthnInitialData,
}: IUseAccountPasskeysOptions): IUseAccountPasskeysResult {
	const [webauthnSupportStatus, setWebauthnSupportStatus] =
		useState<TWebAuthnSupportStatus>('supported');

	const [isWebauthnAutofillSupported, setIsWebauthnAutofillSupported] =
		useState(false);

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

	const webauthnBroadcastTabIdRef = useRef<string | null>(null);

	const passkeyListRequestIdRef = useRef(0);

	const passkeyListUpdatedAtRef = useRef(0);

	const passkeysFetchRequestedUserIdRef = useRef<string | null>(null);

	const isWebauthnSupported = webauthnSupportStatus === 'supported';
	const webauthnRpId =
		user !== null && passkeysUserId === user.id ? passkeysRpId : null;

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
								: ACCOUNT_MANAGER_MESSAGE_MAP.passkeyRefreshFailed
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
		[csrfToken, isWebauthnSupported, passwordMustChange, setMessage, user]
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
				setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.passkeyAdded);
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
						: ACCOUNT_MANAGER_MESSAGE_MAP.passkeyAddFailed
				);
			})
			.finally(() => {
				setIsAddingPasskey(false);
			});
	}, [
		broadcastPasskeyChange,
		isAddingPasskey,
		newPasskeyName,
		setMessage,
		vibrate,
	]);

	const handleOpenAddPasskeyForm = useCallback(() => {
		setNewPasskeyName('');
		setIsAddPasskeyFormOpen(true);
		setMessage(null);
	}, [setMessage]);

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
				setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.passkeyDeleted);
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
						: ACCOUNT_MANAGER_MESSAGE_MAP.passkeyDeleteFailed
				);
			})
			.finally(() => {
				setDeletingPasskeyId(null);
			});
	}, [
		broadcastPasskeyChange,
		deleteTargetPasskeyId,
		deletingPasskeyId,
		setMessage,
		vibrate,
	]);

	const handleRenamePasskeyOpen = useCallback(
		(id: string, currentName: string | null) => {
			setEditingPasskeyId(id);
			setEditingPasskeyName(currentName ?? '');
			setMessage(null);
		},
		[setMessage]
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
				setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.passkeyRenamed);
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
						: ACCOUNT_MANAGER_MESSAGE_MAP.passkeyRenameFailed
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
		setMessage,
		vibrate,
	]);

	return {
		deleteTargetPasskeyId,
		deletingPasskeyId,
		editingPasskeyId,
		editingPasskeyName,
		handleAddPasskey,
		handleCancelAddPasskey,
		handleDeletePasskey,
		handleDeletePasskeyCancel,
		handleDeletePasskeyOpen,
		handleOpenAddPasskeyForm,
		handleRenamePasskeyCancel,
		handleRenamePasskeyOpen,
		handleRenamePasskeySave,
		isAddingPasskey,
		isAddPasskeyFormOpen,
		isPasskeyListLoading,
		isWebauthnAutofillSupported,
		isWebauthnSupported,
		newPasskeyName,
		passkeys,
		passkeysUserId,
		renamingPasskeyId,
		setEditingPasskeyName,
		setNewPasskeyName,
		signalCurrentWebAuthnUserDetails,
	};
}
