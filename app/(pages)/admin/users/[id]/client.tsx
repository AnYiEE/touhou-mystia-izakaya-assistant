'use client';

import {
	type SyntheticEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faBan,
	faClipboardList,
	faClock,
	faDatabase,
	faFileArchive,
	faKey,
	faRotate,
	faSearch,
	faServer,
	faShieldHalved,
	faTrash,
	faUser,
	faUserCheck,
	faUserClock,
	faUserSlash,
} from '@fortawesome/free-solid-svg-icons';

import { Button, Input } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';
import {
	ADMIN_LIST_DEBOUNCE_MS,
	AdminConfirmButton,
	AdminEmptyState,
	AdminEntityCell,
	AdminHeader,
	AdminHeaderActionLink,
	AdminInputIcon,
	AdminLoadingState,
	AdminMessage,
	AdminMetric,
	AdminMetricPanel,
	AdminMutedText,
	AdminPagination,
	AdminPanel,
	AdminPanelTitle,
	AdminPanelToolbar,
	AdminSearchInput,
	AdminShell,
	AdminSsoClientStatusBadge,
	AdminStatusBadge,
	AdminTable,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '../../components';
import {
	type TAdminUserDetailApiResult,
	clearAdminUserData,
	deleteAdminUserSessions,
	disableAdminUser,
	enableAdminUser,
	fetchAdminMe,
	listAdminUserSsoGrants,
	refreshAdminUserDetail,
	resetAdminUserPassword,
	restoreAdminUser,
	revokeAdminUserSsoGrant,
	revokeAdminUserSsoGrants,
} from '../../api';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import {
	PASSWORD_RULE_DESCRIPTION,
	checkPasswordPolicy,
} from '@/lib/account/shared/constants';
import {
	type IAdminMeData,
	type IAdminSsoUserClientGrant,
	type IAdminSsoUserGrantsData,
	type IAdminUserDetailData,
} from '@/lib/account/shared/types';
import { accountStore as store } from '@/stores/account';

type TConfirmAction =
	| 'clear-data'
	| 'delete-sessions'
	| 'disable'
	| 'revoke-all-sso'
	| `revoke-sso:${string}`
	| null;

const pageInputRegexp = /^\d*$/u;

export interface IAdminUserDetailInitialData {
	admin: IAdminMeData | null;
	detail: IAdminUserDetailData | null;
	isAuthLoading: boolean;
	isDetailServerLoaded: boolean;
	listHref: string;
	message: string | null;
	renderedAt: number;
	ssoGrants: IAdminSsoUserGrantsData | null;
	userId: string;
}

interface IAdminUserDetailClientProps {
	initialData: IAdminUserDetailInitialData;
}

export default function AdminUserDetailClient({
	initialData,
}: IAdminUserDetailClientProps) {
	const id = initialData.userId;
	const adminListHref = initialData.listHref;
	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [detail, setDetail] = useState<IAdminUserDetailData | null>(
		initialData.detail
	);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [password, setPassword] = useState('');
	const [confirmAction, setConfirmAction] = useState<TConfirmAction>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [isLoading, setIsLoading] = useState(false);
	const [ssoGrantPage, setSsoGrantPage] = useState(
		initialData.ssoGrants?.page ?? 1
	);
	const [ssoGrantPageInput, setSsoGrantPageInput] = useState(
		String(initialData.ssoGrants?.page ?? 1)
	);
	const [ssoGrantPageSize, setSsoGrantPageSize] = useState<
		number | undefined
	>(initialData.ssoGrants?.page_size);
	const [ssoGrantQuery, setSsoGrantQuery] = useState('');
	const [ssoGrantTotalCount, setSsoGrantTotalCount] = useState<
		number | undefined
	>(initialData.ssoGrants?.total_count);
	const [ssoGrantTotalPages, setSsoGrantTotalPages] = useState(
		Math.max(1, initialData.ssoGrants?.total_pages ?? 1)
	);
	const [ssoGrants, setSsoGrants] = useState<IAdminSsoUserClientGrant[]>(
		initialData.ssoGrants?.grants ?? []
	);
	const [isSsoGrantLoading, setIsSsoGrantLoading] = useState(false);
	const [revokingSsoClientId, setRevokingSsoClientId] = useState<
		string | null
	>(null);
	const [isRevokingAllSsoGrants, setIsRevokingAllSsoGrants] = useState(false);

	const detailRequestIdRef = useRef(0);
	const ssoGrantRequestIdRef = useRef(0);
	const ssoGrantMutationRequestIdRef = useRef(0);
	const detailMutationInFlightRef = useRef(false);
	const ssoGrantMutationInFlightRef = useRef(false);
	const isServerInitialDetailRef = useRef(initialData.isDetailServerLoaded);
	const hasRequestedInitialSsoGrantsRef = useRef(
		initialData.ssoGrants !== null
	);
	const ssoGrantQueryTimeoutRef = useRef<ReturnType<
		typeof globalThis.setTimeout
	> | null>(null);

	const adminCsrfToken = admin?.csrf_token;

	const createDetailRequestId = useCallback(() => {
		detailRequestIdRef.current += 1;
		return detailRequestIdRef.current;
	}, []);

	const checkDetailRequestId = useCallback(
		(requestId: number) => detailRequestIdRef.current === requestId,
		[]
	);

	const createSsoGrantRequestId = useCallback(() => {
		ssoGrantRequestIdRef.current += 1;
		return ssoGrantRequestIdRef.current;
	}, []);

	const checkSsoGrantRequestId = useCallback(
		(requestId: number) => ssoGrantRequestIdRef.current === requestId,
		[]
	);

	const createSsoGrantMutationRequestId = useCallback(() => {
		ssoGrantMutationRequestIdRef.current += 1;
		return ssoGrantMutationRequestIdRef.current;
	}, []);

	const checkSsoGrantMutationRequestId = useCallback(
		(requestId: number) =>
			ssoGrantMutationRequestIdRef.current === requestId,
		[]
	);

	const cancelPendingSsoGrantQueryRefresh = useCallback(() => {
		if (ssoGrantQueryTimeoutRef.current === null) {
			return;
		}

		globalThis.clearTimeout(ssoGrantQueryTimeoutRef.current);
		ssoGrantQueryTimeoutRef.current = null;
	}, []);

	const handleActionError = useCallback(
		(error: Extract<TAdminUserDetailApiResult, { status: 'error' }>) => {
			if (
				error.httpStatus === 401 &&
				(error.message === 'unauthorized' ||
					error.message === 'admin-session-expired')
			) {
				clearAdminSession();
				setAdmin(null);
				setDetail(null);
			}

			setMessage(error.displayMessage);
		},
		[]
	);

	const refreshDetail = useCallback(() => {
		setIsLoading(true);
		setConfirmAction(null);
		setMessage(null);

		const requestId = createDetailRequestId();
		return refreshAdminUserDetail(id)
			.then((result) => {
				if (!checkDetailRequestId(requestId)) {
					return false;
				}
				if (result.status === 'ok') {
					setDetail(result.detail);
					setMessage(null);
					return true;
				}

				handleActionError(result);
				return false;
			})
			.catch((error: unknown) => {
				if (!checkDetailRequestId(requestId)) {
					return false;
				}
				setMessage(
					error instanceof Error ? error.message : '读取用户详情失败'
				);
				return false;
			})
			.finally(() => {
				if (checkDetailRequestId(requestId)) {
					setIsLoading(false);
				}
			});
	}, [checkDetailRequestId, createDetailRequestId, handleActionError, id]);

	const runAction = useCallback(
		(
			action: () => Promise<TAdminUserDetailApiResult>,
			success: string,
			onSuccess?: () => void
		) => {
			if (detailMutationInFlightRef.current) {
				return;
			}

			detailMutationInFlightRef.current = true;
			setIsLoading(true);
			setConfirmAction(null);
			setMessage(null);

			const requestId = createDetailRequestId();
			void action()
				.then((result) => {
					if (!checkDetailRequestId(requestId)) {
						return;
					}
					if (result.status === 'error') {
						handleActionError(result);
						return;
					}

					onSuccess?.();
					setDetail(result.detail);
					setMessage(success);
				})
				.catch((error: unknown) => {
					if (!checkDetailRequestId(requestId)) {
						return;
					}
					setMessage(
						error instanceof Error ? error.message : '操作失败'
					);
				})
				.finally(() => {
					detailMutationInFlightRef.current = false;
					if (checkDetailRequestId(requestId)) {
						setIsLoading(false);
					}
				});
		},
		[checkDetailRequestId, createDetailRequestId, handleActionError]
	);

	const handleResetPassword = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Reset Password'
		);

		runAction(
			() => resetAdminUserPassword(id, { password }, adminCsrfToken),
			'密码已重置',
			() => {
				setPassword('');
			}
		);
	}, [adminCsrfToken, id, password, runAction]);

	const handleEnableUser = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Enable User'
		);

		runAction(() => enableAdminUser(id, adminCsrfToken), '用户已启用');
	}, [adminCsrfToken, id, runAction]);

	const handleRestoreUser = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Restore User'
		);

		runAction(
			() => restoreAdminUser(id, adminCsrfToken),
			'账号已恢复为禁用状态'
		);
	}, [adminCsrfToken, id, runAction]);

	const handleDisableUser = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Disable User'
		);

		runAction(() => disableAdminUser(id, adminCsrfToken), '用户已禁用');
	}, [adminCsrfToken, id, runAction]);

	const handleDeleteUserSessions = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Delete Sessions'
		);

		runAction(
			() => deleteAdminUserSessions(id, adminCsrfToken),
			'已踢出全部设备'
		);
	}, [adminCsrfToken, id, runAction]);

	const handleClearUserData = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Clear Data'
		);

		runAction(
			() => clearAdminUserData(id, adminCsrfToken),
			'账号数据已清空'
		);
	}, [adminCsrfToken, id, runAction]);

	const applySsoGrantData = useCallback((data: IAdminSsoUserGrantsData) => {
		setSsoGrants(data.grants);
		setSsoGrantPage(data.page);
		setSsoGrantPageSize(data.page_size);
		setSsoGrantTotalCount(data.total_count);
		setSsoGrantTotalPages(Math.max(1, data.total_pages));
	}, []);

	const requestSsoGrants = useCallback(
		(nextPage: number, nextQuery: string) => {
			if (admin === null) {
				return;
			}

			setIsSsoGrantLoading(true);
			setMessage(null);

			const requestId = createSsoGrantRequestId();
			void listAdminUserSsoGrants(id, {
				page: nextPage,
				query: nextQuery.trim(),
			})
				.then((result) => {
					if (!checkSsoGrantRequestId(requestId)) {
						return;
					}
					if (result.status === 'error') {
						if (
							result.httpStatus === 401 &&
							(result.message === 'unauthorized' ||
								result.message === 'admin-session-expired')
						) {
							clearAdminSession();
							setAdmin(null);
							setDetail(null);
							return;
						}

						setMessage(result.displayMessage);
						return;
					}

					applySsoGrantData(result.data);
				})
				.catch((error: unknown) => {
					if (!checkSsoGrantRequestId(requestId)) {
						return;
					}
					setMessage(
						error instanceof Error
							? error.message
							: '读取SSO授权失败'
					);
				})
				.finally(() => {
					if (checkSsoGrantRequestId(requestId)) {
						setIsSsoGrantLoading(false);
					}
				});
		},
		[
			admin,
			applySsoGrantData,
			checkSsoGrantRequestId,
			createSsoGrantRequestId,
			id,
		]
	);

	const refreshSsoGrants = useCallback(
		(nextPage = ssoGrantPage) => {
			requestSsoGrants(nextPage, ssoGrantQuery);
		},
		[requestSsoGrants, ssoGrantPage, ssoGrantQuery]
	);

	const handleSsoGrantQueryChange = useCallback(
		(value: string) => {
			setSsoGrantQuery(value);
			cancelPendingSsoGrantQueryRefresh();

			if (admin === null || detail?.user.id !== id) {
				return;
			}

			ssoGrantQueryTimeoutRef.current = globalThis.setTimeout(() => {
				ssoGrantQueryTimeoutRef.current = null;
				requestSsoGrants(1, value);
			}, ADMIN_LIST_DEBOUNCE_MS);
		},
		[admin, cancelPendingSsoGrantQueryRefresh, detail, id, requestSsoGrants]
	);

	const handleRevokeAllSsoGrants = useCallback(() => {
		if (
			adminCsrfToken === undefined ||
			ssoGrantMutationInFlightRef.current
		) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Revoke All Grants',
			id
		);

		setIsRevokingAllSsoGrants(true);
		ssoGrantMutationInFlightRef.current = true;
		setConfirmAction(null);
		setMessage(null);

		const requestId = createSsoGrantMutationRequestId();
		void revokeAdminUserSsoGrants(id, adminCsrfToken)
			.then((result) => {
				if (!checkSsoGrantMutationRequestId(requestId)) {
					return;
				}
				if (result.status === 'error') {
					if (
						result.httpStatus === 401 &&
						(result.message === 'unauthorized' ||
							result.message === 'admin-session-expired')
					) {
						clearAdminSession();
						setAdmin(null);
						setDetail(null);
						return;
					}

					setMessage(result.displayMessage);
					return;
				}

				setMessage(
					`SSO授权已全部撤销${
						result.data.revoked_count === undefined
							? ''
							: `：${result.data.revoked_count}个`
					}`
				);
				refreshSsoGrants(1);
			})
			.catch((error: unknown) => {
				if (!checkSsoGrantMutationRequestId(requestId)) {
					return;
				}
				setMessage(
					error instanceof Error
						? error.message
						: '撤销全部SSO授权失败'
				);
			})
			.finally(() => {
				ssoGrantMutationInFlightRef.current = false;
				if (checkSsoGrantMutationRequestId(requestId)) {
					setIsRevokingAllSsoGrants(false);
				}
			});
	}, [
		adminCsrfToken,
		checkSsoGrantMutationRequestId,
		createSsoGrantMutationRequestId,
		id,
		refreshSsoGrants,
	]);

	const handleRefreshDetail = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Refresh Detail'
		);
		void refreshDetail().then((shouldRefreshSsoGrants) => {
			if (shouldRefreshSsoGrants) {
				refreshSsoGrants(1);
			}
		});
	}, [refreshDetail, refreshSsoGrants]);

	const handlePreviousSsoGrantPage = useCallback(() => {
		refreshSsoGrants(Math.max(1, ssoGrantPage - 1));
	}, [refreshSsoGrants, ssoGrantPage]);

	const handleNextSsoGrantPage = useCallback(() => {
		refreshSsoGrants(ssoGrantPage + 1);
	}, [refreshSsoGrants, ssoGrantPage]);

	const handleSsoGrantPageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setSsoGrantPageInput(value);
		}
	}, []);

	const handleSsoGrantPageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();

			const targetPage = Number.parseInt(ssoGrantPageInput, 10);
			if (!Number.isSafeInteger(targetPage) || targetPage < 1) {
				setSsoGrantPageInput(String(ssoGrantPage));
				return;
			}

			refreshSsoGrants(Math.min(targetPage, ssoGrantTotalPages));
		},
		[refreshSsoGrants, ssoGrantPage, ssoGrantPageInput, ssoGrantTotalPages]
	);

	const handleRevokeSsoGrant = useCallback(
		(clientId: string) => {
			if (
				adminCsrfToken === undefined ||
				ssoGrantMutationInFlightRef.current
			) {
				return;
			}

			trackEvent(
				trackEvent.category.click,
				'Admin User Action Button',
				'Revoke Grant',
				`${id}:${clientId}`
			);

			setRevokingSsoClientId(clientId);
			ssoGrantMutationInFlightRef.current = true;
			setConfirmAction(null);
			setMessage(null);

			const requestId = createSsoGrantMutationRequestId();
			void revokeAdminUserSsoGrant(id, clientId, adminCsrfToken)
				.then((result) => {
					if (!checkSsoGrantMutationRequestId(requestId)) {
						return;
					}
					if (result.status === 'error') {
						if (
							result.httpStatus === 401 &&
							(result.message === 'unauthorized' ||
								result.message === 'admin-session-expired')
						) {
							clearAdminSession();
							setAdmin(null);
							setDetail(null);
							return;
						}

						setMessage(result.displayMessage);
						return;
					}

					setMessage('SSO授权已撤销');
					refreshSsoGrants(ssoGrantPage);
				})
				.catch((error: unknown) => {
					if (!checkSsoGrantMutationRequestId(requestId)) {
						return;
					}
					setMessage(
						error instanceof Error
							? error.message
							: '撤销SSO授权失败'
					);
				})
				.finally(() => {
					ssoGrantMutationInFlightRef.current = false;
					if (checkSsoGrantMutationRequestId(requestId)) {
						setRevokingSsoClientId(null);
					}
				});
		},
		[
			adminCsrfToken,
			checkSsoGrantMutationRequestId,
			createSsoGrantMutationRequestId,
			id,
			refreshSsoGrants,
			ssoGrantPage,
		]
	);

	useEffect(
		() => () => {
			cancelPendingSsoGrantQueryRefresh();
			detailRequestIdRef.current += 1;
			ssoGrantRequestIdRef.current += 1;
			ssoGrantMutationRequestIdRef.current += 1;
		},
		[cancelPendingSsoGrantQueryRefresh]
	);

	useEffect(() => {
		if (initialData.admin !== null) {
			store.shared.adminCsrfToken.set(initialData.admin.csrf_token);
			setIsAuthLoading(false);
			return;
		}

		let isMounted = true;
		void fetchAdminMe()
			.then((result) => {
				if (!isMounted) {
					return;
				}
				if (result.status === 'error') {
					if (
						result.httpStatus === 401 &&
						(result.message === 'unauthorized' ||
							result.message === 'admin-session-expired')
					) {
						clearAdminSession();
						setAdmin(null);
					} else {
						setMessage(result.displayMessage);
					}
					return;
				}

				store.shared.adminCsrfToken.set(result.data.csrf_token);
				setAdmin(result.data);
			})
			.catch((error: unknown) => {
				if (!isMounted) {
					return;
				}
				setMessage(
					error instanceof Error
						? error.message
						: '读取管理员状态失败'
				);
			})
			.finally(() => {
				if (isMounted) {
					setIsAuthLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [initialData.admin]);

	useEffect(() => {
		if (admin !== null) {
			if (isServerInitialDetailRef.current) {
				isServerInitialDetailRef.current = false;
				return;
			}

			setDetail(null);
			setMessage(null);
			setPassword('');
			void refreshDetail();
		}
	}, [admin, id, refreshDetail]);

	useEffect(() => {
		if (
			!hasRequestedInitialSsoGrantsRef.current &&
			initialData.ssoGrants === null &&
			admin !== null &&
			detail !== null &&
			detail.user.id === id
		) {
			hasRequestedInitialSsoGrantsRef.current = true;
			refreshSsoGrants(1);
		}
	}, [admin, detail, id, initialData.ssoGrants, refreshSsoGrants]);

	useEffect(() => {
		if (admin === null || detail?.user.id !== id) {
			cancelPendingSsoGrantQueryRefresh();
		}
	}, [admin, cancelPendingSsoGrantQueryRefresh, detail, id]);

	useEffect(() => {
		setSsoGrantPageInput(String(ssoGrantPage));
	}, [ssoGrantPage]);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label="校验后台访问权限"
				subtitle="正在读取管理员会话"
				title="用户详情"
			/>
		);
	}

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<AdminHeaderActionLink
							href={adminListHref}
							icon={faArrowLeft}
						>
							返回管理员页
						</AdminHeaderActionLink>
					}
					icon={faShieldHalved}
					subtitle={message ?? '请先返回管理员页登录'}
					title="用户详情"
				/>
			</AdminShell>
		);
	}

	if (detail === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<>
							<AdminHeaderActionLink
								href={adminListHref}
								icon={faArrowLeft}
							>
								返回列表
							</AdminHeaderActionLink>
							<Button
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
								onPress={handleRefreshDetail}
							>
								刷新
							</Button>
						</>
					}
					icon={faUser}
					subtitle="正在读取账号资料"
					title="用户详情"
				/>
				{message !== null && <AdminMessage message={message} />}
				<AdminEmptyState icon={faClock}>等待详情数据</AdminEmptyState>
			</AdminShell>
		);
	}

	if (detail.user.id !== id) {
		return (
			<AdminShell>
				<AdminHeader
					icon={faUser}
					subtitle="正在切换目标用户"
					title="用户详情"
				/>
				<AdminPanel className="flex items-center gap-3 text-small text-foreground-500">
					<Button isLoading={isLoading} variant="flat">
						加载中
					</Button>
					<span>同步目标用户资料</span>
				</AdminPanel>
			</AdminShell>
		);
	}

	const {
		backup_imports: backupImports,
		namespaces,
		session_count: sessionCount,
		user,
	} = detail;
	const {
		created_at: createdAt,
		id: userId,
		last_login_at: lastLoginAt,
		state_epoch: stateEpoch,
		status: userStatus,
		username,
	} = user;
	const canDisableUser = userStatus === 'active';
	const canEnableUser = userStatus === 'disabled';
	const canRestoreUser = userStatus === 'deleted';
	const canResetPassword = userStatus !== 'deleted';
	const canClearUserData = userStatus !== 'deleted';
	const canRevokeAllSsoGrants =
		!isRevokingAllSsoGrants &&
		revokingSsoClientId === null &&
		(ssoGrantTotalCount === undefined
			? ssoGrants.length > 0
			: ssoGrantTotalCount > 0);
	const ssoCallbackNotice =
		userStatus === 'disabled' && ssoGrantTotalCount !== 0
			? '禁用用户会为仍有授权且配置了回调的SSO客户端入队user_disabled callback，可在Callback队列中查看投递状态。'
			: null;
	const shouldShowSsoGrantPanel =
		isSsoGrantLoading ||
		ssoGrantQuery.trim() !== '' ||
		ssoGrantTotalCount === undefined ||
		ssoGrantTotalCount > 0;
	const isPasswordValid = checkPasswordPolicy(password);
	const initialNowTimestamp = initialData.renderedAt;
	const latestNamespaceUpdatedAt = namespaces.reduce<number | null>(
		(latest, namespace) =>
			latest === null
				? namespace.updated_at
				: Math.max(latest, namespace.updated_at),
		null
	);
	const userAuditHref = `/admin/audit?scope=account&target_type=user&target_id=${encodeURIComponent(userId)}`;
	const ssoGrantRows = ssoGrants.map((grant) => (
		<AdminTableRow key={grant.client.id}>
			<AdminTableCell>
				<AdminEntityCell
					id={grant.client.id}
					title={grant.client.name}
				/>
			</AdminTableCell>
			<AdminTableCell isNowrap>
				<AdminSsoClientStatusBadge
					disabledAt={grant.client.disabled_at}
				/>
			</AdminTableCell>
			<AdminTableCell isNowrap>
				<TimeAgo
					initialNowTimestamp={initialNowTimestamp}
					timestamp={grant.created_at}
				/>
			</AdminTableCell>
			<AdminTableCell isNowrap>
				<TimeAgo
					initialNowTimestamp={initialNowTimestamp}
					timestamp={grant.updated_at}
				/>
			</AdminTableCell>
			<AdminTableCell className="text-right">
				<AdminConfirmButton
					color="danger"
					confirmAction={`revoke-sso:${grant.client.id}`}
					confirmLabel="确认撤销"
					icon={faUserSlash}
					isDisabled={
						isRevokingAllSsoGrants || revokingSsoClientId !== null
					}
					isLoading={revokingSsoClientId === grant.client.id}
					openAction={confirmAction}
					size="sm"
					onOpenChange={setConfirmAction}
					onConfirm={() => {
						handleRevokeSsoGrant(grant.client.id);
					}}
				>
					撤销
				</AdminConfirmButton>
			</AdminTableCell>
		</AdminTableRow>
	));

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<AdminHeaderActionLink
							href={adminListHref}
							icon={faArrowLeft}
						>
							返回列表
						</AdminHeaderActionLink>
						<AdminHeaderActionLink
							href={userAuditHref}
							icon={faClipboardList}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Admin Audit Button',
									'Open User Audit',
									userId
								);
							}}
						>
							审计日志
						</AdminHeaderActionLink>
						<Button
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
							onPress={handleRefreshDetail}
						>
							刷新
						</Button>
					</>
				}
				icon={faUser}
				title={username}
			/>

			<AdminMetricPanel className="sm:grid-cols-2 xl:grid-cols-5">
				<AdminMetric
					label="状态"
					value={<AdminStatusBadge status={userStatus} />}
				/>
				<AdminMetric label="活跃Session" value={sessionCount} />
				<AdminMetric
					className="sm:border-l-0 sm:pl-0 xl:border-l xl:border-default-200/80 xl:pl-3"
					label="State Epoch"
					value={stateEpoch}
				/>
				<AdminMetric label="同步命名空间" value={namespaces.length} />
				<AdminMetric
					label="最近同步更新"
					value={
						latestNamespaceUpdatedAt === null ? (
							<AdminMutedText>无</AdminMutedText>
						) : (
							<TimeAgo
								initialNowTimestamp={initialNowTimestamp}
								timestamp={latestNamespaceUpdatedAt}
							/>
						)
					}
				/>
			</AdminMetricPanel>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
				<AdminPanel className="space-y-4">
					<AdminPanelTitle icon={faKey}>重置登录密码</AdminPanelTitle>
					<Input
						description={PASSWORD_RULE_DESCRIPTION}
						errorMessage={
							password.length > 0 && !isPasswordValid
								? PASSWORD_RULE_DESCRIPTION
								: undefined
						}
						isInvalid={password.length > 0 && !isPasswordValid}
						label="新临时密码"
						startContent={<AdminInputIcon icon={faKey} />}
						type="password"
						value={password}
						onValueChange={setPassword}
					/>
					<Button
						color="warning"
						isDisabled={!canResetPassword || !isPasswordValid}
						isLoading={isLoading}
						startContent={
							isLoading ? null : (
								<FontAwesomeIcon
									icon={faKey}
									className="w-3.5"
								/>
							)
						}
						variant="flat"
						onPress={handleResetPassword}
					>
						重置密码
					</Button>
				</AdminPanel>

				<AdminPanel className="space-y-4">
					<AdminPanelTitle icon={faUserClock}>
						账号操作
					</AdminPanelTitle>
					<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
						<Button
							color="success"
							isDisabled={!canEnableUser}
							isLoading={isLoading}
							startContent={
								isLoading ? null : (
									<FontAwesomeIcon
										icon={faUserCheck}
										className="w-3.5"
									/>
								)
							}
							variant="flat"
							onPress={handleEnableUser}
						>
							启用用户
						</Button>
						<Button
							color="primary"
							isDisabled={!canRestoreUser}
							isLoading={isLoading}
							startContent={
								isLoading ? null : (
									<FontAwesomeIcon
										icon={faUserCheck}
										className="w-3.5"
									/>
								)
							}
							variant="flat"
							onPress={handleRestoreUser}
						>
							恢复账号
						</Button>
						<AdminConfirmButton
							color="warning"
							confirmAction="disable"
							confirmLabel="确认禁用"
							icon={faBan}
							isDisabled={!canDisableUser}
							isLoading={isLoading}
							openAction={confirmAction}
							onOpenChange={setConfirmAction}
							onConfirm={handleDisableUser}
						>
							禁用用户
						</AdminConfirmButton>
						<AdminConfirmButton
							color="danger"
							confirmAction="delete-sessions"
							confirmLabel="确认踢出"
							icon={faShieldHalved}
							isLoading={isLoading}
							openAction={confirmAction}
							onOpenChange={setConfirmAction}
							onConfirm={handleDeleteUserSessions}
						>
							踢出全部设备
						</AdminConfirmButton>
						<AdminConfirmButton
							color="danger"
							confirmAction="clear-data"
							confirmLabel="确认清空"
							icon={faTrash}
							isDisabled={!canClearUserData}
							isLoading={isLoading}
							openAction={confirmAction}
							onOpenChange={setConfirmAction}
							onConfirm={handleClearUserData}
						>
							清空账号数据
						</AdminConfirmButton>
					</div>
				</AdminPanel>
			</div>

			{message !== null && <AdminMessage message={message} />}
			{ssoCallbackNotice !== null && (
				<AdminMessage message={ssoCallbackNotice} />
			)}

			<AdminMetricPanel className="sm:grid-cols-3">
				<AdminMetric
					label="创建时间"
					value={
						<TimeAgo
							initialNowTimestamp={initialNowTimestamp}
							timestamp={createdAt}
						/>
					}
				/>
				<AdminMetric
					label="最近登录"
					value={
						lastLoginAt === null ? (
							<AdminMutedText>无</AdminMutedText>
						) : (
							<TimeAgo
								initialNowTimestamp={initialNowTimestamp}
								timestamp={lastLoginAt}
							/>
						)
					}
				/>
				<AdminMetric
					label="用户ID"
					value={
						<span className="break-all font-mono text-small">
							{userId}
						</span>
					}
				/>
			</AdminMetricPanel>

			<AdminPanel>
				<AdminPanelTitle icon={faDatabase}>
					同步命名空间
				</AdminPanelTitle>
				{namespaces.length === 0 ? (
					<AdminEmptyState icon={faServer}>
						暂无云端状态数据
					</AdminEmptyState>
				) : (
					<AdminTable>
						<AdminTableHeader>
							<tr>
								<AdminTableHeadCell>
									命名空间
								</AdminTableHeadCell>
								<AdminTableHeadCell>版本</AdminTableHeadCell>
								<AdminTableHeadCell>Schema</AdminTableHeadCell>
								<AdminTableHeadCell>
									更新时间
								</AdminTableHeadCell>
							</tr>
						</AdminTableHeader>
						<tbody>
							{namespaces.map((namespace) => (
								<AdminTableRow key={namespace.namespace}>
									<AdminTableCell className="font-mono text-small">
										{namespace.namespace}
									</AdminTableCell>
									<AdminTableCell isNowrap>
										{namespace.revision}
									</AdminTableCell>
									<AdminTableCell isNowrap>
										{namespace.schema_version}
									</AdminTableCell>
									<AdminTableCell isNowrap>
										<TimeAgo
											initialNowTimestamp={
												initialNowTimestamp
											}
											timestamp={namespace.updated_at}
										/>
									</AdminTableCell>
								</AdminTableRow>
							))}
						</tbody>
					</AdminTable>
				)}
			</AdminPanel>

			<AdminPanel>
				<AdminPanelTitle icon={faFileArchive}>
					旧备份导入记录
				</AdminPanelTitle>
				{backupImports.length === 0 ? (
					<AdminEmptyState icon={faFileArchive}>
						暂无旧备份导入记录
					</AdminEmptyState>
				) : (
					<AdminTable>
						<AdminTableHeader>
							<tr>
								<AdminTableHeadCell>
									导入时间
								</AdminTableHeadCell>
								<AdminTableHeadCell>备份码</AdminTableHeadCell>
								<AdminTableHeadCell>
									State Epoch
								</AdminTableHeadCell>
								<AdminTableHeadCell>
									导入结果
								</AdminTableHeadCell>
								<AdminTableHeadCell>文件名</AdminTableHeadCell>
							</tr>
						</AdminTableHeader>
						<tbody>
							{backupImports.map((record) => (
								<AdminTableRow
									key={`${record.code_hash}:${record.created_at}`}
								>
									<AdminTableCell isNowrap>
										<TimeAgo
											initialNowTimestamp={
												initialNowTimestamp
											}
											timestamp={record.created_at}
										/>
									</AdminTableCell>
									<AdminTableCell className="font-mono text-small">
										{record.code_hash}
									</AdminTableCell>
									<AdminTableCell isNowrap>
										{record.state_epoch}
									</AdminTableCell>
									<AdminTableCell>
										{record.results.length === 0 ? (
											<AdminMutedText>无</AdminMutedText>
										) : (
											<div className="space-y-1 font-mono text-tiny">
												{record.results.map(
													(result) => (
														<div
															key={`${record.code_hash}:${record.created_at}:${result.namespace}`}
														>
															{result.namespace} r
															{result.revision}
														</div>
													)
												)}
											</div>
										)}
									</AdminTableCell>
									<AdminTableCell className="break-all font-mono text-small">
										{record.file_name ?? (
											<AdminMutedText>无</AdminMutedText>
										)}
									</AdminTableCell>
								</AdminTableRow>
							))}
						</tbody>
					</AdminTable>
				)}
			</AdminPanel>

			{shouldShowSsoGrantPanel && (
				<AdminPanel>
					<AdminPanelToolbar
						icon={faServer}
						actions={
							<>
								<AdminSearchInput
									ariaLabel="搜索SSO客户端"
									icon={faSearch}
									placeholder="客户端名称或客户端ID"
									value={ssoGrantQuery}
									onValueChange={handleSsoGrantQueryChange}
								/>
								<AdminConfirmButton
									className="h-12 min-h-12"
									color="danger"
									confirmAction="revoke-all-sso"
									confirmLabel="确认撤销全部"
									icon={faUserSlash}
									isDisabled={!canRevokeAllSsoGrants}
									isLoading={isRevokingAllSsoGrants}
									openAction={confirmAction}
									onOpenChange={setConfirmAction}
									onConfirm={handleRevokeAllSsoGrants}
								>
									撤销全部授权
								</AdminConfirmButton>
							</>
						}
					>
						SSO授权
					</AdminPanelToolbar>
					{ssoGrants.length === 0 ? (
						<AdminEmptyState icon={faServer}>
							{isSsoGrantLoading ? '读取中' : '暂无SSO授权'}
						</AdminEmptyState>
					) : (
						<AdminTable>
							<AdminTableHeader>
								<tr>
									<AdminTableHeadCell>
										客户端
									</AdminTableHeadCell>
									<AdminTableHeadCell>
										状态
									</AdminTableHeadCell>
									<AdminTableHeadCell>
										授权时间
									</AdminTableHeadCell>
									<AdminTableHeadCell>
										最近刷新
									</AdminTableHeadCell>
									<AdminTableHeadCell className="text-right">
										操作
									</AdminTableHeadCell>
								</tr>
							</AdminTableHeader>
							<tbody>{ssoGrantRows}</tbody>
						</AdminTable>
					)}
					<AdminPagination
						currentPage={ssoGrantPage}
						isLoading={isSsoGrantLoading}
						pageInput={ssoGrantPageInput}
						totalLabel="个SSO授权"
						totalPages={ssoGrantTotalPages}
						{...(ssoGrantPageSize === undefined
							? {}
							: { pageSize: ssoGrantPageSize })}
						{...(ssoGrantTotalCount === undefined
							? {}
							: { totalCount: ssoGrantTotalCount })}
						onNextPage={handleNextSsoGrantPage}
						onPageInputChange={handleSsoGrantPageInputChange}
						onPageJumpSubmit={handleSsoGrantPageJumpSubmit}
						onPreviousPage={handlePreviousSsoGrantPage}
					/>
				</AdminPanel>
			)}
		</AdminShell>
	);
}
