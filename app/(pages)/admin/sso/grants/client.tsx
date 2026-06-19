'use client';

import {
	type Key,
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
	faClock,
	faListCheck,
	faMagnifyingGlass,
	faShieldHalved,
	faUserSlash,
} from '@fortawesome/free-solid-svg-icons';

import { Input } from '@/design/ui/components';

import {
	ADMIN_SSO_LIST_DEBOUNCE_MS,
	AdminSsoOperationNav,
	createAdminSsoPageInputValue,
	parseAdminSsoPageInput,
} from '../components';
import {
	AdminAdvancedFilterPopover,
	AdminConfirmButton,
	AdminDropdownFilter,
	AdminEmptyState,
	AdminEntityCell,
	AdminFilterActionButton,
	AdminFilterPanel,
	AdminHeader,
	AdminHeaderActionLink,
	AdminLoadingState,
	AdminMessage,
	AdminMetric,
	AdminMetricPanel,
	AdminPagination,
	AdminSearchInput,
	AdminShell,
	AdminSsoClientStatusBadge,
	AdminStatusBadge,
	AdminTable,
	AdminTableActionLink,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
	adminAdvancedFilterInputClassNames,
} from '../../components';
import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';

import { createAdminSsoHref } from '../locationState';
import {
	type TAdminApiResult,
	fetchAdminMe,
	listAdminSsoGrants,
	revokeAdminSsoGrant,
} from '../../api';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import type {
	IAdminMeData,
	IAdminSsoGrantListData,
	TUserStatus,
} from '@/lib/account/shared/types';

type TClientStatusFilter = '' | 'active' | 'disabled';
type TUserStatusFilter = '' | TUserStatus;
type TConfirmAction = 'revoke-selected' | `revoke:${string}` | null;

const pageInputRegexp = /^\d*$/u;

function createGrantSelectionKey(clientId: string, userId: string) {
	return JSON.stringify([clientId, userId]);
}

function parseGrantSelectionKey(key: string) {
	try {
		const value: unknown = JSON.parse(key);
		if (
			Array.isArray(value) &&
			value.length === 2 &&
			typeof value[0] === 'string' &&
			typeof value[1] === 'string'
		) {
			return { clientId: value[0], userId: value[1] };
		}
	} catch {
		return null;
	}

	return null;
}

const clientStatusOptions = [
	{ label: '全部客户端', value: '' },
	{ label: '正常客户端', value: 'active' },
	{ label: '已禁用客户端', value: 'disabled' },
] as const;

const userStatusOptions = [
	{ label: '全部用户', value: '' },
	{ label: '正常用户', value: 'active' },
	{ label: '已禁用用户', value: 'disabled' },
	{ label: '已删除用户', value: 'deleted' },
] as const;

function checkAdminUnauthorizedActionResult(
	result: Extract<TAdminApiResult, { status: 'error' }>
) {
	return (
		result.httpStatus === 401 &&
		(result.message === 'unauthorized' ||
			result.message === 'admin-session-expired')
	);
}

export interface IAdminSsoGrantsInitialData {
	admin: IAdminMeData | null;
	clientId: string;
	clientStatus: TClientStatusFilter;
	grants: IAdminSsoGrantListData | null;
	isAuthLoading: boolean;
	message: string | null;
	query: string;
	renderedAt: number;
	userId: string;
	userStatus: TUserStatusFilter;
}

interface IAdminSsoGrantsClientProps {
	initialData: IAdminSsoGrantsInitialData;
}

interface IAdminSsoGrantRowProps {
	confirmAction: TConfirmAction;
	grant: IAdminSsoGrantListData['grants'][number];
	initialNowTimestamp: number;
	isMutating: boolean;
	isSelected: boolean;
	onOpenChange: (action: TConfirmAction) => void;
	onRevoke: (clientId: string, userId: string) => void;
	onSelectChange: (key: string, selected: boolean) => void;
	revokingKey: string | null;
}

