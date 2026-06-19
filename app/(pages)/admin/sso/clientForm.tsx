'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faBan,
	faCircleCheck,
	faKey,
	faPlus,
	faRotate,
	faSave,
	faServer,
	faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { Textarea } from '@heroui/input';

import { Button, Input, Switch, cn } from '@/design/ui/components';

import AdminSsoClientGrantPanel from './clientGrantPanel';
import {
	AdminBadge,
	AdminCodeBlock,
	AdminConfirmButton,
	AdminEmptyState,
	AdminHeader,
	AdminHeaderActionLink,
	AdminInputIcon,
	AdminLoadingState,
	AdminMessage,
	AdminPanel,
	AdminPanelTitle,
	AdminPanelToolbar,
	AdminShell,
	adminTextareaClassNames,
} from '../components';
import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';

import {
	type TAdminApiResult,
	type TAdminSsoClientApiResult,
	createAdminSsoClient,
	createAdminSsoClientSecret,
	deleteAdminSsoClient,
	fetchAdminMe,
	fetchAdminSsoClient,
	listAdminSsoClientSecrets,
	revokeAdminSsoClientSecret,
	toggleAdminSsoClientDisabled,
	updateAdminSsoClient,
	updateAdminSsoClientSecret,
} from '../api';
import {
	type IAdminMeData,
	type IAdminSsoClientCreateBody,
	type IAdminSsoClientMutationData,
	type IAdminSsoClientProfile,
	type IAdminSsoClientSecretMutationData,
	type IAdminSsoClientSecretRecord,
	type IAdminSsoClientUpdateBody,
	type IAdminSsoClientUsersData,
} from '@/lib/account/shared/types';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import { accountStore as store } from '@/stores/account';

function joinLines(values: string[]) {
	return values.join('\n');
}

function parseLines(value: string) {
	const values: string[] = [];

	value
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.forEach((line) => {
			if (!values.includes(line)) {
				values.push(line);
			}
		});

	return values;
}

function normalizeOptionalUri(value: string) {
	const trimmed = value.trim();

	return trimmed === '' ? null : trimmed;
}

function createUpdateBodyFromClient(
	client: IAdminSsoClientProfile,
	disabled: boolean
): IAdminSsoClientUpdateBody {
	return {
		cancel_redirect_uri: client.cancel_redirect_uri,
		custom_scheme_redirect_uris: client.custom_scheme_redirect_uris,
		disabled,
		https_redirect_uris: client.https_redirect_uris,
		id: client.id,
		loopback_redirect_paths: client.loopback_redirect_paths,
		name: client.name,
		status_callback_url: client.status_callback_url,
	};
}

function checkStringListEqual(left: string[], right: string[]) {
	return (
		left.length === right.length &&
		left.every((value, index) => value === right[index])
	);
}

function checkClientBodyMatchesClient(
	body: IAdminSsoClientCreateBody,
	client: IAdminSsoClientProfile | null
) {
	return (
		client !== null &&
		body.cancel_redirect_uri === client.cancel_redirect_uri &&
		checkStringListEqual(
			body.custom_scheme_redirect_uris,
			client.custom_scheme_redirect_uris
		) &&
		checkStringListEqual(
			body.https_redirect_uris,
			client.https_redirect_uris
		) &&
		body.id === client.id &&
		checkStringListEqual(
			body.loopback_redirect_paths,
			client.loopback_redirect_paths
		) &&
		body.name === client.name &&
		body.status_callback_url === client.status_callback_url
	);
}

function checkAdminUnauthorizedActionResult(
	result: Extract<TAdminApiResult, { status: 'error' }>
) {
	return (
		result.httpStatus === 401 &&
		(result.message === 'unauthorized' ||
			result.message === 'admin-session-expired')
	);
}

type TConfirmAction =
	| 'delete-client'
	| 'toggle-client'
	| `revoke-secret:${string}`
	| null;

function createSecretDisplayName(secret: IAdminSsoClientSecretRecord) {
	return secret.label ?? `secret #${secret.position + 1}`;
}

function createSecretStatusText(secret: IAdminSsoClientSecretRecord) {
	if (secret.status === 'revoked') {
		return '已撤销';
	}
	if (secret.status === 'disabled') {
		return '已禁用';
	}

	return '可用';
}

function AdminSecretStatusBadge({
	secret,
}: {
	secret: IAdminSsoClientSecretRecord;
}) {
	const tone =
		secret.status === 'active'
			? 'success'
			: secret.status === 'disabled'
				? 'warning'
				: 'default';

	return (
		<AdminBadge tone={tone}>{createSecretStatusText(secret)}</AdminBadge>
	);
}

