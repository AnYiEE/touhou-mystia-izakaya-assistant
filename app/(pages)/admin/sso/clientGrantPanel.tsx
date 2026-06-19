'use client';

import {
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faRotate,
	faSearch,
	faUserSlash,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';

import { Button } from '@/design/ui/components';

import {
	AdminConfirmButton,
	AdminEmptyState,
	AdminEntityCell,
	AdminMetric,
	AdminPagination,
	AdminPanel,
	AdminPanelToolbar,
	AdminSearchInput,
	AdminStatusBadge,
	AdminTable,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '../components';
import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';

import {
	type TAdminApiResult,
	listAdminAuditLogs,
	listAdminSsoCallbacks,
	listAdminSsoClientUsers,
	listAdminSsoTickets,
	revokeAdminSsoClientGrants,
	revokeAdminSsoClientUserGrant,
} from '../api';
import {
	type IAdminMeData,
	type IAdminSsoClientUserGrant,
	type IAdminSsoClientUsersData,
} from '@/lib/account/shared/types';
import { clearAdminSession } from '@/lib/account/client/adminSession';

const pageInputRegexp = /^\d*$/u;

type TConfirmAction = 'revoke-client-grants' | `revoke-grant:${string}` | null;

interface IClientOperationSummary {
	auditLogs: number | null;
	callbackQueue: number | null;
	pendingTickets: number | null;
}

interface IProps {
	admin: IAdminMeData;
	clientId: string;
	initialData: IAdminSsoClientUsersData | null;
	isSaving: boolean;
	onMessage: (message: string | null) => void;
	onUnauthorized: () => void;
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

function createMetricValue(value: number | null, isLoading: boolean) {
	if (value !== null) {
		return value;
	}

	return isLoading ? '读取中' : '未读取';
}

export default memo<IProps>(function AdminSsoClientGrantPanel({
	admin,
	clientId,
	initialData,
	isSaving,
	onMessage,
	onUnauthorized,
}) {
	const [confirmAction, setConfirmAction] = useState<TConfirmAction>(null);
	const [grantQuery, setGrantQuery] = useState('');
	const [grantPage, setGrantPage] = useState(initialData?.page ?? 1);
	const [grantPageInput, setGrantPageInput] = useState(
		String(initialData?.page ?? 1)
	);
	const [grantPageSize, setGrantPageSize] = useState<number | undefined>(
		initialData?.page_size
	);
	const [grantTotalCount, setGrantTotalCount] = useState<number | undefined>(
		initialData?.total_count
	);
	const [grantTotalPages, setGrantTotalPages] = useState(
		Math.max(1, initialData?.total_pages ?? 1)
	);
	const [grants, setGrants] = useState<IAdminSsoClientUserGrant[]>(
		initialData?.grants ?? []
	);
	const [summary, setSummary] = useState<IClientOperationSummary>({
		auditLogs: null,
		callbackQueue: null,
		pendingTickets: null,
	});
	const [isGrantLoading, setIsGrantLoading] = useState(false);
	const [isSummaryLoading, setIsSummaryLoading] = useState(false);
	const [isRevokingAll, setIsRevokingAll] = useState(false);
	const [revokingGrantUserId, setRevokingGrantUserId] = useState<
		string | null
	>(null);
	const grantRequestIdRef = useRef(0);
	const hasLoadedInitialGrantsRef = useRef(initialData !== null);
	const isGrantQueryInitialRenderRef = useRef(true);
	const grantPageRef = useRef(initialData?.page ?? 1);
	const summaryRequestIdRef = useRef(0);

	const handleErrorResult = useCallback(
		(result: Extract<TAdminApiResult, { status: 'error' }>) => {
			if (checkAdminUnauthorizedActionResult(result)) {
				clearAdminSession();
				onUnauthorized();
				return true;
			}

			onMessage(result.displayMessage);
			return true;
		},
		[onMessage, onUnauthorized]
	);

	const applyGrantData = useCallback((data: IAdminSsoClientUsersData) => {
		setGrants(data.grants);
		setGrantPage(data.page);
		setGrantPageSize(data.page_size);
		setGrantTotalCount(data.total_count);
		setGrantTotalPages(Math.max(1, data.total_pages));
	}, []);

	const refreshSummary = useCallback(() => {
		setIsSummaryLoading(true);
		const requestId = summaryRequestIdRef.current + 1;
		summaryRequestIdRef.current = requestId;

		void Promise.all([
			listAdminSsoTickets({
				clientId,
				page: 1,
				pageSize: 1,
				status: 'pending',
			}),
			listAdminSsoCallbacks({ clientId, page: 1, pageSize: 1 }),
			listAdminAuditLogs({
				page: 1,
				pageSize: 1,
				query: clientId,
				scope: 'sso',
			}),
		])
			.then(([ticketsResult, callbacksResult, auditResult]) => {
				if (summaryRequestIdRef.current !== requestId) {
					return;
				}
				if (ticketsResult.status === 'error') {
					handleErrorResult(ticketsResult);
					return;
				}
				if (callbacksResult.status === 'error') {
					handleErrorResult(callbacksResult);
					return;
				}
				if (auditResult.status === 'error') {
					handleErrorResult(auditResult);
					return;
				}

				setSummary({
					auditLogs: auditResult.data.total_count,
					callbackQueue: callbacksResult.data.total_count,
					pendingTickets: ticketsResult.data.total_count,
				});
			})
			.catch((error: unknown) => {
				if (summaryRequestIdRef.current !== requestId) {
					return;
				}
				onMessage(
					error instanceof Error
						? error.message
						: '读取SSO客户端摘要失败'
				);
			})
			.finally(() => {
				if (summaryRequestIdRef.current === requestId) {
					setIsSummaryLoading(false);
				}
			});
	}, [clientId, handleErrorResult, onMessage]);

	const refreshGrants = useCallback(
		(nextPage = grantPage) => {
			setIsGrantLoading(true);
			onMessage(null);
			const requestId = grantRequestIdRef.current + 1;
			grantRequestIdRef.current = requestId;

			void listAdminSsoClientUsers(clientId, {
				page: nextPage,
				query: grantQuery.trim(),
			})
				.then((result) => {
					if (grantRequestIdRef.current !== requestId) {
						return;
					}
					if (result.status === 'error') {
						handleErrorResult(result);
						return;
					}

					applyGrantData(result.data);
				})
				.catch((error: unknown) => {
					if (grantRequestIdRef.current !== requestId) {
						return;
					}
					onMessage(
						error instanceof Error
							? error.message
							: '读取授权用户失败'
					);
				})
				.finally(() => {
					if (grantRequestIdRef.current === requestId) {
						setIsGrantLoading(false);
					}
				});
		},
		[
			applyGrantData,
			clientId,
			grantPage,
			grantQuery,
			handleErrorResult,
			onMessage,
		]
	);
	const refreshGrantsRef = useRef(refreshGrants);
	refreshGrantsRef.current = refreshGrants;

	const refreshCurrentGrants = useCallback(() => {
		refreshGrantsRef.current(grantPageRef.current);
	}, []);

	const refreshGrantPage = useCallback((nextPage: number) => {
		refreshGrantsRef.current(nextPage);
	}, []);

	const handleRefreshGrants = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Client Button',
			'Refresh Grants And Summary',
			clientId
		);
		refreshGrants(1);
		refreshSummary();
	}, [clientId, refreshGrants, refreshSummary]);

	const handlePreviousGrantPage = useCallback(() => {
		refreshGrants(Math.max(1, grantPage - 1));
	}, [grantPage, refreshGrants]);

	const handleNextGrantPage = useCallback(() => {
		refreshGrants(grantPage + 1);
	}, [grantPage, refreshGrants]);

	const handleGrantPageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setGrantPageInput(value);
		}
	}, []);

	const handleGrantPageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();

			const targetPage = Number.parseInt(grantPageInput, 10);
			if (!Number.isSafeInteger(targetPage) || targetPage < 1) {
				setGrantPageInput(String(grantPage));
				return;
			}

			refreshGrants(Math.min(targetPage, grantTotalPages));
		},
		[grantPage, grantPageInput, grantTotalPages, refreshGrants]
	);

	const handleRevokeGrant = useCallback(
		(userId: string) => {
			trackEvent(
				trackEvent.category.click,
				'Admin SSO Client Button',
				'Revoke User Grant',
				`${clientId}:${userId}`
			);

			setRevokingGrantUserId(userId);
			setConfirmAction(null);
			onMessage(null);

			void revokeAdminSsoClientUserGrant(
				clientId,
				userId,
				admin.csrf_token
			)
				.then((result) => {
					if (result.status === 'error') {
						handleErrorResult(result);
						return;
					}

					onMessage('SSO授权已撤销');
					refreshCurrentGrants();
					refreshSummary();
				})
				.catch((error: unknown) => {
					onMessage(
						error instanceof Error
							? error.message
							: '撤销SSO授权失败'
					);
				})
				.finally(() => {
					setRevokingGrantUserId(null);
				});
		},
		[
			admin.csrf_token,
			clientId,
			handleErrorResult,
			onMessage,
			refreshCurrentGrants,
			refreshSummary,
		]
	);

	const handleRevokeClientGrants = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Client Button',
			'Revoke Client Grants',
			clientId
		);

		setIsRevokingAll(true);
		setConfirmAction(null);
		onMessage(null);

		void revokeAdminSsoClientGrants(clientId, admin.csrf_token)
			.then((result) => {
				if (result.status === 'error') {
					handleErrorResult(result);
					return;
				}

				onMessage(
					`SSO授权已批量撤销${
						result.data.revoked_count === undefined
							? ''
							: `：${result.data.revoked_count}个`
					}`
				);
				refreshGrantPage(1);
				refreshSummary();
			})
			.catch((error: unknown) => {
				onMessage(
					error instanceof Error
						? error.message
						: '批量撤销SSO授权失败'
				);
			})
			.finally(() => {
				setIsRevokingAll(false);
			});
	}, [
		admin.csrf_token,
		clientId,
		handleErrorResult,
		onMessage,
		refreshGrantPage,
		refreshSummary,
	]);

	useEffect(() => {
		if (initialData !== null || hasLoadedInitialGrantsRef.current) {
			return;
		}

		hasLoadedInitialGrantsRef.current = true;
		refreshGrantsRef.current(1);
	}, [initialData]);

	useEffect(() => {
		if (isGrantQueryInitialRenderRef.current) {
			isGrantQueryInitialRenderRef.current = false;
			return;
		}

		const timeout = globalThis.setTimeout(() => {
			refreshGrantsRef.current(1);
		}, 300);

		return () => {
			globalThis.clearTimeout(timeout);
		};
	}, [grantQuery]);

	useEffect(() => {
		refreshSummary();
	}, [refreshSummary]);

	useEffect(
		() => () => {
			grantRequestIdRef.current += 1;
			summaryRequestIdRef.current += 1;
		},
		[]
	);

	useEffect(() => {
		grantPageRef.current = grantPage;
		setGrantPageInput(String(grantPage));
	}, [grantPage]);

	const grantRows = useMemo(
		() =>
			grants.map((grant) => (
				<AdminTableRow key={grant.user.id}>
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
						<TimeAgo timestamp={grant.created_at} />
					</AdminTableCell>
					<AdminTableCell isNowrap>
						<TimeAgo timestamp={grant.updated_at} />
					</AdminTableCell>
					<AdminTableCell className="text-right">
						<AdminConfirmButton
							color="danger"
							confirmAction={`revoke-grant:${grant.user.id}`}
							confirmLabel="确认撤销"
							icon={faUserSlash}
							isDisabled={
								isSaving ||
								isRevokingAll ||
								revokingGrantUserId !== null
							}
							isLoading={revokingGrantUserId === grant.user.id}
							openAction={confirmAction}
							size="sm"
							onOpenChange={setConfirmAction}
							onConfirm={() => {
								handleRevokeGrant(grant.user.id);
							}}
						>
							撤销
						</AdminConfirmButton>
					</AdminTableCell>
				</AdminTableRow>
			)),
		[
			confirmAction,
			grants,
			handleRevokeGrant,
			isRevokingAll,
			isSaving,
			revokingGrantUserId,
		]
	);

	const hasGrantRows = grants.length > 0;
	const canRevokeAll =
		!isSaving &&
		!isRevokingAll &&
		revokingGrantUserId === null &&
		(grantTotalCount === undefined ? hasGrantRows : grantTotalCount > 0);

	return (
		<AdminPanel>
			<AdminPanelToolbar
				icon={faUsers}
				actions={
					<>
						<AdminSearchInput
							ariaLabel="搜索授权用户"
							icon={faSearch}
							placeholder="用户名或用户ID"
							value={grantQuery}
							onValueChange={setGrantQuery}
						/>
						<AdminConfirmButton
							color="danger"
							confirmAction="revoke-client-grants"
							confirmLabel="确认撤销全部"
							icon={faUserSlash}
							isDisabled={!canRevokeAll}
							isLoading={isRevokingAll}
							openAction={confirmAction}
							onOpenChange={setConfirmAction}
							onConfirm={handleRevokeClientGrants}
						>
							撤销全部授权
						</AdminConfirmButton>
						<Button
							className="h-12 min-h-12"
							color="primary"
							isLoading={isGrantLoading || isSummaryLoading}
							startContent={
								isGrantLoading || isSummaryLoading ? null : (
									<FontAwesomeIcon
										icon={faRotate}
										className="w-3.5"
									/>
								)
							}
							variant="flat"
							onPress={handleRefreshGrants}
						>
							刷新
						</Button>
					</>
				}
			>
				授权用户
			</AdminPanelToolbar>
			<div className="mb-4 grid gap-3 rounded-small border border-default-200/80 bg-default/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
				<AdminMetric
					label="授权用户"
					value={createMetricValue(
						grantTotalCount ?? null,
						isGrantLoading
					)}
				/>
				<AdminMetric
					label="未消费ticket"
					value={createMetricValue(
						summary.pendingTickets,
						isSummaryLoading
					)}
				/>
				<AdminMetric
					label="Callback队列"
					value={createMetricValue(
						summary.callbackQueue,
						isSummaryLoading
					)}
				/>
				<AdminMetric
					label="审计记录"
					value={createMetricValue(
						summary.auditLogs,
						isSummaryLoading
					)}
				/>
			</div>
			{grants.length === 0 ? (
				<AdminEmptyState icon={faUsers}>
					{isGrantLoading ? '读取中' : '暂无授权用户'}
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<AdminTableHeadCell>用户</AdminTableHeadCell>
							<AdminTableHeadCell>状态</AdminTableHeadCell>
							<AdminTableHeadCell>授权时间</AdminTableHeadCell>
							<AdminTableHeadCell>最近刷新</AdminTableHeadCell>
							<AdminTableHeadCell className="text-right">
								操作
							</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>{grantRows}</tbody>
				</AdminTable>
			)}
			<AdminPagination
				currentPage={grantPage}
				isLoading={isGrantLoading}
				pageInput={grantPageInput}
				totalLabel="个授权用户"
				totalPages={grantTotalPages}
				{...(grantPageSize === undefined
					? {}
					: { pageSize: grantPageSize })}
				{...(grantTotalCount === undefined
					? {}
					: { totalCount: grantTotalCount })}
				onNextPage={handleNextGrantPage}
				onPageInputChange={handleGrantPageInputChange}
				onPageJumpSubmit={handleGrantPageJumpSubmit}
				onPreviousPage={handlePreviousGrantPage}
			/>
		</AdminPanel>
	);
});
