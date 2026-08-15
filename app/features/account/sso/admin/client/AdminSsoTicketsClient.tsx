'use client';

import {
	faBullhorn,
	faClock,
	faKey,
	faMagnifyingGlass,
	faShieldHalved,
	faTrash,
	faUserSlash,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { usePathname, useRouter } from 'next/navigation';
import {
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import Input from '@/design/ui/components/input';

import type {
	IAdminMeData,
	IAdminSsoTicketListData,
	TAdminSsoTicketStatus,
} from '@/features/account/contracts';
import type { IAdminSsoTicketsInitialData } from '@/features/account/sso/admin/contracts';
import {
	ADMIN_SSO_MESSAGE_MAP,
	ADMIN_SSO_TICKET_STATUS_FILTER_OPTIONS,
	createAdminSsoTicketCleanupSuccessMessage,
	createAdminSsoTicketRevokeSuccessMessage,
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
	createAdminDateTimeText,
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

import {
	cleanupAdminSsoTickets,
	listAdminSsoTickets,
	revokeAdminSsoClientTickets,
	revokeAdminUserSsoTickets,
} from './api/tickets';
import { AdminSsoOperationNav } from './components/operationNav';
import {
	AdminSsoClientStatusBadge,
	AdminSsoTicketStatusBadge,
} from './components/statusBadges';

type TTicketStatusFilter = '' | TAdminSsoTicketStatus;
type TConfirmAction = 'cleanup' | 'revoke-client' | 'revoke-user' | null;

const pageInputRegexp = /^\d*$/u;

const ticketFilterReferenceGroups = [
	{
		label: 'Ticket状态',
		values: ADMIN_SSO_TICKET_STATUS_FILTER_OPTIONS.filter(
			(option) => option.value !== ''
		).map((option) => ({ label: option.label, value: option.value })),
	},
] as const;

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
					title={createAdminUserDisplayName(ticket.user)}
				/>
			</AdminTableCell>
			<AdminTableCell isNowrap>
				<AdminStatusBadge status={ticket.user.status} />
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{createAdminDateTimeText(ticket.expires_at)}
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{ticket.used_at === null
					? '无'
					: createAdminDateTimeText(ticket.used_at)}
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{ticket.revoked_at === null
					? '无'
					: createAdminDateTimeText(ticket.revoked_at)}
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
		createAdminPageInputValue(initialData.tickets?.page ?? 1)
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
			if (isAdminSessionInvalidResult(result)) {
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
						Error.isError(error)
							? error.message
							: ADMIN_SSO_MESSAGE_MAP.ticketReadFailed
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
					Error.isError(error)
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
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		if (admin !== null) {
			if (isServerInitialRef.current) {
				isServerInitialRef.current = false;
			} else {
				timeoutId = setTimeout(() => {
					refreshTickets(page);
				}, ADMIN_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}
		};
	}, [admin, page, refreshTickets]);

	useEffect(() => {
		pageRef.current = page;
		setPageInput(createAdminPageInputValue(page));
	}, [page]);

	useEffect(() => {
		if (pathname !== '/admin/sso/tickets') {
			return;
		}

		const nextHref = createAdminHref('/admin/sso/tickets', {
			clientId: clientIdInput,
			page,
			query: queryInput,
			status: statusFilter,
			userId: userIdInput,
		});
		const currentHref = `${location.pathname}${location.search}`;

		if (currentHref === nextHref) {
			return;
		}

		const timeoutId = setTimeout(() => {
			router.replace(nextHref, { scroll: false });
		}, ADMIN_LIST_DEBOUNCE_MS);

		return () => {
			clearTimeout(timeoutId);
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
				setMessage(ADMIN_MESSAGE_MAP.adminSessionExpired);
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
				setMessage(ADMIN_SSO_MESSAGE_MAP.ticketFilterRequired);
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
							? createAdminSsoTicketCleanupSuccessMessage(
									deletedCount
								)
							: createAdminSsoTicketRevokeSuccessMessage(
									result.data.revoked_count ?? 0
								)
					);
					refreshCurrentTickets();
				})
				.catch((error: unknown) => {
					setMessage(
						Error.isError(error)
							? error.message
							: ADMIN_SSO_MESSAGE_MAP.ticketUpdateFailed
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

	const handleStatusAction = useCallback((value: TTicketStatusFilter) => {
		setPage(1);
		setStatusFilter(value);
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
			setPage(parseAdminPageInput(pageInput, tickets?.total_pages ?? 1));
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
				label={ADMIN_STATUS_LABEL_MAP.sessionReading}
				subtitle={ADMIN_MESSAGE_MAP.adminSessionChecking}
				title="SSO Tickets"
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
					title="SSO Tickets"
				/>
			</AdminShell>
		);
	}

	const pendingCount =
		tickets?.tickets.filter((ticket) => ticket.status === 'pending')
			.length ?? 0;
	const canCleanupTickets =
		tickets !== null && tickets.cleanup_count > 0 && !isMutating;
	const advancedFilterCount = [clientIdInput, userIdInput].filter(
		(value) => value.trim() !== ''
	).length;

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
				icon={faKey}
				title="SSO Tickets"
			/>
			<AdminSsoOperationNav activeHref="/admin/sso/tickets" />

			<AdminMetricPanel className="sm:grid-cols-2 xl:grid-cols-4">
				<AdminMetric
					label="当前页Ticket"
					value={
						tickets === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: tickets.tickets.length
					}
				/>
				<AdminMetric
					label="筛选总数"
					value={
						tickets === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: tickets.total_count
					}
				/>
				<AdminMetric
					label="当前页未消费"
					value={
						tickets === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: pendingCount
					}
				/>
				<AdminMetric
					label="页码"
					value={
						tickets === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: tickets.page
					}
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
				<AdminAdvancedFilterPopover
					activeCount={advancedFilterCount}
					reference={
						<AdminFilterReferencePanel
							groups={ticketFilterReferenceGroups}
						/>
					}
				>
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
					options={ADMIN_SSO_TICKET_STATUS_FILTER_OPTIONS}
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
						撤销操作只影响未消费Ticket；按客户端/用户撤销会使用筛选条件
					</span>
					<div className="flex flex-wrap gap-2">
						<AdminConfirmButton
							color="danger"
							confirmAction="cleanup"
							confirmLabel="确认清理"
							icon={faTrash}
							isDisabled={!canCleanupTickets}
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
					{ADMIN_SSO_MESSAGE_MAP.ticketListReading}
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
				totalLabel="条Tickets"
				totalPages={Math.max(1, tickets?.total_pages ?? page)}
				onNextPage={handleNextPage}
				onPageInputChange={handlePageInputChange}
				onPageJumpSubmit={handlePageJumpSubmit}
				onPreviousPage={handlePreviousPage}
			/>
		</AdminShell>
	);
}