const AdminSsoGrantRow = memo<IAdminSsoGrantRowProps>(
	function AdminSsoGrantRow({
		confirmAction,
		grant,
		initialNowTimestamp,
		isMutating,
		isSelected,
		onOpenChange,
		onRevoke,
		onSelectChange,
		revokingKey,
	}) {
		const rowKey = createGrantSelectionKey(grant.client.id, grant.user.id);
		const confirmActionKey: TConfirmAction = `revoke:${rowKey}`;
		const isRevokingCurrentRow = revokingKey === rowKey;

		return (
			<AdminTableRow>
				<AdminTableCell isNowrap>
					<input
						aria-label={`选择${grant.client.id}/${grant.user.id}`}
						checked={isSelected}
						className="h-4 w-4 accent-primary"
						disabled={isMutating}
						type="checkbox"
						onChange={(event) => {
							onSelectChange(rowKey, event.currentTarget.checked);
						}}
					/>
				</AdminTableCell>
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
				<AdminTableCell>
					<AdminEntityCell
						id={grant.user.id}
						title={grant.user.nickname ?? grant.user.username}
					/>
				</AdminTableCell>
				<AdminTableCell isNowrap>
					<AdminStatusBadge status={grant.user.status} />
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
				<AdminTableCell isNowrap className="text-right">
					<AdminTableActionLink
						href={`/admin/users/${encodeURIComponent(grant.user.id)}`}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Admin SSO Grant Button',
								'Open User',
								grant.user.id
							);
						}}
					>
						用户
					</AdminTableActionLink>
					<AdminTableActionLink
						href={`/admin/sso/${encodeURIComponent(grant.client.id)}`}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Admin SSO Grant Button',
								'Open Client',
								grant.client.id
							);
						}}
					>
						客户端
					</AdminTableActionLink>
					<AdminConfirmButton
						color="danger"
						confirmAction={confirmActionKey}
						confirmLabel="确认撤销"
						icon={faUserSlash}
						isDisabled={isMutating && !isRevokingCurrentRow}
						isLoading={isRevokingCurrentRow}
						openAction={confirmAction}
						size="sm"
						onOpenChange={onOpenChange}
						onConfirm={() => {
							onRevoke(grant.client.id, grant.user.id);
						}}
					>
						撤销
					</AdminConfirmButton>
				</AdminTableCell>
			</AdminTableRow>
		);
	}
);

