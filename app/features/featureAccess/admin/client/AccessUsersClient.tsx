'use client';

import {
	faMagnifyingGlass,
	faUserLock,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { IAdminUserListData } from '@/features/account/contracts';
import { AccessAdminNavigation } from '@/features/featureAccess/admin/client/AccessAdminNavigation';
import { fetchAdminFeatureAccessUsers } from '@/features/featureAccess/admin/client/api';
import { FEATURE_ACCESS_ADMIN_MESSAGE_MAP } from '@/features/featureAccess/admin/client/copy';
import {
	ADMIN_LIST_DEBOUNCE_MS,
	AdminSearchInput,
} from '@/features/admin/client/components/filters';
import {
	AdminEmptyState,
	AdminMessage,
} from '@/features/admin/client/components/feedback';
import { AdminFilterPanel } from '@/features/admin/client/components/panels';
import { AdminPagination } from '@/features/admin/client/components/pagination';
import {
	AdminHeader,
	AdminShell,
} from '@/features/admin/client/components/shell';
import {
	AdminEntityCell,
	AdminTable,
	AdminTableActionLink,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '@/features/admin/client/components/table';
import { AdminStatusBadge } from '@/features/admin/client/components/statusBadges';
import { createAdminUserDisplayName } from '@/features/admin/client/components/userPresentation';

export function AccessUsersClient({
	initialData,
	initialQuery = '',
}: {
	initialData: IAdminUserListData;
	initialQuery?: string;
}) {
	const [users, setUsers] = useState(initialData);
	const [query, setQuery] = useState(initialQuery);
	const [queryInput, setQueryInput] = useState(initialQuery);
	const [pageInput, setPageInput] = useState(String(initialData.page));
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const requestIdRef = useRef(0);

	const loadPage = useCallback(
		(page: number, nextQuery = query) => {
			const requestId = requestIdRef.current + 1;
			requestIdRef.current = requestId;
			setIsLoading(true);
			setMessage(null);
			void fetchAdminFeatureAccessUsers({ page, query: nextQuery })
				.then((result) => {
					if (requestId !== requestIdRef.current) {
						return;
					}
					if (result.status === 'error') {
						setMessage(result.displayMessage);
						return;
					}
					setUsers(result.data);
					setPageInput(String(result.data.page));
				})
				.catch(() => {
					if (requestId !== requestIdRef.current) {
						return;
					}
					setMessage(
						FEATURE_ACCESS_ADMIN_MESSAGE_MAP.usersReadFailed
					);
				})
				.finally(() => {
					if (requestId === requestIdRef.current) {
						setIsLoading(false);
					}
				});
		},
		[query]
	);

	const handleQueryInputChange = useCallback((value: string) => {
		requestIdRef.current += 1;
		setIsLoading(false);
		setQueryInput(value);
	}, []);

	useEffect(() => {
		const nextQuery = queryInput.trim();
		if (nextQuery === query) {
			return;
		}

		const timeoutId = setTimeout(() => {
			setQuery(nextQuery);
			loadPage(1, nextQuery);
		}, ADMIN_LIST_DEBOUNCE_MS);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [loadPage, query, queryInput]);

	useEffect(
		() => () => {
			requestIdRef.current += 1;
		},
		[]
	);

	useEffect(() => {
		const searchParams = new URLSearchParams();
		if (users.page > 1) {
			searchParams.set('page', String(users.page));
		}
		if (query !== '') {
			searchParams.set('query', query);
		}
		const suffix = searchParams.toString();
		const nextUrl = `${location.pathname}${suffix === '' ? '' : `?${suffix}`}`;
		const currentUrl = `${location.pathname}${location.search}`;
		if (currentUrl !== nextUrl) {
			globalThis.history.replaceState(null, '', nextUrl);
		}
	}, [query, users.page]);

	return (
		<AdminShell>
			<AdminHeader
				icon={faUserLock}
				subtitle="为用户分配授权组并设置直接允许或禁止"
				title="用户访问"
			/>
			<AccessAdminNavigation />
			<AdminFilterPanel icon={faMagnifyingGlass}>
				<AdminSearchInput
					icon={faMagnifyingGlass}
					ariaLabel="搜索用户"
					placeholder="用户名、昵称或用户ID"
					value={queryInput}
					onValueChange={handleQueryInputChange}
				/>
			</AdminFilterPanel>
			{message !== null && <AdminMessage message={message} />}
			{users.users.length === 0 ? (
				<AdminEmptyState icon={faUsers}>没有匹配的用户</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<AdminTableRow>
							<AdminTableHeadCell>用户名</AdminTableHeadCell>
							<AdminTableHeadCell>状态</AdminTableHeadCell>
							<AdminTableHeadCell className="text-right">
								操作
							</AdminTableHeadCell>
						</AdminTableRow>
					</AdminTableHeader>
					<tbody>
						{users.users.map((user) => (
							<AdminTableRow key={user.id}>
								<AdminTableCell className="w-96 max-w-96">
									<AdminEntityCell
										className="max-w-80"
										id={user.id}
										title={createAdminUserDisplayName(user)}
									/>
								</AdminTableCell>
								<AdminTableCell isNowrap>
									<AdminStatusBadge status={user.status} />
								</AdminTableCell>
								<AdminTableCell isNowrap className="text-right">
									<AdminTableActionLink
										href={`/admin/access/users/${encodeURIComponent(user.id)}`}
									>
										管理访问
									</AdminTableActionLink>
								</AdminTableCell>
							</AdminTableRow>
						))}
					</tbody>
				</AdminTable>
			)}
			<AdminPagination
				currentPage={users.page}
				isLoading={isLoading}
				pageInput={pageInput}
				pageSize={users.page_size}
				totalCount={users.total_count}
				totalLabel="个用户"
				totalPages={Math.max(1, users.total_pages)}
				onNextPage={() => {
					loadPage(Math.min(users.total_pages, users.page + 1));
				}}
				onPageInputChange={setPageInput}
				onPageJumpSubmit={(event) => {
					event.preventDefault();
					const page = Number.parseInt(pageInput, 10);
					if (Number.isSafeInteger(page) && page >= 1) {
						loadPage(
							Math.min(page, Math.max(1, users.total_pages))
						);
					}
				}}
				onPreviousPage={() => {
					loadPage(Math.max(1, users.page - 1));
				}}
			/>
		</AdminShell>
	);
}
