'use client';

import {
	faBullhorn,
	faClock,
	faListCheck,
	faMagnifyingGlass,
	faShieldHalved,
	faUserSlash,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { usePathname, useRouter } from 'next/navigation';
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

import Input from '@/design/ui/components/input';
import TimeAgo from '@/design/ui/components/timeAgo';

import { type TUserStatus } from '@/domain/account/contracts';

import type {
	IAdminMeData,
	IAdminSsoGrantListData,
} from '@/features/account/contracts';
import type { IAdminSsoGrantsInitialData } from '@/features/account/sso/admin/contracts';
import {
	ADMIN_SSO_GRANT_CLIENT_STATUS_FILTER_OPTIONS,
	ADMIN_SSO_GRANT_USER_STATUS_FILTER_OPTIONS,
	ADMIN_SSO_MESSAGE_MAP,
	createAdminSsoGrantBatchResultMessage,
} from '@/features/account/sso/admin/copy';
import { fetchAdminMe } from '@/features/admin/client/api';
import { AdminConfirmButton } from '@/features/admin/client/components/confirmation';
import {
	AdminEmptyState,
	AdminLoadingState,
	AdminMessage,
} from '@/features/admin/client/components/feedback';
import {
	ADMIN_LIST_DEBOUNCE_MS,
	AdminAdvancedFilterPopover,
	AdminDropdownFilter,
	AdminFilterActionButton,
	AdminFilterReferencePanel,
	AdminSearchInput,
	adminAdvancedFilterInputClassNames,
} from '@/features/admin/client/components/filters';
import { AdminPagination } from '@/features/admin/client/components/pagination';
import {
	AdminFilterPanel,
	AdminMetric,
	AdminMetricPanel,
} from '@/features/admin/client/components/panels';
import {
	AdminHeader,
	AdminHeaderActionLink,
	AdminShell,
} from '@/features/admin/client/components/shell';
import { AdminStatusBadge } from '@/features/admin/client/components/statusBadges';
import {
	AdminEntityCell,
	AdminTable,
	AdminTableActionLink,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '@/features/admin/client/components/table';
import { createAdminUserDisplayName } from '@/features/admin/client/components/userPresentation';
import {
	createAdminPageInputValue,
	parseAdminPageInput,
} from '@/features/admin/client/inputValues';
import {
	clearAdminSession,
	isAdminSessionInvalidResult,
} from '@/features/admin/client/session';
import type { TAdminApiResult } from '@/features/admin/contracts';
import {
	ADMIN_MESSAGE_MAP,
	ADMIN_STATUS_LABEL_MAP,
} from '@/features/admin/copy';
import { createAdminHref } from '@/features/admin/navigation';
import { trackEvent } from '@/features/analytics/client/trackEvent';

import { listAdminSsoGrants, revokeAdminSsoGrant } from './api/grants';
import { AdminSsoOperationNav } from './components/operationNav';
import { AdminSsoClientStatusBadge } from './components/statusBadges';

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

const grantFilterReferenceGroups = [
	{
		label: '客户端状态',
		values: ADMIN_SSO_GRANT_CLIENT_STATUS_FILTER_OPTIONS.filter(
			(option) => option.value !== ''
		).map((option) => ({ label: option.label, value: option.value })),
	},
	{
		label: '用户状态',
		values: ADMIN_SSO_GRANT_USER_STATUS_FILTER_OPTIONS.filter(
			(option) => option.value !== ''
		).map((option) => ({ label: option.label, value: option.value })),
	},
] as const;

function summarizeGrantRevocationBatch<TData>(
	keys: string[],
	results: Array<PromiseSettledResult<TAdminApiResult<TData>>>
) {
	const successfulKeys: string[] = [];
	const failedKeys: string[] = [];
	let firstApiError: Extract<TAdminApiResult, { status: 'error' }> | null =
		null;
	let firstFailureMessage: string | null = null;

	for (const [index, result] of results.entries()) {
		const key = keys[index];
		if (key === undefined) {
			continue;
		}

		if (result.status === 'rejected') {
			failedKeys.push(key);
			firstFailureMessage ??=
				result.reason instanceof Error
					? result.reason.message
					: ADMIN_SSO_MESSAGE_MAP.grantBatchRevokeFailed;
			continue;
		}

		if (result.value.status === 'ok') {
			successfulKeys.push(key);
			continue;
		}

		failedKeys.push(key);
		firstApiError ??= result.value;
		firstFailureMessage ??= result.value.displayMessage;
	}

	return { failedKeys, firstApiError, firstFailureMessage, successfulKeys };
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
						title={createAdminUserDisplayName(grant.user)}
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
					<div className="flex flex-nowrap items-center justify-end gap-2">
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
					</div>
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
		createAdminPageInputValue(initialData.grants?.page ?? 1)
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
			if (isAdminSessionInvalidResult(result)) {
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
							: ADMIN_SSO_MESSAGE_MAP.grantReadFailed
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
						: ADMIN_MESSAGE_MAP.adminStateReadFailed
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
				}, ADMIN_LIST_DEBOUNCE_MS);
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
		setPageInput(createAdminPageInputValue(page));
	}, [page]);

	useEffect(() => {
		if (pathname !== '/admin/sso/grants') {
			return;
		}

		const nextHref = createAdminHref('/admin/sso/grants', {
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
		}, ADMIN_LIST_DEBOUNCE_MS);

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
				setMessage(ADMIN_MESSAGE_MAP.adminSessionExpired);
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

					setMessage(ADMIN_MESSAGE_MAP.ssoGrantRevoked);
					refreshCurrentGrants();
				})
				.catch((error: unknown) => {
					setMessage(
						error instanceof Error
							? error.message
							: ADMIN_MESSAGE_MAP.ssoGrantRevokeFailed
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
			setMessage(ADMIN_MESSAGE_MAP.adminSessionExpired);
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
		void Promise.allSettled(
			keys.map((key) => {
				const grantKey = parseGrantSelectionKey(key);
				return grantKey === null
					? Promise.reject(new Error('invalid-grant-selection'))
					: revokeAdminSsoGrant(
							grantKey.clientId,
							grantKey.userId,
							csrfToken,
							'admin-global-grants-selected'
						);
			})
		)
			.then((results) => {
				const summary = summarizeGrantRevocationBatch(keys, results);
				setSelectedKeys(new Set(summary.failedKeys));
				if (summary.successfulKeys.length > 0) {
					refreshCurrentGrants();
				}
				if (summary.failedKeys.length === 0) {
					setMessage(
						createAdminSsoGrantBatchResultMessage({
							failedCount: 0,
							failureMessage: null,
							successfulCount: summary.successfulKeys.length,
						})
					);
					return;
				}
				if (
					summary.firstApiError !== null &&
					isAdminSessionInvalidResult(summary.firstApiError)
				) {
					handleErrorResult(summary.firstApiError);
					return;
				}
				setMessage(
					createAdminSsoGrantBatchResultMessage({
						failedCount: summary.failedKeys.length,
						failureMessage: summary.firstFailureMessage,
						successfulCount: summary.successfulKeys.length,
					})
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
			setPage(parseAdminPageInput(pageInput, grants?.total_pages ?? 1));
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
				label={ADMIN_STATUS_LABEL_MAP.sessionReading}
				subtitle={ADMIN_MESSAGE_MAP.adminSessionChecking}
				title="SSO授权关系"
			/>
		);
	}

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<>
							<AdminHeaderActionLink href="/admin" icon={faUsers}>
								用户管理
							</AdminHeaderActionLink>
							<AdminHeaderActionLink
								href="/admin/announcements"
								icon={faBullhorn}
							>
								站点通知
							</AdminHeaderActionLink>
						</>
					}
					icon={faShieldHalved}
					subtitle={message ?? ADMIN_MESSAGE_MAP.adminSignInRequired}
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
					<>
						<AdminHeaderActionLink href="/admin" icon={faUsers}>
							用户管理
						</AdminHeaderActionLink>
						<AdminHeaderActionLink
							href="/admin/announcements"
							icon={faBullhorn}
						>
							站点通知
						</AdminHeaderActionLink>
					</>
				}
				icon={faListCheck}
				title="SSO授权关系"
			/>
			<AdminSsoOperationNav activeHref="/admin/sso/grants" />

			<AdminMetricPanel className="sm:grid-cols-2 xl:grid-cols-4">
				<AdminMetric
					label="当前页授权"
					value={
						grants === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: grants.grants.length
					}
				/>
				<AdminMetric
					label="筛选总数"
					value={
						grants === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: grants.total_count
					}
				/>
				<AdminMetric
					label="页码"
					value={
						grants === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: grants.page
					}
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
					reference={
						<AdminFilterReferencePanel
							groups={grantFilterReferenceGroups}
						/>
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
					options={ADMIN_SSO_GRANT_CLIENT_STATUS_FILTER_OPTIONS}
					value={clientStatus}
					onAction={handleClientStatusAction}
				/>
				<AdminDropdownFilter
					ariaLabel="筛选用户状态"
					options={ADMIN_SSO_GRANT_USER_STATUS_FILTER_OPTIONS}
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
					{ADMIN_SSO_MESSAGE_MAP.grantListReading}
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
