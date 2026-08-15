'use client';

import {
	faSearch,
	faServer,
	faUserSlash,
} from '@fortawesome/free-solid-svg-icons';
import type { SyntheticEvent } from 'react';

import TimeAgo from '@/design/ui/components/timeAgo';

import type {
	IAdminSsoUserClientGrant,
	IAdminUserDetailData,
} from '@/features/account/contracts';
import { AdminSsoClientStatusBadge } from '@/features/account/sso/admin/client/components/statusBadges';
import { AdminConfirmButton } from '@/features/admin/client/components/confirmation';
import {
	AdminEmptyState,
	AdminMessage,
} from '@/features/admin/client/components/feedback';
import { AdminSearchInput } from '@/features/admin/client/components/filters';
import { AdminPagination } from '@/features/admin/client/components/pagination';
import {
	AdminPanel,
	AdminPanelToolbar,
} from '@/features/admin/client/components/panels';
import {
	AdminEntityCell,
	AdminTable,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '@/features/admin/client/components/table';
import {
	ADMIN_MESSAGE_MAP,
	ADMIN_STATUS_LABEL_MAP,
} from '@/features/admin/copy';

import type { TAdminUserDetailConfirmAction } from './contracts';

interface ISsoGrantCallbackNoticeProps {
	ssoGrantTotalCount: number | undefined;
	userStatus: IAdminUserDetailData['user']['status'];
}

export function SsoGrantCallbackNotice({
	ssoGrantTotalCount,
	userStatus,
}: ISsoGrantCallbackNoticeProps) {
	const ssoCallbackNotice =
		userStatus === 'disabled' && ssoGrantTotalCount !== 0
			? ADMIN_MESSAGE_MAP.ssoGrantUserDisabledCallbackNotice
			: null;

	return (
		ssoCallbackNotice !== null && (
			<AdminMessage message={ssoCallbackNotice} />
		)
	);
}

interface ISsoGrantsPanelProps {
	confirmAction: TAdminUserDetailConfirmAction;
	initialNowTimestamp: number;
	isRevokingAllSsoGrants: boolean;
	isSsoGrantLoading: boolean;
	onConfirmActionChange: (action: TAdminUserDetailConfirmAction) => void;
	onNextPage: () => void;
	onPageInputChange: (value: string) => void;
	onPageJumpSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
	onPreviousPage: () => void;
	onQueryChange: (value: string) => void;
	onRevokeAll: () => void;
	onRevokeOne: (clientId: string) => void;
	revokingSsoClientId: string | null;
	ssoGrantPage: number;
	ssoGrantPageInput: string;
	ssoGrantPageSize: number | undefined;
	ssoGrantQuery: string;
	ssoGrants: IAdminSsoUserClientGrant[];
	ssoGrantTotalCount: number | undefined;
	ssoGrantTotalPages: number;
}

export function SsoGrantsPanel({
	confirmAction,
	initialNowTimestamp,
	isRevokingAllSsoGrants,
	isSsoGrantLoading,
	onConfirmActionChange: setConfirmAction,
	onNextPage: handleNextSsoGrantPage,
	onPageInputChange: handleSsoGrantPageInputChange,
	onPageJumpSubmit: handleSsoGrantPageJumpSubmit,
	onPreviousPage: handlePreviousSsoGrantPage,
	onQueryChange: handleSsoGrantQueryChange,
	onRevokeAll: handleRevokeAllSsoGrants,
	onRevokeOne: handleRevokeSsoGrant,
	revokingSsoClientId,
	ssoGrantPage,
	ssoGrantPageInput,
	ssoGrantPageSize,
	ssoGrantQuery,
	ssoGrantTotalCount,
	ssoGrantTotalPages,
	ssoGrants,
}: ISsoGrantsPanelProps) {
	const canRevokeAllSsoGrants =
		!isRevokingAllSsoGrants &&
		revokingSsoClientId === null &&
		(ssoGrantTotalCount === undefined
			? ssoGrants.length > 0
			: ssoGrantTotalCount > 0);
	const shouldShowSsoGrantPanel =
		isSsoGrantLoading ||
		ssoGrantQuery.trim() !== '' ||
		ssoGrantTotalCount === undefined ||
		ssoGrantTotalCount > 0;
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

	if (!shouldShowSsoGrantPanel) {
		return null;
	}

	return (
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
							confirmLabel="确认撤销"
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
					{isSsoGrantLoading
						? ADMIN_STATUS_LABEL_MAP.reading
						: ADMIN_MESSAGE_MAP.ssoGrantEmpty}
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<AdminTableHeadCell>客户端</AdminTableHeadCell>
							<AdminTableHeadCell>状态</AdminTableHeadCell>
							<AdminTableHeadCell>授权时间</AdminTableHeadCell>
							<AdminTableHeadCell>最近刷新</AdminTableHeadCell>
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
	);
}