export interface IAdminSsoClientFormInitialData {
	admin: IAdminMeData | null;
	client: IAdminSsoClientProfile | null;
	clientUsers: IAdminSsoClientUsersData | null;
	isAuthLoading: boolean;
	isClientServerLoaded: boolean;
	loadError: string | null;
	message: string | null;
}

interface IProps {
	clientId?: string;
	initialData: IAdminSsoClientFormInitialData;
	listHref?: string;
	mode: 'create' | 'edit';
}

export default memo<IProps>(function AdminSsoClientForm({
	clientId,
	initialData,
	listHref = '/admin/sso',
	mode,
}) {
	const router = useRouter();

	const requestIdRef = useRef(0);
	const secretRequestIdRef = useRef(0);
	const formMutationInFlightRef = useRef(false);
	const secretMutationInFlightRef = useRef(false);
	const isServerInitialClientRef = useRef(initialData.isClientServerLoaded);

	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [client, setClient] = useState<IAdminSsoClientProfile | null>(
		initialData.client
	);
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [isLoading, setIsLoading] = useState(
		mode === 'edit' &&
			initialData.client === null &&
			initialData.loadError === null
	);
	const [isSaving, setIsSaving] = useState(false);
	const [confirmAction, setConfirmAction] = useState<TConfirmAction>(null);
	const [loadError, setLoadError] = useState<string | null>(
		initialData.loadError
	);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
	const [secretLabel, setSecretLabel] = useState('');
	const [secretLabelDrafts, setSecretLabelDrafts] = useState<
		Record<string, string>
	>({});
	const [secrets, setSecrets] = useState<IAdminSsoClientSecretRecord[]>([]);
	const [isSecretLoading, setIsSecretLoading] = useState(false);
	const [mutatingSecretId, setMutatingSecretId] = useState<string | null>(
		null
	);

	const [id, setId] = useState(initialData.client?.id ?? clientId ?? '');
	const [name, setName] = useState(initialData.client?.name ?? '');
	const [loopbackRedirectPaths, setLoopbackRedirectPaths] = useState(
		initialData.client === null
			? ''
			: joinLines(initialData.client.loopback_redirect_paths)
	);
	const [customSchemeRedirectUris, setCustomSchemeRedirectUris] = useState(
		initialData.client === null
			? ''
			: joinLines(initialData.client.custom_scheme_redirect_uris)
	);
	const [httpsRedirectUris, setHttpsRedirectUris] = useState(
		initialData.client === null
			? ''
			: joinLines(initialData.client.https_redirect_uris)
	);
	const [statusCallbackUrl, setStatusCallbackUrl] = useState(
		initialData.client?.status_callback_url ?? ''
	);
	const [cancelRedirectUri, setCancelRedirectUri] = useState(
		initialData.client?.cancel_redirect_uri ?? ''
	);
	const isEditMode = mode === 'edit';
	const isCreatedClient = !isEditMode && client !== null;
	const title = isEditMode ? '编辑SSO客户端' : '新建SSO客户端';
	const isClientDisabled = client !== null && client.disabled_at !== null;
	const currentBody = useMemo<IAdminSsoClientCreateBody>(
		() => ({
			cancel_redirect_uri: normalizeOptionalUri(cancelRedirectUri),
			custom_scheme_redirect_uris: parseLines(customSchemeRedirectUris),
			https_redirect_uris: parseLines(httpsRedirectUris),
			id: id.trim(),
			loopback_redirect_paths: parseLines(loopbackRedirectPaths),
			name: name.trim(),
			status_callback_url: normalizeOptionalUri(statusCallbackUrl),
		}),
		[
			cancelRedirectUri,
			customSchemeRedirectUris,
			httpsRedirectUris,
			id,
			loopbackRedirectPaths,
			name,
			statusCallbackUrl,
		]
	);
	const hasClientChanges = !checkClientBodyMatchesClient(currentBody, client);
	const hasSecretLabelChanges = secrets.some(
		(secret) =>
			secret.status !== 'revoked' &&
			(secretLabelDrafts[secret.id] ?? '').trim() !== (secret.label ?? '')
	);
	const canSave =
		admin !== null &&
		(!isEditMode || client !== null) &&
		!isCreatedClient &&
		!isSaving &&
		(!isEditMode || hasClientChanges || hasSecretLabelChanges) &&
		id.trim().length > 0 &&
		name.trim().length > 0;
	const canMutateSecrets =
		!isClientDisabled &&
		!isSaving &&
		!isSecretLoading &&
		mutatingSecretId === null &&
		admin !== null;

	const applyClient = useCallback((value: IAdminSsoClientProfile) => {
		setClient(value);
		setId(value.id);
		setName(value.name);
		setLoopbackRedirectPaths(joinLines(value.loopback_redirect_paths));
		setCustomSchemeRedirectUris(
			joinLines(value.custom_scheme_redirect_uris)
		);
		setHttpsRedirectUris(joinLines(value.https_redirect_uris));
		setStatusCallbackUrl(value.status_callback_url ?? '');
		setCancelRedirectUri(value.cancel_redirect_uri ?? '');
	}, []);

	const handleActionError = useCallback(
		(error: Extract<TAdminSsoClientApiResult, { status: 'error' }>) => {
			if (
				error.httpStatus === 401 &&
				(error.message === 'unauthorized' ||
					error.message === 'admin-session-expired')
			) {
				clearAdminSession();
				setAdmin(null);
				setClient(null);
			}

			setMessage(error.displayMessage);
		},
		[]
	);

	const applyMutationResult = useCallback(
		(
			result: TAdminSsoClientApiResult<IAdminSsoClientMutationData>,
			successMessage: string
		) => {
			if (result.status === 'error') {
				handleActionError(result);
				return;
			}

			applyClient(result.data.client);
			setGeneratedSecret(result.data.client_secret ?? null);
			setMessage(successMessage);
		},
		[applyClient, handleActionError]
	);

	const handleUnauthorized = useCallback(() => {
		clearAdminSession();
		setAdmin(null);
		setClient(null);
	}, []);

	const applySecretMutationResult = useCallback(
		(
			result: TAdminSsoClientApiResult<IAdminSsoClientSecretMutationData>,
			successMessage: string
		) => {
			if (result.status === 'error') {
				handleActionError(result);
				return;
			}

			applyClient(result.data.client);
			setSecretLabelDrafts((current) => ({
				...current,
				[result.data.secret.id]: result.data.secret.label ?? '',
			}));
			setSecrets((current) => {
				const nextSecret = result.data.secret;
				const index = current.findIndex(
					(secret) => secret.id === nextSecret.id
				);
				if (index === -1) {
					return [...current, nextSecret].sort(
						(left, right) => left.position - right.position
					);
				}

				return current.map((secret) =>
					secret.id === nextSecret.id ? nextSecret : secret
				);
			});
			setGeneratedSecret(result.data.client_secret ?? null);
			setMessage(successMessage);
		},
		[applyClient, handleActionError]
	);

	const tryStartSecretMutation = useCallback((secretId: string | null) => {
		if (secretMutationInFlightRef.current) {
			return false;
		}

		secretMutationInFlightRef.current = true;
		setMutatingSecretId(secretId);
		return true;
	}, []);

	const finishSecretMutation = useCallback(() => {
		secretMutationInFlightRef.current = false;
		setMutatingSecretId(null);
	}, []);

	const refreshClient = useCallback(() => {
		if (!isEditMode || clientId === undefined) {
			return;
		}

		requestIdRef.current += 1;
		setIsLoading(true);
		setLoadError(null);
		setMessage(null);

		const requestId = requestIdRef.current;

		void fetchAdminSsoClient(clientId)
			.then((result) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					if (checkAdminUnauthorizedActionResult(result)) {
						clearAdminSession();
						setAdmin(null);
						return;
					}

					setLoadError(result.displayMessage);
					return;
				}

				setLoadError(null);
				applyClient(result.data.client);
			})
			.catch((error: unknown) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				setLoadError(
					error instanceof Error ? error.message : '读取SSO客户端失败'
				);
			})
			.finally(() => {
				if (requestIdRef.current === requestId) {
					setIsLoading(false);
				}
			});
	}, [applyClient, clientId, isEditMode]);

	const refreshSecrets = useCallback(() => {
		if (!isEditMode || clientId === undefined || admin === null) {
			return;
		}

		setIsSecretLoading(true);
		setMessage(null);
		const requestId = secretRequestIdRef.current + 1;
		secretRequestIdRef.current = requestId;

		void listAdminSsoClientSecrets(clientId)
			.then((result) => {
				if (secretRequestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					if (checkAdminUnauthorizedActionResult(result)) {
						clearAdminSession();
						setAdmin(null);
						return;
					}

					setMessage(result.displayMessage);
					return;
				}

				setSecrets(result.data.secrets);
				setSecretLabelDrafts(
					result.data.secrets.reduce<Record<string, string>>(
						(drafts, secret) => {
							drafts[secret.id] = secret.label ?? '';
							return drafts;
						},
						{}
					)
				);
			})
			.catch((error: unknown) => {
				if (secretRequestIdRef.current !== requestId) {
					return;
				}
				setMessage(
					error instanceof Error
						? error.message
						: '读取SSO客户端Secret失败'
				);
			})
			.finally(() => {
				if (secretRequestIdRef.current === requestId) {
					setIsSecretLoading(false);
				}
			});
	}, [admin, clientId, isEditMode]);

	const checkAdmin = useCallback(() => {
		requestIdRef.current += 1;
		const requestId = requestIdRef.current;
		setIsAuthLoading(true);
		setMessage(null);

		void fetchAdminMe()
			.then((result) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					if (checkAdminUnauthorizedActionResult(result)) {
						clearAdminSession();
						setAdmin(null);
						return;
					}

					setMessage(result.displayMessage);
					return;
				}

				setAdmin(result.data);
			})
			.catch((error: unknown) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				setMessage(
					error instanceof Error
						? error.message
						: '读取管理员状态失败'
				);
			})
			.finally(() => {
				if (requestIdRef.current === requestId) {
					setIsAuthLoading(false);
				}
			});
	}, []);

	const handleSave = useCallback(() => {
		if (admin === null || !canSave || formMutationInFlightRef.current) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin SSO Client Button',
			isEditMode ? 'Save' : 'Create',
			id.trim()
		);
		formMutationInFlightRef.current = true;
		setIsSaving(true);
		setMessage(null);
		setGeneratedSecret(null);
		setConfirmAction(null);

		const body = currentBody;
		const request = isEditMode
			? updateAdminSsoClient(
					body.id,
					{
						...body,
						disabled: client?.disabled_at !== null,
					} satisfies IAdminSsoClientUpdateBody,
					admin.csrf_token
				)
			: createAdminSsoClient(body, admin.csrf_token);

		void request
			.then(async (result) => {
				if (result.status === 'error') {
					applyMutationResult(
						result,
						isEditMode
							? 'SSO客户端已保存'
							: 'SSO客户端已创建，请保存本次显示的客户端Secret'
					);
					return;
				}

				const changedSecretLabels = isEditMode
					? secrets
							.map((secret) => ({
								label: secretLabelDrafts[secret.id] ?? '',
								secret,
							}))
							.filter(
								({ label, secret }) =>
									secret.status !== 'revoked' &&
									label.trim() !== (secret.label ?? '')
							)
					: [];

				applyMutationResult(
					result,
					changedSecretLabels.length === 0
						? isEditMode
							? 'SSO客户端已保存'
							: 'SSO客户端已创建，请保存本次显示的客户端Secret'
						: 'SSO客户端已保存，正在保存Secret备注'
				);

				if (changedSecretLabels.length === 0) {
					return;
				}

				for (const { label, secret } of changedSecretLabels) {
					const secretResult = await updateAdminSsoClientSecret(
						body.id,
						secret.id,
						{ label: label.trim() === '' ? null : label.trim() },
						admin.csrf_token
					);

					if (secretResult.status === 'error') {
						handleActionError(secretResult);
						return;
					}

					applyClient(secretResult.data.client);
					setSecrets((current) =>
						current.map((currentSecret) =>
							currentSecret.id === secretResult.data.secret.id
								? secretResult.data.secret
								: currentSecret
						)
					);
					setSecretLabelDrafts((current) => ({
						...current,
						[secretResult.data.secret.id]:
							secretResult.data.secret.label ?? '',
					}));
				}

				setMessage('SSO客户端和Secret备注已保存');
			})
			.catch((error: unknown) => {
				setMessage(
					error instanceof Error
						? error.message
						: '保存SSO客户端或Secret备注失败'
				);
			})
			.finally(() => {
				formMutationInFlightRef.current = false;
				setIsSaving(false);
			});
	}, [
		admin,
		applyClient,
		applyMutationResult,
		canSave,
		client,
		currentBody,
		handleActionError,
		id,
		isEditMode,
		secretLabelDrafts,
		secrets,
	]);

	const handleContinueEdit = useCallback(() => {
		if (client === null) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin SSO Client Button',
			'Continue Edit',
			client.id
		);

		const [, search = ''] = listHref.split('?');
		const detailHref = `/admin/sso/${encodeURIComponent(client.id)}`;

		router.replace(
			search.length === 0 ? detailHref : `${detailHref}?${search}`
		);
	}, [client, listHref, router]);

	const handleGenerateSecret = useCallback(() => {
		if (
			admin === null ||
			!isEditMode ||
			client?.disabled_at !== null ||
			!tryStartSecretMutation(null)
		) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin SSO Client Button',
			'Generate Secret',
			client.id
		);

		setIsSaving(true);
		setMessage(null);
		setGeneratedSecret(null);
		setConfirmAction(null);

		void createAdminSsoClientSecret(
			client.id,
			secretLabel.trim() === '' ? {} : { label: secretLabel.trim() },
			admin.csrf_token
		)
			.then((result) => {
				applySecretMutationResult(result, '新SSO客户端Secret已生成');
				if (result.status === 'ok') {
					setSecretLabel('');
				}
			})
			.catch((error: unknown) => {
				setMessage(
					error instanceof Error
						? error.message
						: '生成SSO客户端Secret失败'
				);
			})
			.finally(() => {
				finishSecretMutation();
				setIsSaving(false);
			});
	}, [
		admin,
		applySecretMutationResult,
		client,
		finishSecretMutation,
		isEditMode,
		secretLabel,
		tryStartSecretMutation,
	]);

	const handleCopySecret = useCallback(async (secret: string) => {
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Client Button',
			'Copy Secret'
		);

		try {
			// eslint-disable-next-line compat/compat -- Prefer the modern Clipboard API and keep execCommand as a fallback.
			await navigator.clipboard.writeText(secret);
			return;
		} catch {
			// Fall back to the legacy textarea copy path below.
		}

		const textarea = document.createElement('textarea');
		textarea.value = secret;
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.append(textarea);
		textarea.select();
		try {
			// eslint-disable-next-line @typescript-eslint/no-deprecated
			document.execCommand('copy');
		} catch {
			// Silently ignore - the hash is fully visible and can be selected manually.
		}
		textarea.remove();
	}, []);

	const handleToggleSecretDisabled = useCallback(
		(secret: IAdminSsoClientSecretRecord, disabled: boolean) => {
			if (
				admin === null ||
				client === null ||
				isClientDisabled ||
				!tryStartSecretMutation(secret.id)
			) {
				return;
			}

			trackEvent(
				trackEvent.category.click,
				'Admin SSO Client Button',
				disabled ? 'Disable Secret' : 'Enable Secret',
				`${client.id}:${secret.id}`
			);

			setMessage(null);
			setGeneratedSecret(null);

			void updateAdminSsoClientSecret(
				client.id,
				secret.id,
				{ disabled },
				admin.csrf_token
			)
				.then((result) => {
					applySecretMutationResult(
						result,
						disabled
							? 'SSO客户端Secret已禁用'
							: 'SSO客户端Secret已启用'
					);
				})
				.catch((error: unknown) => {
					setMessage(
						error instanceof Error
							? error.message
							: '更新SSO客户端Secret状态失败'
					);
				})
				.finally(() => {
					finishSecretMutation();
				});
		},
		[
			admin,
			applySecretMutationResult,
			client,
			finishSecretMutation,
			isClientDisabled,
			tryStartSecretMutation,
		]
	);

	const handleRevokeSecret = useCallback(
		(secret: IAdminSsoClientSecretRecord) => {
			if (
				admin === null ||
				client === null ||
				isClientDisabled ||
				!tryStartSecretMutation(secret.id)
			) {
				return;
			}

			trackEvent(
				trackEvent.category.click,
				'Admin SSO Client Button',
				'Revoke Secret',
				`${client.id}:${secret.id}`
			);

			setConfirmAction(null);
			setMessage(null);
			setGeneratedSecret(null);

			void revokeAdminSsoClientSecret(
				client.id,
				secret.id,
				admin.csrf_token
			)
				.then((result) => {
					applySecretMutationResult(result, 'SSO客户端Secret已撤销');
				})
				.catch((error: unknown) => {
					setMessage(
						error instanceof Error
							? error.message
							: '撤销SSO客户端Secret失败'
					);
				})
				.finally(() => {
					finishSecretMutation();
				});
		},
		[
			admin,
			applySecretMutationResult,
			client,
			finishSecretMutation,
			isClientDisabled,
			tryStartSecretMutation,
		]
	);

	const handleToggleClientDisabled = useCallback(() => {
		if (
			admin === null ||
			client === null ||
			formMutationInFlightRef.current
		) {
			return;
		}

		const shouldDisableClient = client.disabled_at === null;

		trackEvent(
			trackEvent.category.click,
			'Admin SSO Client Button',
			shouldDisableClient ? 'Disable' : 'Enable',
			client.id
		);

		setConfirmAction(null);
		formMutationInFlightRef.current = true;
		setIsSaving(true);
		setMessage(null);
		setGeneratedSecret(null);

		void toggleAdminSsoClientDisabled(
			client.id,
			createUpdateBodyFromClient(client, shouldDisableClient),
			shouldDisableClient,
			admin.csrf_token
		)
			.then((result) => {
				applyMutationResult(
					result,
					shouldDisableClient ? 'SSO客户端已禁用' : 'SSO客户端已启用'
				);
			})
			.catch((error: unknown) => {
				setMessage(
					error instanceof Error
						? error.message
						: '更新SSO客户端状态失败'
				);
			})
			.finally(() => {
				formMutationInFlightRef.current = false;
				setIsSaving(false);
			});
	}, [admin, applyMutationResult, client]);

	const handleDeleteClient = useCallback(() => {
		if (
			admin === null ||
			client === null ||
			formMutationInFlightRef.current
		) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin SSO Client Button',
			'Delete',
			client.id
		);

		setConfirmAction(null);
		formMutationInFlightRef.current = true;
		setIsSaving(true);
		setMessage(null);

		void deleteAdminSsoClient(client.id, admin.csrf_token)
			.then((result) => {
				if (result.status === 'error') {
					handleActionError(result);
					return;
				}

				router.replace(listHref);
			})
			.catch((error: unknown) => {
				setMessage(
					error instanceof Error ? error.message : '删除SSO客户端失败'
				);
			})
			.finally(() => {
				formMutationInFlightRef.current = false;
				setIsSaving(false);
			});
	}, [admin, client, handleActionError, listHref, router]);

	useEffect(
		() => () => {
			requestIdRef.current += 1;
			secretRequestIdRef.current += 1;
		},
		[]
	);

	useEffect(() => {
		if (initialData.admin !== null) {
			store.shared.adminCsrfToken.set(initialData.admin.csrf_token);
			setIsAuthLoading(false);
			return;
		}

		checkAdmin();
	}, [checkAdmin, initialData.admin]);

	useEffect(() => {
		if (admin !== null) {
			if (isServerInitialClientRef.current) {
				isServerInitialClientRef.current = false;
				return;
			}

			refreshClient();
		}
	}, [admin, refreshClient]);

	useEffect(() => {
		if (admin !== null && isEditMode && clientId !== undefined) {
			refreshSecrets();
		}
	}, [admin, clientId, isEditMode, refreshSecrets]);

	const secretCards = useMemo(
		() =>
			secrets.map((secret) => (
				<div
					key={secret.id}
					className={cn(
						'grid min-w-0 gap-3 rounded-small border border-default-200/80 bg-default/30 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center',
						secret.status === 'revoked' && 'opacity-75'
					)}
				>
					<div className="grid min-w-0 gap-2">
						<div className="flex min-w-0 flex-wrap items-center gap-2">
							<AdminSecretStatusBadge secret={secret} />
							<code className="rounded-small bg-default/40 px-2 py-1.5 text-tiny text-foreground-600">
								{secret.secret_hash_prefix}
							</code>
						</div>
						<div className="min-w-0 max-w-xl">
							<Input
								aria-label={`${createSecretDisplayName(secret)} ${secret.secret_hash_prefix}备注`}
								classNames={{ inputWrapper: 'h-10 min-h-10' }}
								isDisabled={
									!canMutateSecrets ||
									secret.status === 'revoked'
								}
								placeholder={createSecretDisplayName(secret)}
								size="sm"
								value={secretLabelDrafts[secret.id] ?? ''}
								onValueChange={(value) => {
									setSecretLabelDrafts((current) => ({
										...current,
										[secret.id]: value,
									}));
								}}
							/>
						</div>
						<div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-small text-foreground-600">
							<span className="whitespace-nowrap">
								<span className="mr-1 text-tiny font-medium text-foreground-500">
									最近使用
								</span>
								{secret.last_used_at === null ? (
									<span className="text-foreground-500">
										未使用
									</span>
								) : (
									<TimeAgo timestamp={secret.last_used_at} />
								)}
							</span>
							<span className="whitespace-nowrap">
								<span className="mr-1 text-tiny font-medium text-foreground-500">
									创建
								</span>
								<TimeAgo timestamp={secret.created_at} />
							</span>
						</div>
					</div>
					<div className="flex min-w-0 flex-wrap items-center justify-end gap-2 lg:pl-2">
						<Switch
							aria-label={`${createSecretDisplayName(secret)} ${secret.secret_hash_prefix}启用状态`}
							classNames={{ base: 'shrink-0' }}
							isDisabled={
								!canMutateSecrets || secret.status === 'revoked'
							}
							isSelected={secret.status === 'active'}
							size="sm"
							onValueChange={(isSelected) => {
								handleToggleSecretDisabled(secret, !isSelected);
							}}
						/>
						<AdminConfirmButton
							color="danger"
							confirmAction={`revoke-secret:${secret.id}`}
							confirmLabel="确认撤销"
							icon={faTrash}
							isDisabled={
								!canMutateSecrets || secret.status === 'revoked'
							}
							isLoading={mutatingSecretId === secret.id}
							openAction={confirmAction}
							size="sm"
							onOpenChange={setConfirmAction}
							onConfirm={() => {
								handleRevokeSecret(secret);
							}}
						>
							撤销
						</AdminConfirmButton>
					</div>
				</div>
			)),
		[
			canMutateSecrets,
			confirmAction,
			handleRevokeSecret,
			handleToggleSecretDisabled,
			mutatingSecretId,
			secretLabelDrafts,
			secrets,
		]
	);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faServer}
				label="读取会话状态"
				subtitle="正在校验管理员会话"
				title={title}
			/>
		);
	}

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<AdminHeaderActionLink href="/admin">
							返回管理员页
						</AdminHeaderActionLink>
					}
					icon={faServer}
					subtitle={message ?? '请先返回管理员页登录'}
					title={title}
				/>
			</AdminShell>
		);
	}

	if (isEditMode && isLoading) {
		return (
			<AdminShell>
				<AdminHeader
					icon={faServer}
					subtitle="正在读取SSO客户端配置"
					title={title}
				/>
				<AdminEmptyState icon={faRotate}>读取中</AdminEmptyState>
			</AdminShell>
		);
	}

	if (isEditMode && client === null && loadError !== null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<AdminHeaderActionLink
							href={listHref}
							icon={faArrowLeft}
						>
							返回列表
						</AdminHeaderActionLink>
					}
					icon={faServer}
					subtitle={loadError}
					title={title}
				/>
				<AdminEmptyState icon={faServer}>
					读取SSO客户端失败
				</AdminEmptyState>
				<Button
					color="primary"
					isLoading={isLoading}
					startContent={
						isLoading ? null : (
							<FontAwesomeIcon
								icon={faRotate}
								className="w-3.5"
							/>
						)
					}
					variant="flat"
					onPress={refreshClient}
				>
					重试
				</Button>
			</AdminShell>
		);
	}

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<AdminHeaderActionLink
							href={listHref}
							icon={faArrowLeft}
						>
							返回列表
						</AdminHeaderActionLink>
						{isEditMode && client !== null && (
							<>
								<AdminConfirmButton
									color={
										isClientDisabled ? 'primary' : 'warning'
									}
									confirmAction="toggle-client"
									confirmLabel={
										isClientDisabled
											? '确认启用'
											: '确认禁用'
									}
									icon={
										isClientDisabled ? faCircleCheck : faBan
									}
									isDisabled={isSaving}
									isLoading={isSaving}
									openAction={confirmAction}
									onOpenChange={setConfirmAction}
									onConfirm={handleToggleClientDisabled}
								>
									{isClientDisabled
										? '启用客户端'
										: '禁用客户端'}
								</AdminConfirmButton>
								<AdminConfirmButton
									color="danger"
									confirmAction="delete-client"
									confirmLabel="确认删除"
									icon={faTrash}
									isDisabled={isSaving}
									isLoading={isSaving}
									openAction={confirmAction}
									onOpenChange={setConfirmAction}
									onConfirm={handleDeleteClient}
								>
									删除客户端
								</AdminConfirmButton>
							</>
						)}
						<Button
							color="primary"
							isDisabled={!canSave}
							isLoading={isSaving}
							startContent={
								isSaving ? null : (
									<FontAwesomeIcon
										icon={faSave}
										className="w-3.5"
									/>
								)
							}
							variant="flat"
							onPress={handleSave}
						>
							保存
						</Button>
					</>
				}
				icon={faServer}
				title={title}
			/>

			{message !== null && <AdminMessage message={message} />}
			{generatedSecret !== null && (
				<AdminCodeBlock
					ariaLabel="本次生成的客户端Secret"
					copyLabel="复制本次生成的客户端Secret"
					isCopyDisabled={isSaving}
					value={generatedSecret}
					onCopy={() => {
						void handleCopySecret(generatedSecret);
					}}
				/>
			)}
			{isCreatedClient && (
				<Button
					color="primary"
					variant="flat"
					onPress={handleContinueEdit}
				>
					继续编辑
				</Button>
			)}

			<div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]">
				<AdminPanel className="space-y-4">
					<AdminPanelTitle icon={faServer}>基础配置</AdminPanelTitle>
					{isEditMode && client !== null && (
						<div
							className={cn(
								'rounded-small border px-3 py-2 text-small leading-5',
								isClientDisabled
									? 'border-warning/30 bg-warning/15 text-warning-700 dark:text-warning-600'
									: 'border-success/30 bg-success/15 text-success-700 dark:text-success'
							)}
						>
							<div className="font-medium">
								{isClientDisabled ? '已禁用' : '已启用'}
							</div>
							<div className="text-tiny opacity-80">
								{isClientDisabled
									? `禁用时间：${new Date(
											client.disabled_at ?? 0
										).toLocaleString('zh-CN')}`
									: '公开SSO接口可使用该客户端'}
							</div>
						</div>
					)}
					<Input
						isDisabled={isEditMode || isCreatedClient || isSaving}
						label="客户端ID"
						startContent={<AdminInputIcon icon={faServer} />}
						value={id}
						onValueChange={setId}
					/>
					<Input
						isDisabled={isCreatedClient || isSaving}
						label="客户端名称"
						startContent={<AdminInputIcon icon={faServer} />}
						value={name}
						onValueChange={setName}
					/>
					<Input
						isDisabled={isCreatedClient || isSaving}
						label="Status Callback URL"
						value={statusCallbackUrl}
						onValueChange={setStatusCallbackUrl}
					/>
					<Input
						isDisabled={isCreatedClient || isSaving}
						label="Cancel Redirect URI"
						value={cancelRedirectUri}
						onValueChange={setCancelRedirectUri}
					/>
					<Textarea
						isDisabled={isCreatedClient || isSaving}
						label="Loopback Redirect Paths"
						value={loopbackRedirectPaths}
						classNames={adminTextareaClassNames}
						onValueChange={setLoopbackRedirectPaths}
					/>
					<Textarea
						isDisabled={isCreatedClient || isSaving}
						label="HTTPS Redirect URIs"
						value={httpsRedirectUris}
						classNames={adminTextareaClassNames}
						onValueChange={setHttpsRedirectUris}
					/>
					<Textarea
						isDisabled={isCreatedClient || isSaving}
						label="Custom Scheme Redirect URIs"
						value={customSchemeRedirectUris}
						classNames={adminTextareaClassNames}
						onValueChange={setCustomSchemeRedirectUris}
					/>
				</AdminPanel>

				<AdminPanel className="min-w-0">
					{isEditMode ? (
						<>
							<AdminPanelToolbar
								actionClassName="flex-row flex-nowrap items-center"
								icon={faKey}
								actions={
									<>
										<Input
											aria-label="新SSO客户端Secret备注"
											className="min-w-0 flex-1"
											classNames={{
												inputWrapper: 'h-10 min-h-10',
											}}
											isDisabled={!canMutateSecrets}
											placeholder="备注"
											value={secretLabel}
											onValueChange={setSecretLabel}
										/>
										<Button
											className="h-10 min-h-10 shrink-0"
											color="primary"
											isDisabled={!canMutateSecrets}
											isLoading={isSaving}
											startContent={
												isSaving ? null : (
													<FontAwesomeIcon
														icon={faPlus}
														className="w-3.5"
													/>
												)
											}
											variant="flat"
											onPress={handleGenerateSecret}
										>
											生成secret
										</Button>
										<Button
											className="h-10 min-h-10 shrink-0"
											color="primary"
											isLoading={isSecretLoading}
											startContent={
												isSecretLoading ? null : (
													<FontAwesomeIcon
														icon={faRotate}
														className="w-3.5"
													/>
												)
											}
											variant="flat"
											onPress={refreshSecrets}
										>
											刷新
										</Button>
									</>
								}
							>
								客户端Secret
							</AdminPanelToolbar>
							{secrets.length === 0 ? (
								<AdminEmptyState icon={faKey}>
									{isSecretLoading
										? '读取中'
										: '暂无客户端Secret'}
								</AdminEmptyState>
							) : (
								<div className="grid min-w-0 gap-3">
									{secretCards}
								</div>
							)}
						</>
					) : (
						<>
							<AdminPanelTitle icon={faKey}>
								客户端Secret
							</AdminPanelTitle>
							<AdminMessage message="创建后会显示一次客户端Secret，后台仅展示Secret元数据和Hash前缀" />
						</>
					)}
				</AdminPanel>
			</div>

			{isEditMode && client !== null && (
				<AdminSsoClientGrantPanel
					admin={admin}
					clientId={client.id}
					initialData={initialData.clientUsers}
					isSaving={isSaving}
					onMessage={setMessage}
					onUnauthorized={handleUnauthorized}
				/>
			)}
		</AdminShell>
	);
});