export default function AdminSsoGrantsClient({
	initialData,
}: IAdminSsoGrantsClientProps) {
	const pathname = usePathname();
	const router = useRouter();
	const requestIdRef = useRef(0);
	const pageRef = useRef(initialData.grants?.page ?? 1);
	const isServerInitialRef = useRef(initialData.grants !== null);
	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [grants, setGrants] = useState<IAdminSsoGrantListData | null>(
		initialData.grants
	);
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [page, setPage] = useState(initialData.grants?.page ?? 1);
	const [pageInput, setPageInput] = useState(
		createAdminSsoPageInputValue(initialData.grants?.page ?? 1)
	);
	const [queryInput, setQueryInput] = useState(initialData.query);
	const [clientIdInput, setClientIdInput] = useState(initialData.clientId);
	const [userIdInput, setUserIdInput] = useState(initialData.userId);
	const [clientStatus, setClientStatus] = useState<TClientStatusFilter>(
		initialData.clientStatus
	);
	const [userStatus, setUserStatus] = useState<TUserStatusFilter>(
		initialData.userStatus
	);
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
	const [confirmAction, setConfirmAction] = useState<TConfirmAction>(null);
	const [revokingKey, setRevokingKey] = useState<string | null>(null);
	const [isRevokingSelected, setIsRevokingSelected] = useState(false);
	const isMutatingGrant = revokingKey !== null || isRevokingSelected;
	const clientIdFilter = clientIdInput.trim();
	const userIdFilter = userIdInput.trim();

	const createListOptions = useCallback(
		(nextPage = page) => ({
			page: nextPage,
			pageSize: grants?.page_size ?? 20,
			...(clientIdFilter === '' ? {} : { clientId: clientIdFilter }),
			...(clientStatus === '' ? {} : { clientStatus }),
			...(queryInput.trim() === '' ? {} : { query: queryInput.trim() }),
			...(userIdFilter === '' ? {} : { userId: userIdFilter }),
			...(userStatus === '' ? {} : { userStatus }),
		}),
		[
			clientIdFilter,
			clientStatus,
			grants?.page_size,
			page,
			queryInput,
			userIdFilter,
			userStatus,
		]
	);

	const handleErrorResult = useCallback(
		(result: Extract<TAdminApiResult, { status: 'error' }>) => {
			if (checkAdminUnauthorizedActionResult(result)) {
				clearAdminSession();
				setAdmin(null);
				setGrants(null);
			}

			setMessage(result.displayMessage);
		},
		[]
	);

	const refreshGrants = useCallback(
		(nextPage = page) => {
			requestIdRef.current += 1;
			const requestId = requestIdRef.current;
			setIsLoading(true);
			setMessage(null);

			void listAdminSsoGrants(createListOptions(nextPage))
				.then((result) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					if (result.status === 'error') {
						handleErrorResult(result);
						return;
					}

					setGrants(result.data);
					setPage(result.data.page);
					setSelectedKeys(new Set());
				})
				.catch((error: unknown) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					setMessage(
						error instanceof Error
							? error.message
							: '读取SSO授权关系失败'
					);
				})
				.finally(() => {
					if (requestIdRef.current === requestId) {
						setIsLoading(false);
					}
				});
		},
		[createListOptions, handleErrorResult, page]
	);
	const refreshGrantsRef = useRef(refreshGrants);
	refreshGrantsRef.current = refreshGrants;

	const refreshCurrentGrants = useCallback(() => {
		refreshGrantsRef.current(pageRef.current);
	}, []);

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
					handleErrorResult(result);
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
	}, [handleErrorResult]);

	useEffect(
		() => () => {
			requestIdRef.current += 1;
		},
		[]
	);

	useEffect(() => {
		if (initialData.admin !== null) {
			setIsAuthLoading(false);
			return;
		}

		checkAdmin();
	}, [checkAdmin, initialData.admin]);

	useEffect(() => {
		let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;

		if (admin !== null) {
			if (isServerInitialRef.current) {
				isServerInitialRef.current = false;
			} else {
				timeoutId = globalThis.setTimeout(() => {
					refreshGrants(page);
				}, ADMIN_SSO_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				globalThis.clearTimeout(timeoutId);
			}
		};
	}, [admin, page, refreshGrants]);

	useEffect(() => {
		pageRef.current = page;
		setPageInput(createAdminSsoPageInputValue(page));
	}, [page]);

	useEffect(() => {
		if (pathname !== '/admin/sso/grants') {
			return;
		}

		const nextHref = createAdminSsoHref('/admin/sso/grants', {
			clientId: clientIdInput,
			clientStatus,
			page,
			query: queryInput,
			userId: userIdInput,
			userStatus,
		});
		const currentHref = `${globalThis.location.pathname}${globalThis.location.search}`;

		if (currentHref === nextHref) {
			return;
		}

		const timeoutId = globalThis.setTimeout(() => {
			router.replace(nextHref, { scroll: false });
		}, ADMIN_SSO_LIST_DEBOUNCE_MS);

		return () => {
			globalThis.clearTimeout(timeoutId);
		};
	}, [
		clientIdInput,
		clientStatus,
		page,
		pathname,
		queryInput,
		router,
		userIdInput,
		userStatus,
	]);

	const handleRefresh = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Grant Button',
			'Refresh'
		);
		refreshCurrentGrants();
	}, [refreshCurrentGrants]);

	const handleRevokeGrant = useCallback(
		(clientId: string, userId: string) => {
			if (revokingKey !== null || isRevokingSelected) {
				return;
			}

			const csrfToken = admin?.csrf_token;
			if (csrfToken === undefined) {
				setMessage('admin-session-expired');
				return;
			}

			const key = createGrantSelectionKey(clientId, userId);
			trackEvent(
				trackEvent.category.click,
				'Admin SSO Grant Button',
				'Revoke Grant',
				key
			);
			setRevokingKey(key);
			setConfirmAction(null);
			setMessage(null);
			void revokeAdminSsoGrant(
				clientId,
				userId,
				csrfToken,
				'admin-global-grants-page'
			)
				.then((result) => {
					if (result.status === 'error') {
						handleErrorResult(result);
						return;
					}

					setMessage('SSO授权已撤销');
					refreshCurrentGrants();
				})
				.catch((error: unknown) => {
					setMessage(
						error instanceof Error
							? error.message
							: '撤销SSO授权失败'
					);
				})
				.finally(() => {
					setRevokingKey(null);
				});
		},
		[
			admin?.csrf_token,
			handleErrorResult,
			isRevokingSelected,
			refreshCurrentGrants,
			revokingKey,
		]
	);

	const handleRevokeSelected = useCallback(() => {
		if (revokingKey !== null || isRevokingSelected) {
			return;
		}

		const csrfToken = admin?.csrf_token;
		if (csrfToken === undefined) {
			setMessage('admin-session-expired');
			return;
		}
		const keys = [...selectedKeys];
		if (keys.length === 0) {
			return;
		}
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Grant Button',
			'Revoke Selected Grants',
			keys.length
		);

		setIsRevokingSelected(true);
		setConfirmAction(null);
		setMessage(null);
		void Promise.all(
			keys.map((key) => {
				const grantKey = parseGrantSelectionKey(key);
				return grantKey === null
					? Promise.resolve({ status: 'ok' as const })
					: revokeAdminSsoGrant(
							grantKey.clientId,
							grantKey.userId,
							csrfToken,
							'admin-global-grants-selected'
						);
			})
		)
			.then((results) => {
				const errorResult = results.find(
					(
						result
					): result is Extract<
						TAdminApiResult,
						{ status: 'error' }
					> => result.status === 'error'
				);
				if (errorResult !== undefined) {
					handleErrorResult(errorResult);
					return;
				}

				setSelectedKeys(new Set());
				setMessage(`已撤销${results.length}条SSO授权`);
				refreshCurrentGrants();
			})
			.catch((error: unknown) => {
				setMessage(
					error instanceof Error
						? error.message
						: '批量撤销SSO授权失败'
				);
			})
			.finally(() => {
				setIsRevokingSelected(false);
			});
	}, [
		admin?.csrf_token,
		handleErrorResult,
		isRevokingSelected,
		refreshCurrentGrants,
		revokingKey,
		selectedKeys,
	]);

	const handleQueryInputChange = useCallback((value: string) => {
		setPage(1);
		setQueryInput(value);
	}, []);

	const handleClientIdInputChange = useCallback((value: string) => {
		setPage(1);
		setClientIdInput(value);
	}, []);

	const handleUserIdInputChange = useCallback((value: string) => {
		setPage(1);
		setUserIdInput(value);
	}, []);

	const handleSelectChange = useCallback(
		(key: string, isSelected: boolean) => {
			setSelectedKeys((currentKeys) => {
				const nextKeys = new Set(currentKeys);
				if (isSelected) {
					nextKeys.add(key);
				} else {
					nextKeys.delete(key);
				}

				return nextKeys;
			});
		},
		[]
	);

	const handleClientStatusAction = useCallback((key: Key) => {
		setPage(1);
		setClientStatus(String(key) as TClientStatusFilter);
	}, []);

	const handleUserStatusAction = useCallback((key: Key) => {
		setPage(1);
		setUserStatus(String(key) as TUserStatusFilter);
	}, []);

	const handlePreviousPage = useCallback(() => {
		setPage((currentPage) => Math.max(1, currentPage - 1));
	}, []);

	const handleNextPage = useCallback(() => {
		setPage((currentPage) =>
			Math.min(
				Math.max(1, grants?.total_pages ?? currentPage + 1),
				currentPage + 1
			)
		);
	}, [grants?.total_pages]);

	const handlePageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setPageInput(value);
		}
	}, []);

	const handlePageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			setPage(
				parseAdminSsoPageInput(pageInput, grants?.total_pages ?? 1)
			);
		},
		[grants?.total_pages, pageInput]
	);

	const rows = useMemo(
		() =>
			grants?.grants.map((grant) => {
				const key = createGrantSelectionKey(
					grant.client.id,
					grant.user.id
				);

				return (
					<AdminSsoGrantRow
						key={key}
						confirmAction={confirmAction}
						grant={grant}
						initialNowTimestamp={initialData.renderedAt}
						isMutating={isMutatingGrant}
						isSelected={selectedKeys.has(key)}
						revokingKey={revokingKey}
						onOpenChange={setConfirmAction}
						onRevoke={handleRevokeGrant}
						onSelectChange={handleSelectChange}
					/>
				);
			}) ?? [],
		[
			confirmAction,
			grants?.grants,
			handleRevokeGrant,
			handleSelectChange,
			initialData.renderedAt,
			isMutatingGrant,
			revokingKey,
			selectedKeys,
		]
	);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label="读取会话状态"
				subtitle="正在校验管理员会话"
				title="SSO授权关系"
			/>
		);
	}

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<AdminHeaderActionLink href="/admin/sso">
							返回SSO客户端
						</AdminHeaderActionLink>
					}
					icon={faShieldHalved}
					subtitle={message ?? '请先返回管理员页登录'}
					title="SSO授权关系"
				/>
			</AdminShell>
		);
	}

	const selectedCount = selectedKeys.size;

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<AdminHeaderActionLink href="/admin/sso">
						返回SSO客户端
					</AdminHeaderActionLink>
				}
				icon={faListCheck}
				title="SSO授权关系"
			/>
			<AdminSsoOperationNav activeHref="/admin/sso/grants" />

			<AdminMetricPanel className="sm:grid-cols-2 xl:grid-cols-4">
				<AdminMetric
					label="当前页授权"
					value={grants === null ? '读取中' : grants.grants.length}
				/>
				<AdminMetric
					label="筛选总数"
					value={grants === null ? '读取中' : grants.total_count}
				/>
				<AdminMetric
					label="页码"
					value={grants === null ? '读取中' : grants.page}
				/>
				<AdminMetric label="已选择" value={selectedCount} />
			</AdminMetricPanel>

			<AdminFilterPanel icon={faMagnifyingGlass}>
				<AdminSearchInput
					ariaLabel="搜索授权关系"
					icon={faMagnifyingGlass}
					placeholder="客户端ID、客户端名称、用户ID、用户名"
					value={queryInput}
					onValueChange={handleQueryInputChange}
				/>
				<AdminAdvancedFilterPopover
					activeCount={
						[clientIdFilter, userIdFilter].filter(Boolean).length
					}
				>
					<Input
						aria-label="精确客户端ID"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="客户端ID"
						value={clientIdInput}
						onValueChange={handleClientIdInputChange}
					/>
					<Input
						aria-label="精确用户ID"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="用户ID"
						value={userIdInput}
						onValueChange={handleUserIdInputChange}
					/>
				</AdminAdvancedFilterPopover>
				<AdminDropdownFilter
					ariaLabel="筛选客户端状态"
					options={clientStatusOptions}
					value={clientStatus}
					onAction={handleClientStatusAction}
				/>
				<AdminDropdownFilter
					ariaLabel="筛选用户状态"
					options={userStatusOptions}
					value={userStatus}
					onAction={handleUserStatusAction}
				/>
				<AdminFilterActionButton
					isLoading={isLoading}
					onPress={handleRefresh}
				>
					刷新
				</AdminFilterActionButton>
			</AdminFilterPanel>

			{message !== null && <AdminMessage message={message} />}

			<AdminMetricPanel className="grid-cols-1">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<span className="text-small text-foreground-500">
						批量撤销会删除授权关系并撤销对应未消费的Ticket
					</span>
					<AdminConfirmButton
						color="danger"
						confirmAction="revoke-selected"
						confirmLabel="确认撤销所选"
						icon={faUserSlash}
						isDisabled={selectedCount === 0 || isMutatingGrant}
						isLoading={isRevokingSelected}
						openAction={confirmAction}
						onOpenChange={setConfirmAction}
						onConfirm={handleRevokeSelected}
					>
						撤销所选
					</AdminConfirmButton>
				</div>
			</AdminMetricPanel>

			{grants === null ? (
				<AdminEmptyState icon={faClock}>
					正在读取授权关系
				</AdminEmptyState>
			) : grants.grants.length === 0 ? (
				<AdminEmptyState icon={faListCheck}>
					暂无授权关系
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<AdminTableHeadCell>选择</AdminTableHeadCell>
							<AdminTableHeadCell>客户端</AdminTableHeadCell>
							<AdminTableHeadCell>客户端状态</AdminTableHeadCell>
							<AdminTableHeadCell>用户</AdminTableHeadCell>
							<AdminTableHeadCell>用户状态</AdminTableHeadCell>
							<AdminTableHeadCell>授权时间</AdminTableHeadCell>
							<AdminTableHeadCell>最近刷新</AdminTableHeadCell>
							<AdminTableHeadCell className="text-right">
								操作
							</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>{rows}</tbody>
				</AdminTable>
			)}

			<AdminPagination
				currentPage={grants?.page ?? page}
				isLoading={isLoading}
				pageInput={pageInput}
				pageSize={grants?.page_size}
				totalCount={grants?.total_count}
				totalLabel="条授权"
				totalPages={Math.max(1, grants?.total_pages ?? page)}
				onNextPage={handleNextPage}
				onPageInputChange={handlePageInputChange}
				onPageJumpSubmit={handlePageJumpSubmit}
				onPreviousPage={handlePreviousPage}
			/>
		</AdminShell>
	);
}
