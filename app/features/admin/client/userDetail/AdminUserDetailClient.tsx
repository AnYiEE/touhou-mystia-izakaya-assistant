'use client';

import {
	faArrowLeft,
	faClipboardList,
	faClock,
	faRotate,
	faShieldHalved,
	faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from '@/design/ui/components/button';

import {
	AdminEmptyState,
	AdminLoadingState,
	AdminMessage,
} from '@/features/admin/client/components/feedback';
import { AdminPanel } from '@/features/admin/client/components/panels';
import {
	AdminHeader,
	AdminHeaderActionLink,
	AdminShell,
} from '@/features/admin/client/components/shell';
import { createAdminUserDisplayName } from '@/features/admin/client/components/userPresentation';
import type { IAdminUserDetailInitialData } from '@/features/admin/contracts';
import {
	ADMIN_MESSAGE_MAP,
	ADMIN_STATUS_LABEL_MAP,
} from '@/features/admin/copy';
import { trackEvent } from '@/features/analytics/client/trackEvent';

import { BackupImportsPanel } from './BackupImportsPanel';
import { PasskeysPanel } from './PasskeysPanel';
import { SsoGrantCallbackNotice, SsoGrantsPanel } from './SsoGrantsPanel';
import { SyncNamespacesPanel } from './SyncNamespacesPanel';
import { UserAccountActions } from './UserAccountActions';
import { UserIdentityMetrics, UserOverviewMetrics } from './UserMetrics';
import { useAdminUserDetailController } from './useAdminUserDetailController';

interface IAdminUserDetailClientProps {
	initialData: IAdminUserDetailInitialData;
}

export default function AdminUserDetailClient({
	initialData,
}: IAdminUserDetailClientProps) {
	const {
		admin,
		adminListHref,
		confirmAction,
		detail,
		handleClearUserData,
		handleDeleteUserSessions,
		handleDisableUser,
		handleEnableUser,
		handleNextSsoGrantPage,
		handlePreviousSsoGrantPage,
		handleRefreshDetail,
		handleResetPassword,
		handleRestoreUser,
		handleRevokeAllSsoGrants,
		handleRevokeSsoGrant,
		handleSsoGrantPageInputChange,
		handleSsoGrantPageJumpSubmit,
		handleSsoGrantQueryChange,
		id,
		isAuthLoading,
		isLoading,
		isRevokingAllSsoGrants,
		isSsoGrantLoading,
		message,
		password,
		revokingSsoClientId,
		setConfirmAction,
		setPassword,
		ssoGrantPage,
		ssoGrantPageInput,
		ssoGrantPageSize,
		ssoGrantQuery,
		ssoGrantTotalCount,
		ssoGrantTotalPages,
		ssoGrants,
	} = useAdminUserDetailController(initialData);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label="校验后台访问权限"
				subtitle={ADMIN_MESSAGE_MAP.adminSessionReading}
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
					subtitle={message ?? ADMIN_MESSAGE_MAP.adminSignInRequired}
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
					subtitle={ADMIN_MESSAGE_MAP.userDetailReading}
					title="用户详情"
				/>
				{message !== null && <AdminMessage message={message} />}
				<AdminEmptyState icon={faClock}>
					{ADMIN_MESSAGE_MAP.userDetailWaiting}
				</AdminEmptyState>
			</AdminShell>
		);
	}

	if (detail.user.id !== id) {
		return (
			<AdminShell>
				<AdminHeader
					icon={faUser}
					subtitle={ADMIN_MESSAGE_MAP.userDetailTargetSwitching}
					title="用户详情"
				/>
				<AdminPanel className="flex items-center gap-3 text-small text-foreground-500">
					<Button isLoading={isLoading} variant="flat">
						{ADMIN_STATUS_LABEL_MAP.loading}
					</Button>
					<span>{ADMIN_MESSAGE_MAP.userDetailTargetSyncing}</span>
				</AdminPanel>
			</AdminShell>
		);
	}

	const {
		backup_imports: backupImports,
		has_password: hasPassword,
		namespaces,
		passkeys,
		session_count: sessionCount,
		user,
	} = detail;
	const {
		created_at: createdAt,
		id: userId,
		last_login_at: lastLoginAt,
		state_epoch: stateEpoch,
		status: userStatus,
	} = user;
	const userDisplayName = createAdminUserDisplayName(user);
	const initialNowTimestamp = initialData.renderedAt;
	const userAuditHref = `/admin/audit?scope=account&target_type=user&target_id=${encodeURIComponent(userId)}`;

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
				title={userDisplayName}
			/>

			<UserOverviewMetrics
				hasPassword={hasPassword}
				initialNowTimestamp={initialNowTimestamp}
				namespaces={namespaces}
				passkeys={passkeys}
				sessionCount={sessionCount}
				stateEpoch={stateEpoch}
				userStatus={userStatus}
			/>

			<UserAccountActions
				confirmAction={confirmAction}
				isLoading={isLoading}
				password={password}
				userStatus={userStatus}
				onClearUserData={handleClearUserData}
				onConfirmActionChange={setConfirmAction}
				onDeleteUserSessions={handleDeleteUserSessions}
				onDisableUser={handleDisableUser}
				onEnableUser={handleEnableUser}
				onPasswordChange={setPassword}
				onResetPassword={handleResetPassword}
				onRestoreUser={handleRestoreUser}
			/>

			{message !== null && <AdminMessage message={message} />}
			<SsoGrantCallbackNotice
				ssoGrantTotalCount={ssoGrantTotalCount}
				userStatus={userStatus}
			/>

			<UserIdentityMetrics
				createdAt={createdAt}
				initialNowTimestamp={initialNowTimestamp}
				lastLoginAt={lastLoginAt}
				userId={userId}
			/>

			<SyncNamespacesPanel
				initialNowTimestamp={initialNowTimestamp}
				namespaces={namespaces}
			/>

			<PasskeysPanel
				initialNowTimestamp={initialNowTimestamp}
				passkeys={passkeys}
			/>

			<SsoGrantsPanel
				confirmAction={confirmAction}
				initialNowTimestamp={initialNowTimestamp}
				isRevokingAllSsoGrants={isRevokingAllSsoGrants}
				isSsoGrantLoading={isSsoGrantLoading}
				revokingSsoClientId={revokingSsoClientId}
				ssoGrantPage={ssoGrantPage}
				ssoGrantPageInput={ssoGrantPageInput}
				ssoGrantPageSize={ssoGrantPageSize}
				ssoGrantQuery={ssoGrantQuery}
				ssoGrants={ssoGrants}
				ssoGrantTotalCount={ssoGrantTotalCount}
				ssoGrantTotalPages={ssoGrantTotalPages}
				onConfirmActionChange={setConfirmAction}
				onNextPage={handleNextSsoGrantPage}
				onPageInputChange={handleSsoGrantPageInputChange}
				onPageJumpSubmit={handleSsoGrantPageJumpSubmit}
				onPreviousPage={handlePreviousSsoGrantPage}
				onQueryChange={handleSsoGrantQueryChange}
				onRevokeAll={handleRevokeAllSsoGrants}
				onRevokeOne={handleRevokeSsoGrant}
			/>

			<BackupImportsPanel
				backupImports={backupImports}
				initialNowTimestamp={initialNowTimestamp}
			/>
		</AdminShell>
	);
}
