'use client';

import {
	faArrowRightFromBracket,
	faBullhorn,
	faClipboardList,
	faServer,
	faShieldHalved,
	faUser,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from '@/design/ui/components/button';

import {
	AdminErrorRetryState,
	AdminLoadingState,
	AdminMessage,
} from '@/features/admin/client/components/feedback';
import { AdminPagination } from '@/features/admin/client/components/pagination';
import {
	AdminPanel,
	AdminPanelTitle,
} from '@/features/admin/client/components/panels';
import {
	AdminHeader,
	AdminHeaderActionLink,
	AdminShell,
} from '@/features/admin/client/components/shell';
import type { IAdminPageInitialData } from '@/features/admin/contracts';
import {
	ADMIN_MESSAGE_MAP,
	ADMIN_STATUS_LABEL_MAP,
} from '@/features/admin/copy';
import { trackEvent } from '@/features/analytics/client/trackEvent';

import { AdminLoginPanel } from './AdminLoginPanel';
import {
	AdminUserFilterPanel,
	getFilterStatusLabel,
	getStatusFilterKey,
} from './AdminUserFilters';
import { AdminUserMetrics } from './AdminUserMetrics';
import { AdminUserListContent } from './AdminUserTable';
import { useAdminUsersController } from './useAdminUsersController';

export default function AdminUsersClient({
	initialData,
}: {
	initialData: IAdminPageInitialData;
}) {
	const {
		admin,
		adminAuthStatus,
		checkAdminAuth,
		handleLeaveUserList,
		handleLogin,
		handleLogout,
		handleNextPage,
		handleOpenSsoClientList,
		handleOpenUserDetail,
		handlePageInputChange,
		handlePageJumpSubmit,
		handlePreviousPage,
		handleQueryInputChange,
		handleRefreshPress,
		handleStatusAction,
		isAdminActionLoading,
		isUsersLoading,
		message,
		page,
		pageInput,
		password,
		query,
		queryInput,
		setPassword,
		setUsername,
		status,
		trimmedUsername,
		username,
		users,
	} = useAdminUsersController(initialData);

	if (admin === null) {
		if (adminAuthStatus === 'checking') {
			return (
				<AdminLoadingState
					icon={faShieldHalved}
					label={ADMIN_STATUS_LABEL_MAP.sessionReading}
					subtitle={ADMIN_MESSAGE_MAP.adminSessionChecking}
					title="管理员"
				/>
			);
		}

		if (adminAuthStatus === 'error') {
			return (
				<AdminErrorRetryState
					icon={faShieldHalved}
					message={message}
					subtitle={ADMIN_MESSAGE_MAP.adminSessionCheckFailed}
					title="管理员"
					onRetry={checkAdminAuth}
				/>
			);
		}

		return (
			<AdminShell>
				<AdminHeader
					icon={faShieldHalved}
					subtitle="账号后台控制台"
					title={
						initialData.credentialLoginEnabled
							? '管理员登录'
							: '管理员入口'
					}
				/>
				{initialData.credentialLoginEnabled ? (
					<AdminLoginPanel
						isAdminActionLoading={isAdminActionLoading}
						message={message}
						password={password}
						trimmedUsername={trimmedUsername}
						username={username}
						onLogin={handleLogin}
						onPasswordChange={setPassword}
						onUsernameChange={setUsername}
					/>
				) : (
					<AdminPanel>
						<AdminPanelTitle icon={faUser}>
							管理员用户ID
						</AdminPanelTitle>
						<p className="text-small">
							请先登录已加入管理员用户ID白名单的普通账号，然后重新访问当前页面。
						</p>
						{message !== null && <AdminMessage message={message} />}
					</AdminPanel>
				)}
			</AdminShell>
		);
	}

	const userCount = users?.users.length ?? 0;
	const pageSize = users?.page_size ?? 0;
	const totalCount = users?.total_count ?? null;
	const totalPages = users?.total_pages ?? null;
	const listLocationState = { page, query, status };
	const statusFilterKey = getStatusFilterKey(status);
	const statusFilterLabel = getFilterStatusLabel(status);

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<AdminHeaderActionLink
							href="/admin/announcements"
							icon={faBullhorn}
							onPress={handleLeaveUserList}
						>
							站点通知
						</AdminHeaderActionLink>
						<AdminHeaderActionLink
							href="/admin/sso"
							icon={faServer}
							onPress={handleOpenSsoClientList}
						>
							SSO客户端
						</AdminHeaderActionLink>
						<AdminHeaderActionLink
							href="/admin/audit?scope=account"
							icon={faClipboardList}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Admin Audit Button',
									'Open Account Audit'
								);
							}}
						>
							审计日志
						</AdminHeaderActionLink>
						{admin.auth_source === 'credentials' && (
							<Button
								isDisabled={isAdminActionLoading}
								isLoading={isAdminActionLoading}
								startContent={
									isAdminActionLoading ? null : (
										<FontAwesomeIcon
											icon={faArrowRightFromBracket}
											className="w-3.5"
										/>
									)
								}
								variant="flat"
								onPress={handleLogout}
							>
								退出管理员
							</Button>
						)}
					</>
				}
				icon={faUsers}
				title="用户管理"
			/>

			<AdminUserMetrics
				page={page}
				pageSize={pageSize}
				statusFilterLabel={statusFilterLabel}
				totalCount={totalCount}
				totalPages={totalPages}
				userCount={userCount}
				users={users}
			/>

			<AdminUserFilterPanel
				isUsersLoading={isUsersLoading}
				queryInput={queryInput}
				statusFilterKey={statusFilterKey}
				statusFilterLabel={statusFilterLabel}
				onQueryInputChange={handleQueryInputChange}
				onRefresh={handleRefreshPress}
				onStatusAction={handleStatusAction}
			/>

			{message !== null && <AdminMessage message={message} />}

			<AdminUserListContent
				initialNowTimestamp={initialData.renderedAt}
				listLocationState={listLocationState}
				onOpenUserDetail={handleOpenUserDetail}
				users={users}
			/>

			<AdminPagination
				currentPage={users?.page ?? page}
				isLoading={isUsersLoading}
				pageInput={pageInput}
				pageSize={users?.page_size}
				totalCount={users?.total_count}
				totalLabel="个用户"
				totalPages={Math.max(1, users?.total_pages ?? page)}
				onNextPage={handleNextPage}
				onPageInputChange={handlePageInputChange}
				onPageJumpSubmit={handlePageJumpSubmit}
				onPreviousPage={handlePreviousPage}
			/>
		</AdminShell>
	);
}
