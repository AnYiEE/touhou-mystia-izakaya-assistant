'use client';

import { faClock, faUsers } from '@fortawesome/free-solid-svg-icons';
import { memo } from 'react';

import TimeAgo from '@/design/ui/components/timeAgo';

import type { IAdminUserListData } from '@/features/account/contracts';
import { AdminEmptyState } from '@/features/admin/client/components/feedback';
import { AdminMutedText } from '@/features/admin/client/components/panels';
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
import type { IAdminListLocationState } from '@/features/admin/contracts';
import { ADMIN_MESSAGE_MAP } from '@/features/admin/copy';
import { getAdminUserDetailHref } from '@/features/admin/navigation';

interface IAdminUserListRowProps {
	initialNowTimestamp: number;
	listLocationState: IAdminListLocationState;
	onOpenUserDetail: () => void;
	user: IAdminUserListData['users'][number];
}

const AdminUserListRow = memo<IAdminUserListRowProps>(
	function AdminUserListRow({
		initialNowTimestamp,
		listLocationState,
		onOpenUserDetail,
		user,
	}) {
		return (
			<AdminTableRow>
				<AdminTableCell className="w-72 max-w-72">
					<AdminEntityCell
						className="max-w-64"
						id={user.id}
						title={createAdminUserDisplayName(user)}
					/>
				</AdminTableCell>
				<AdminTableCell isNowrap>
					<AdminStatusBadge status={user.status} />
				</AdminTableCell>
				<AdminTableCell isNowrap>
					<TimeAgo
						initialNowTimestamp={initialNowTimestamp}
						timestamp={user.created_at}
					/>
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{user.last_login_at === null ? (
						<AdminMutedText>无</AdminMutedText>
					) : (
						<TimeAgo
							initialNowTimestamp={initialNowTimestamp}
							timestamp={user.last_login_at}
						/>
					)}
				</AdminTableCell>
				<AdminTableCell isNowrap className="text-right">
					<AdminTableActionLink
						href={getAdminUserDetailHref(
							user.id,
							listLocationState
						)}
						onPress={onOpenUserDetail}
					>
						详情
					</AdminTableActionLink>
				</AdminTableCell>
			</AdminTableRow>
		);
	}
);

interface IAdminUserTableProps {
	initialNowTimestamp: number;
	listLocationState: IAdminListLocationState;
	onOpenUserDetail: () => void;
	users: IAdminUserListData;
}

const AdminUserTable = memo<IAdminUserTableProps>(function AdminUserTable({
	initialNowTimestamp,
	listLocationState,
	onOpenUserDetail,
	users,
}) {
	return (
		<AdminTable>
			<AdminTableHeader>
				<tr>
					<AdminTableHeadCell>用户名</AdminTableHeadCell>
					<AdminTableHeadCell>状态</AdminTableHeadCell>
					<AdminTableHeadCell>创建时间</AdminTableHeadCell>
					<AdminTableHeadCell>最近登录</AdminTableHeadCell>
					<AdminTableHeadCell className="text-right">
						操作
					</AdminTableHeadCell>
				</tr>
			</AdminTableHeader>
			<tbody>
				{users.users.map((user) => (
					<AdminUserListRow
						key={user.id}
						initialNowTimestamp={initialNowTimestamp}
						listLocationState={listLocationState}
						onOpenUserDetail={onOpenUserDetail}
						user={user}
					/>
				))}
			</tbody>
		</AdminTable>
	);
});

interface IAdminUserListContentProps {
	initialNowTimestamp: number;
	listLocationState: IAdminListLocationState;
	onOpenUserDetail: () => void;
	users: IAdminUserListData | null;
}

export const AdminUserListContent = memo<IAdminUserListContentProps>(
	function AdminUserListContent({
		initialNowTimestamp,
		listLocationState,
		onOpenUserDetail,
		users,
	}) {
		if (users === null) {
			return (
				<AdminEmptyState icon={faClock}>
					{ADMIN_MESSAGE_MAP.userListReading}
				</AdminEmptyState>
			);
		}

		if (users.users.length === 0) {
			return (
				<AdminEmptyState icon={faUsers}>没有匹配的用户</AdminEmptyState>
			);
		}

		return (
			<AdminUserTable
				initialNowTimestamp={initialNowTimestamp}
				listLocationState={listLocationState}
				onOpenUserDetail={onOpenUserDetail}
				users={users}
			/>
		);
	}
);
