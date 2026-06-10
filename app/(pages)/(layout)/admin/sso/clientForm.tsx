'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faClipboard,
	faKey,
	faPlus,
	faRotate,
	faSave,
	faServer,
	faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { Textarea } from '@heroui/input';

import {
	Button,
	Input,
	Link,
	Popover,
	PopoverContent,
	PopoverTrigger,
	cn,
} from '@/design/ui/components';

import {
	AdminEmptyState,
	AdminHeader,
	AdminInputIcon,
	AdminMessage,
	AdminPanel,
	AdminPanelTitle,
	AdminShell,
} from '../components';

import {
	AccountApiError,
	type IAdminMeData,
	createAdminSsoClient,
	deleteAdminSsoClient,
	fetchAdminMe,
	fetchAdminSsoClient,
	updateAdminSsoClient,
} from '@/lib/account/client/api';
import {
	type IAdminSsoClientCreateBody,
	type IAdminSsoClientProfile,
	type IAdminSsoClientUpdateBody,
} from '@/lib/account/shared/types';
import {
	checkAdminSessionUnauthorized,
	clearAdminSession,
} from '@/lib/account/client/adminSession';

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

interface IProps {
	clientId?: string;
	mode: 'create' | 'edit';
}

export default memo<IProps>(function AdminSsoClientForm({ clientId, mode }) {
	const router = useRouter();

	const requestIdRef = useRef(0);

	const [admin, setAdmin] = useState<IAdminMeData | null>(null);
	const [client, setClient] = useState<IAdminSsoClientProfile | null>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(true);
	const [isLoading, setIsLoading] = useState(mode === 'edit');
	const [isSaving, setIsSaving] = useState(false);
	const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [oneTimeSecret, setOneTimeSecret] = useState<string | null>(null);

	const [id, setId] = useState(clientId ?? '');
	const [name, setName] = useState('');
	const [loopbackRedirectPaths, setLoopbackRedirectPaths] = useState('');
	const [customSchemeRedirectUris, setCustomSchemeRedirectUris] =
		useState('');
	const [statusCallbackUrl, setStatusCallbackUrl] = useState('');
	const [cancelRedirectUri, setCancelRedirectUri] = useState('');
	const [secretHashes, setSecretHashes] = useState<string[]>([]);

	const isEditMode = mode === 'edit';
	const isCreatedClient = !isEditMode && client !== null;
	const title = isEditMode ? '编辑SSO客户端' : '新建SSO客户端';
	const canSave =
		admin !== null &&
		!isCreatedClient &&
		!isSaving &&
		id.trim().length > 0 &&
		name.trim().length > 0;

	const createBody = useCallback(
		(): IAdminSsoClientCreateBody => ({
			cancel_redirect_uri: normalizeOptionalUri(cancelRedirectUri),
			custom_scheme_redirect_uris: parseLines(customSchemeRedirectUris),
			id: id.trim(),
			loopback_redirect_paths: parseLines(loopbackRedirectPaths),
			name: name.trim(),
			status_callback_url: normalizeOptionalUri(statusCallbackUrl),
		}),
		[
			cancelRedirectUri,
			customSchemeRedirectUris,
			id,
			loopbackRedirectPaths,
			name,
			statusCallbackUrl,
		]
	);

	const applyClient = useCallback((value: IAdminSsoClientProfile) => {
		setClient(value);
		setId(value.id);
		setName(value.name);
		setLoopbackRedirectPaths(joinLines(value.loopback_redirect_paths));
		setCustomSchemeRedirectUris(
			joinLines(value.custom_scheme_redirect_uris)
		);
		setStatusCallbackUrl(value.status_callback_url ?? '');
		setCancelRedirectUri(value.cancel_redirect_uri ?? '');
		setSecretHashes(value.secret_hashes);
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
			.then((data) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				setLoadError(null);
				applyClient(data.client);
			})
			.catch((error: unknown) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
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

	const checkAdmin = useCallback(() => {
		requestIdRef.current += 1;
		const requestId = requestIdRef.current;
		setIsAuthLoading(true);
		setMessage(null);

		void fetchAdminMe()
			.then((data) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				setAdmin(data);
			})
			.catch((error: unknown) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
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
		if (admin === null || !canSave) {
			return;
		}

		setIsSaving(true);
		setMessage(null);
		setOneTimeSecret(null);
		setIsDeletePopoverOpen(false);

		const body = createBody();
		const request = isEditMode
			? updateAdminSsoClient(
					body.id,
					{
						...body,
						generate_secret: false,
						secret_hashes: secretHashes,
					} satisfies IAdminSsoClientUpdateBody,
					admin.csrf_token
				)
			: createAdminSsoClient(body, admin.csrf_token);

		void request
			.then((data) => {
				applyClient(data.client);
				setOneTimeSecret(data.client_secret ?? null);
				setMessage(
					isEditMode
						? 'SSO客户端已保存'
						: 'SSO客户端已创建，请先保存客户端secret'
				);
			})
			.catch((error: unknown) => {
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
					return;
				}
				setMessage(
					error instanceof Error ? error.message : '保存SSO客户端失败'
				);
			})
			.finally(() => {
				setIsSaving(false);
			});
	}, [admin, applyClient, canSave, createBody, isEditMode, secretHashes]);

	const handleContinueEdit = useCallback(() => {
		if (client === null) {
			return;
		}

		router.replace(`/admin/sso/${encodeURIComponent(client.id)}`);
	}, [client, router]);

	const handleGenerateSecret = useCallback(() => {
		if (admin === null || !isEditMode || client === null) {
			return;
		}

		setIsSaving(true);
		setMessage(null);
		setOneTimeSecret(null);
		setIsDeletePopoverOpen(false);

		const body = createBody();

		void updateAdminSsoClient(
			client.id,
			{
				...body,
				generate_secret: true,
				id: client.id,
				secret_hashes: secretHashes,
			},
			admin.csrf_token
		)
			.then((data) => {
				applyClient(data.client);
				setOneTimeSecret(data.client_secret ?? null);
				setMessage('新客户端secret已生成');
			})
			.catch((error: unknown) => {
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
					return;
				}
				setMessage(
					error instanceof Error
						? error.message
						: '生成SSO客户端secret失败'
				);
			})
			.finally(() => {
				setIsSaving(false);
			});
	}, [admin, applyClient, client, createBody, isEditMode, secretHashes]);

	const handleCopySecret = useCallback((secretHash: string) => {
		const textarea = document.createElement('textarea');
		textarea.value = secretHash;
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

	const handleDeleteSecret = useCallback((secretHash: string) => {
		setSecretHashes((current) =>
			current.length <= 1
				? current
				: current.filter((item) => item !== secretHash)
		);
		setMessage('SSO客户端secret已从表单移除，保存后生效');
	}, []);

	const handleDeleteClient = useCallback(() => {
		if (admin === null || client === null) {
			return;
		}

		setIsDeletePopoverOpen(false);
		setIsSaving(true);
		setMessage(null);

		void deleteAdminSsoClient(client.id, admin.csrf_token)
			.then(() => {
				router.replace('/admin/sso');
			})
			.catch((error: unknown) => {
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
					return;
				}
				setMessage(
					error instanceof AccountApiError
						? error.message
						: '删除SSO客户端失败'
				);
			})
			.finally(() => {
				setIsSaving(false);
			});
	}, [admin, client, router]);

	useEffect(
		() => () => {
			requestIdRef.current += 1;
		},
		[]
	);

	useEffect(() => {
		checkAdmin();
	}, [checkAdmin]);

	useEffect(() => {
		if (admin !== null) {
			refreshClient();
		}
	}, [admin, refreshClient]);

	const secretRows = useMemo(
		() =>
			secretHashes.map((secretHash) => (
				<div
					key={secretHash}
					className="flex min-w-0 items-center gap-2 rounded-small border border-default-200/80 px-3 py-2"
				>
					<span className="min-w-0 flex-1 break-all font-mono text-tiny text-foreground-600">
						{secretHash}
					</span>
					<Button
						isIconOnly
						aria-label="复制SSO客户端secret"
						isDisabled={isSaving}
						size="sm"
						variant="flat"
						onPress={() => {
							handleCopySecret(secretHash);
						}}
					>
						<FontAwesomeIcon icon={faClipboard} className="w-3" />
					</Button>
					<Button
						isIconOnly
						aria-label="删除SSO客户端secret"
						color="danger"
						isDisabled={secretHashes.length <= 1 || isSaving}
						size="sm"
						variant="flat"
						onPress={() => {
							handleDeleteSecret(secretHash);
						}}
					>
						<FontAwesomeIcon icon={faTrash} className="w-3" />
					</Button>
				</div>
			)),
		[handleCopySecret, handleDeleteSecret, isSaving, secretHashes]
	);

	if (isAuthLoading) {
		return (
			<AdminShell>
				<AdminHeader
					icon={faServer}
					subtitle="正在校验管理员会话"
					title={title}
				/>
				<AdminPanel className="flex items-center gap-3 text-small text-foreground-500">
					<Button isLoading variant="flat">
						加载中
					</Button>
					<span>读取会话状态</span>
				</AdminPanel>
			</AdminShell>
		);
	}

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<Button
							as={Link}
							animationUnderline={false}
							href="/admin"
							variant="flat"
						>
							返回管理员页
						</Button>
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
					subtitle="正在读取客户端配置"
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
						<Button
							as={Link}
							animationUnderline={false}
							href="/admin/sso"
							startContent={
								<FontAwesomeIcon
									icon={faArrowLeft}
									className="w-3.5"
								/>
							}
							variant="flat"
						>
							返回列表
						</Button>
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
						<Button
							as={Link}
							animationUnderline={false}
							href="/admin/sso"
							startContent={
								<FontAwesomeIcon
									icon={faArrowLeft}
									className="w-3.5"
								/>
							}
							variant="flat"
						>
							返回列表
						</Button>
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
			{oneTimeSecret !== null && (
				<AdminMessage message={`新客户端secret：${oneTimeSecret}`} />
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

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
				<AdminPanel className="space-y-4">
					<AdminPanelTitle icon={faServer}>基础配置</AdminPanelTitle>
					<Input
						isDisabled={isEditMode || isCreatedClient || isSaving}
						label="Client ID"
						startContent={<AdminInputIcon icon={faServer} />}
						value={id}
						onValueChange={setId}
					/>
					<Input
						isDisabled={isCreatedClient || isSaving}
						label="名称"
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
						onValueChange={setLoopbackRedirectPaths}
						classNames={{
							inputWrapper: cn(
								'bg-default/40 transition-background data-[hover=true]:bg-default-400/40 group-data-[focus=true]:bg-default/70 motion-reduce:transition-none'
							),
						}}
					/>
					<Textarea
						isDisabled={isCreatedClient || isSaving}
						label="Custom Scheme Redirect URIs"
						value={customSchemeRedirectUris}
						onValueChange={setCustomSchemeRedirectUris}
						classNames={{
							inputWrapper: cn(
								'bg-default/40 transition-background data-[hover=true]:bg-default-400/40 group-data-[focus=true]:bg-default/70 motion-reduce:transition-none'
							),
						}}
					/>
				</AdminPanel>

				<AdminPanel className="space-y-4">
					<AdminPanelTitle icon={faKey}>Secrets</AdminPanelTitle>
					{isEditMode ? (
						<>
							<div className="space-y-2">{secretRows}</div>
							<Button
								color="primary"
								isDisabled={isSaving}
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
								新增客户端secret
							</Button>
							<Popover
								shouldBlockScroll
								showArrow
								isOpen={isDeletePopoverOpen}
								onOpenChange={setIsDeletePopoverOpen}
							>
								<PopoverTrigger>
									<Button
										color="danger"
										isDisabled={isSaving}
										startContent={
											<FontAwesomeIcon
												icon={faTrash}
												className="w-3.5"
											/>
										}
										variant="flat"
									>
										删除客户端
									</Button>
								</PopoverTrigger>
								<PopoverContent className="space-y-1 p-1">
									<Button
										fullWidth
										color="danger"
										isDisabled={isSaving}
										size="sm"
										variant="ghost"
										onPress={handleDeleteClient}
									>
										确认
									</Button>
									<Button
										fullWidth
										color="primary"
										size="sm"
										variant="ghost"
										onPress={() => {
											setIsDeletePopoverOpen(false);
										}}
									>
										取消
									</Button>
								</PopoverContent>
							</Popover>
						</>
					) : (
						<AdminMessage message="创建后会显示一次客户端secret" />
					)}
				</AdminPanel>
			</div>
		</AdminShell>
	);
});
