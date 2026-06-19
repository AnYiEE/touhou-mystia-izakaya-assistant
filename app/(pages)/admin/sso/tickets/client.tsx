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
	faKey,
	faMagnifyingGlass,
	faShieldHalved,
	faTrash,
	faUserSlash,
} from '@fortawesome/free-solid-svg-icons';

import { Input } from '@/design/ui/components';

import {
	ADMIN_SSO_LIST_DEBOUNCE_MS,
	AdminSsoOperationNav,
	AdminSsoTicketStatusBadge,
	createAdminSsoDateTimeText,
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

import { createAdminSsoHref } from '../locationState';
import {
	type TAdminApiResult,
	cleanupAdminSsoTickets,
	fetchAdminMe,
	listAdminSsoTickets,
	revokeAdminSsoClientTickets,
	revokeAdminUserSsoTickets,
} from '../../api';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import type {
	IAdminMeData,
	IAdminSsoTicketListData,
	TAdminSsoTicketStatus,
} from '@/lib/account/shared/types';

type TTicketStatusFilter = '' | TAdminSsoTicketStatus;
type TConfirmAction = 'cleanup' | 'revoke-client' | 'revoke-user' | null;

const pageInputRegexp = /^\d*$/u;

const statusOptions = [
	{ label: '全部状态', value: '' },
	{ label: '未消费', value: 'pending' },
	{ label: '已消费', value: 'used' },
	{ label: '已撤销', value: 'revoked' },
	{ label: '已过期', value: 'expired' },
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

export interface IAdminSsoTicketsInitialData {
	admin: IAdminMeData | null;
	clientId: string;
	isAuthLoading: boolean;
	message: string | null;
	query: string;
	renderedAt: number;
	status: TTicketStatusFilter;
	tickets: IAdminSsoTicketListData | null;
	userId: string;
}

interface IAdminSsoTicketsClientProps {
	initialData: IAdminSsoTicketsInitialData;
}

const AdminSsoTicketRow = memo<{
	ticket: IAdminSsoTicketListData['tickets'][number];
}>(function AdminSsoTicketRow({ ticket }) {
	return (
		<AdminTableRow>
			<AdminTableCell>
				<span className="font-mono text-tiny text-foreground-500">
					{ticket.ticket_hash_prefix}
				</span>
			</AdminTableCell>
			<AdminTableCell isNowrap>
				<AdminSsoTicketStatusBadge status={ticket.status} />
			</AdminTableCell>
			<AdminTableCell>
				<AdminEntityCell
					id={ticket.client.id}
					title={ticket.client.name}
				/>
			</AdminTableCell>
			<AdminTableCell isNowrap>
				<AdminSsoClientStatusBadge
					disabledAt={ticket.client.disabled_at}
				/>
			</AdminTableCell>
			<AdminTableCell>
				<AdminEntityCell
					id={ticket.user.id}
					title={ticket.user.nickname ?? ticket.user.username}
				/>
			</AdminTableCell>
			<AdminTableCell isNowrap>
				<AdminStatusBadge status={ticket.user.status} />
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{createAdminSsoDateTimeText(ticket.expires_at)}
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{ticket.used_at === null
					? '无'
					: createAdminSsoDateTimeText(ticket.used_at)}
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{ticket.revoked_at === null
					? '无'
					: createAdminSsoDateTimeText(ticket.revoked_at)}
			</AdminTableCell>
			<AdminTableCell className="max-w-72">
				<span className="line-clamp-2 break-words text-foreground-500">
					{ticket.redirect_uri}
				</span>
			</AdminTableCell>
			<AdminTableCell isNowrap>
				<AdminTableActionLink
					href={`/admin/sso/${encodeURIComponent(ticket.client.id)}`}
					onPress={() => {
						trackEvent(
							trackEvent.category.click,
							'Admin SSO Ticket Button',
							'Open Client',
							ticket.client.id
						);
					}}
				>
					客户端
				</AdminTableActionLink>
				<AdminTableActionLink
					href={`/admin/users/${encodeURIComponent(ticket.user.id)}`}
					onPress={() => {
						trackEvent(
							trackEvent.category.click,
							'Admin SSO Ticket Button',
							'Open User',
							ticket.user.id
						);
					}}
				>
					用户
				</AdminTableActionLink>
			</AdminTableCell>
		</AdminTableRow>
	);
});

export default function AdminSsoTicketsClient({
	initialData,
}: IAdminSsoTicketsClientProps) {
	const pathname = usePathname();
	const router = useRouter();
	const requestIdRef = useRef(0);
	const pageRef = useRef(initialData.tickets?.page ?? 1);
	const isServerInitialRef = useRef(initialData.tickets !== null);
	const ticketMutationInFlightRef = useRef(false);
	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [tickets, setTickets] = useState<IAdminSsoTicketListData | null>(
		initialData.tickets
	);
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [page, setPage] = useState(initialData.tickets?.page ?? 1);
	const [pageInput, setPageInput] = useState(
		createAdminSsoPageInputValue(initialData.tickets?.page ?? 1)
	);
	const [queryInput, setQueryInput] = useState(initialData.query);
	const [clientIdInput, setClientIdInput] = useState(initialData.clientId);
	const [userIdInput, setUserIdInput] = useState(initialData.userId);
	const [statusFilter, setStatusFilter] = useState<TTicketStatusFilter>(
		initialData.status
	);
	const [confirmAction, setConfirmAction] = useState<TConfirmAction>(null);
	const [isMutating, setIsMutating] = useState(false);

	const createListOptions = useCallback(
		(nextPage = page) => ({
			page: nextPage,
			pageSize: tickets?.page_size ?? 20,
			...(clientIdInput.trim() === ''
				? {}
				: { clientId: clientIdInput.trim() }),
			...(queryInput.trim() === '' ? {} : { query: queryInput.trim() }),
			...(statusFilter === '' ? {} : { status: statusFilter }),
			...(userIdInput.trim() === ''
				? {}
				: { userId: userIdInput.trim() }),
		}),
		[
			clientIdInput,
			page,
			queryInput,
			statusFilter,
			tickets?.page_size,
			userIdInput,
		]
	);

	const handleErrorResult = useCallback(
		(result: Extract<TAdminApiResult, { status: 'error' }>) => {
			if (checkAdminUnauthorizedActionResult(result)) {
				clearAdminSession();
				setAdmin(null);
				setTickets(null);
			}

			setMessage(result.displayMessage);
		},
		[]
	);

	const refreshTickets = useCallback(
		(nextPage = page) => {
			requestIdRef.current += 1;
			const requestId = requestIdRef.current;
			setIsLoading(true);
			setMessage(null);

			void listAdminSsoTickets(createListOptions(nextPage))
				.then((result) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					if (result.status === 'error') {
						handleErrorResult(result);
						return;
					}

					setTickets(result.data);
					setPage(result.data.page);
				})
				.catch((error: unknown) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					setMessage(
						error instanceof Error
							? error.message
							: '读取SSO Ticket失败'
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
	const refreshTicketsRef = useRef(refreshTickets);
	refreshTicketsRef.current = refreshTickets;

	const refreshCurrentTickets = useCallback(() => {
		refreshTicketsRef.current(pageRef.current);
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
					refreshTickets(page);
				}, ADMIN_SSO_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				globalThis.clearTimeout(timeoutId);
			}
		};
	}, [admin, page, refreshTickets]);

	useEffect(() => {
		pageRef.current = page;
		setPageInput(createAdminSsoPageInputValue(page));
	}, [page]);

	useEffect(() => {
		if (pathname !== '/admin/sso/tickets') {
			return;
		}

		const nextHref = createAdminSsoHref('/admin/sso/tickets', {
			clientId: clientIdInput,
			page,
			query: queryInput,
			status: statusFilter,
			userId: userIdInput,
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
		page,
		pathname,
		queryInput,
		router,
		statusFilter,
		userIdInput,
	]);

	const handleRefresh = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Ticket Button',
			'Refresh'
		);
		refreshCurrentTickets();
	}, [refreshCurrentTickets]);

	const mutateTickets = useCallback(
		(action: TConfirmAction) => {
			if (ticketMutationInFlightRef.current) {
				return;
			}

			const csrfToken = admin?.csrf_token;
			if (csrfToken === undefined) {
				setMessage('admin-session-expired');
				return;
			}

			let request: ReturnType<typeof cleanupAdminSsoTickets>;
			let eventName: string;
			let eventValue: string | undefined;
			if (action === 'cleanup') {
				request = cleanupAdminSsoTickets(csrfToken);
				eventName = 'Cleanup Expired Tickets';
			} else if (
				action === 'revoke-client' &&
				clientIdInput.trim() !== ''
			) {
				const clientId = clientIdInput.trim();
				request = revokeAdminSsoClientTickets(
					clientId,
					csrfToken,
					'admin-global-tickets-client'
				);
				eventName = 'Revoke Client Tickets';
				eventValue = clientId;
			} else if (action === 'revoke-user' && userIdInput.trim() !== '') {
				const userId = userIdInput.trim();
				request = revokeAdminUserSsoTickets(
					userId,
					csrfToken,
					'admin-global-tickets-user'
				);
				eventName = 'Revoke User Tickets';
				eventValue = userId;
			} else {
				setMessage('请先填写客户端ID或用户ID');
				return;
			}

			trackEvent(
				trackEvent.category.click,
				'Admin SSO Ticket Button',
				eventName,
				eventValue
			);

			setIsMutating(true);
			ticketMutationInFlightRef.current = true;
			setConfirmAction(null);
			setMessage(null);
			void request
				.then((result) => {
					if (result.status === 'error') {
						handleErrorResult(result);
						return;
					}

					const deletedCount = result.data.deleted_count;
					setMessage(
						typeof deletedCount === 'number'
							? `已清理${deletedCount}条过期Ticket`
							: `已撤销${result.data.revoked_count ?? 0}条未消费Ticket`
					);
					refreshCurrentTickets();
				})
				.catch((error: unknown) => {
					setMessage(
						error instanceof Error
							? error.message
							: '更新SSO Ticket失败'
					);
				})
				.finally(() => {
					ticketMutationInFlightRef.current = false;
					setIsMutating(false);
				});
		},
		[
			admin?.csrf_token,
			clientIdInput,
			handleErrorResult,
			refreshCurrentTickets,
			userIdInput,
		]
	);

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

	const handleStatusAction = useCallback((key: Key) => {
		setPage(1);
		setStatusFilter(String(key) as TTicketStatusFilter);
	}, []);

	const handlePreviousPage = useCallback(() => {
		setPage((currentPage) => Math.max(1, currentPage - 1));
	}, []);

	const handleNextPage = useCallback(() => {
		setPage((currentPage) =>
			Math.min(
				Math.max(1, tickets?.total_pages ?? currentPage + 1),
				currentPage + 1
			)
		);
	}, [tickets?.total_pages]);

	const handlePageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setPageInput(value);
		}
	}, []);

	const handlePageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			setPage(
				parseAdminSsoPageInput(pageInput, tickets?.total_pages ?? 1)
			);
		},
		[pageInput, tickets?.total_pages]
	);

	const rows = useMemo(
		() =>
			tickets?.tickets.map((ticket) => (
				<AdminSsoTicketRow
					key={`${ticket.client.id}:${ticket.user.id}:${ticket.ticket_hash_prefix}`}
					ticket={ticket}
				/>
			)) ?? [],
		[tickets?.tickets]
	);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label="读取会话状态"
				subtitle="正在校验管理员会话"
				title="SSO Tickets"
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
					title="SSO Tickets"
				/>
			</AdminShell>
		);
	}

	const pendingCount =
		tickets?.tickets.filter((ticket) => ticket.status === 'pending')
			.length ?? 0;
	const advancedFilterCount = [clientIdInput, userIdInput].filter(
		(value) => value.trim() !== ''
	).length;

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<AdminHeaderActionLink href="/admin/sso">
						返回SSO客户端
					</AdminHeaderActionLink>
				}
				icon={faKey}
				title="SSO Tickets"
			/>
			<AdminSsoOperationNav activeHref="/admin/sso/tickets" />

			<AdminMetricPanel className="sm:grid-cols-2 xl:grid-cols-4">
				<AdminMetric
					label="当前页Ticket"
					value={tickets === null ? '读取中' : tickets.tickets.length}
				/>
				<AdminMetric
					label="筛选总数"
					value={tickets === null ? '读取中' : tickets.total_count}
				/>
				<AdminMetric
					label="当前页未消费"
					value={tickets === null ? '读取中' : pendingCount}
				/>
				<AdminMetric
					label="页码"
					value={tickets === null ? '读取中' : tickets.page}
				/>
			</AdminMetricPanel>

			<AdminFilterPanel icon={faMagnifyingGlass}>
				<AdminSearchInput
					ariaLabel="搜索Ticket"
					icon={faMagnifyingGlass}
					placeholder="Ticket前缀、客户端ID、用户ID、用户名、Redirect URI"
					value={queryInput}
					onValueChange={handleQueryInputChange}
				/>
				<AdminAdvancedFilterPopover activeCount={advancedFilterCount}>
					<Input
						aria-label="按客户端ID过滤"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="客户端ID"
						value={clientIdInput}
						onValueChange={handleClientIdInputChange}
					/>
					<Input
						aria-label="按用户ID过滤"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="用户ID"
						value={userIdInput}
						onValueChange={handleUserIdInputChange}
					/>
				</AdminAdvancedFilterPopover>
				<AdminDropdownFilter
					ariaLabel="筛选Ticket状态"
					options={statusOptions}
					value={statusFilter}
					onAction={handleStatusAction}
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
						撤销操作只影响未消费Ticket；按客户端/用户
						撤销会使用筛选条件
					</span>
					<div className="flex flex-wrap gap-2">
						<AdminConfirmButton
							color="danger"
							confirmAction="cleanup"
							confirmLabel="确认清理"
							icon={faTrash}
							isLoading={isMutating}
							openAction={confirmAction}
							onOpenChange={setConfirmAction}
							onConfirm={() => {
								mutateTickets('cleanup');
							}}
						>
							清理过期
						</AdminConfirmButton>
						<AdminConfirmButton
							color="danger"
							confirmAction="revoke-client"
							confirmLabel="确认撤销"
							icon={faUserSlash}
							isDisabled={clientIdInput.trim() === ''}
							isLoading={isMutating}
							openAction={confirmAction}
							onOpenChange={setConfirmAction}
							onConfirm={() => {
								mutateTickets('revoke-client');
							}}
						>
							撤销客户端
						</AdminConfirmButton>
						<AdminConfirmButton
							color="danger"
							confirmAction="revoke-user"
							confirmLabel="确认撤销"
							icon={faUserSlash}
							isDisabled={userIdInput.trim() === ''}
							isLoading={isMutating}
							openAction={confirmAction}
							onOpenChange={setConfirmAction}
							onConfirm={() => {
								mutateTickets('revoke-user');
							}}
						>
							撤销用户
						</AdminConfirmButton>
					</div>
				</div>
			</AdminMetricPanel>

			{tickets === null ? (
				<AdminEmptyState icon={faClock}>
					正在读取SSO Tickets
				</AdminEmptyState>
			) : tickets.tickets.length === 0 ? (
				<AdminEmptyState icon={faKey}>暂无SSO Tickets</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<AdminTableHeadCell>Ticket</AdminTableHeadCell>
							<AdminTableHeadCell>状态</AdminTableHeadCell>
							<AdminTableHeadCell>客户端</AdminTableHeadCell>
							<AdminTableHeadCell>客户端状态</AdminTableHeadCell>
							<AdminTableHeadCell>用户</AdminTableHeadCell>
							<AdminTableHeadCell>用户状态</AdminTableHeadCell>
							<AdminTableHeadCell>过期时间</AdminTableHeadCell>
							<AdminTableHeadCell>消费时间</AdminTableHeadCell>
							<AdminTableHeadCell>撤销时间</AdminTableHeadCell>
							<AdminTableHeadCell>
								Redirect URI
							</AdminTableHeadCell>
							<AdminTableHeadCell>操作</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>{rows}</tbody>
				</AdminTable>
			)}

			<AdminPagination
				currentPage={tickets?.page ?? page}
				isLoading={isLoading}
				pageInput={pageInput}
				pageSize={tickets?.page_size}
				totalCount={tickets?.total_count}
				totalLabel="条Ticket"
				totalPages={Math.max(1, tickets?.total_pages ?? page)}
				onNextPage={handleNextPage}
				onPageInputChange={handlePageInputChange}
				onPageJumpSubmit={handlePageJumpSubmit}
				onPreviousPage={handlePreviousPage}
			/>
		</AdminShell>
	);
}
