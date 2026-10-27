'use client';

import {
	faLayerGroup,
	faPlus,
	faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { type SyntheticEvent, useCallback, useState } from 'react';

import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';
import TimeAgo from '@/design/ui/components/timeAgo';

import type { IAdminMeData } from '@/features/account/contracts';
import { AccessAdminNavigation } from '@/features/featureAccess/admin/client/AccessAdminNavigation';
import {
	createAdminFeatureGroup,
	deleteAdminFeatureGroup,
} from '@/features/featureAccess/admin/client/api';
import { FEATURE_ACCESS_ADMIN_MESSAGE_MAP } from '@/features/featureAccess/admin/client/copy';
import {
	FEATURE_ACCESS_GROUP_DESCRIPTION_MAX_LENGTH,
	FEATURE_ACCESS_GROUP_NAME_MAX_LENGTH,
	type IAdminFeatureAccessGroupListData,
	type IAdminFeatureAccessGroupRecord,
} from '@/features/featureAccess/contracts';
import { AdminConfirmButton } from '@/features/admin/client/components/confirmation';
import {
	AdminEmptyState,
	AdminMessage,
} from '@/features/admin/client/components/feedback';
import {
	AdminPanel,
	AdminPanelTitle,
} from '@/features/admin/client/components/panels';
import {
	AdminHeader,
	AdminShell,
} from '@/features/admin/client/components/shell';
import {
	AdminTable,
	AdminTableActionLink,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '@/features/admin/client/components/table';

export function AccessGroupsClient({
	admin,
	initialData,
}: {
	admin: IAdminMeData;
	initialData: IAdminFeatureAccessGroupListData;
}) {
	const router = useRouter();
	const [groups, setGroups] = useState(initialData.groups);
	const [description, setDescription] = useState('');
	const [name, setName] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [openDeleteAction, setOpenDeleteAction] = useState<string | null>(
		null
	);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handleCreate = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (isCreating || name.trim() === '') {
				return;
			}
			setIsCreating(true);
			setMessage(null);
			void createAdminFeatureGroup(
				{ description, module_keys: [], name, user_ids: [] },
				admin.csrf_token
			)
				.then((result) => {
					if (result.status === 'error') {
						setMessage(result.displayMessage);
						return;
					}
					setName('');
					setDescription('');
					setMessage(FEATURE_ACCESS_ADMIN_MESSAGE_MAP.groupCreated);
					router.push(
						`/admin/access/groups/${encodeURIComponent(result.data.id)}`
					);
				})
				.catch(() => {
					setMessage(
						FEATURE_ACCESS_ADMIN_MESSAGE_MAP.groupCreateFailed
					);
				})
				.finally(() => {
					setIsCreating(false);
				});
		},
		[admin.csrf_token, description, isCreating, name, router]
	);

	const handleDelete = useCallback(
		(group: IAdminFeatureAccessGroupRecord) => {
			if (deletingId !== null) {
				return;
			}
			setDeletingId(group.id);
			setMessage(null);
			void deleteAdminFeatureGroup(group.id, admin.csrf_token)
				.then((result) => {
					if (result.status === 'error') {
						setMessage(result.displayMessage);
						return;
					}
					setGroups((current) =>
						current.filter(({ id }) => id !== group.id)
					);
					setOpenDeleteAction(null);
					setMessage(FEATURE_ACCESS_ADMIN_MESSAGE_MAP.groupDeleted);
				})
				.catch(() => {
					setMessage(
						FEATURE_ACCESS_ADMIN_MESSAGE_MAP.groupDeleteFailed
					);
				})
				.finally(() => {
					setDeletingId(null);
				});
		},
		[admin.csrf_token, deletingId]
	);

	return (
		<AdminShell>
			<AdminHeader
				icon={faLayerGroup}
				subtitle="将多个功能模块组合为可复用的授权组"
				title="授权组"
			/>
			<AccessAdminNavigation />
			<AdminPanel>
				<AdminPanelTitle icon={faPlus}>新建授权组</AdminPanelTitle>
				<form
					className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_minmax(16rem,2fr)_auto] md:items-end"
					onSubmit={handleCreate}
				>
					<Input
						isDisabled={isCreating}
						isRequired
						label="名称"
						maxLength={FEATURE_ACCESS_GROUP_NAME_MAX_LENGTH}
						value={name}
						onValueChange={setName}
					/>
					<Input
						isDisabled={isCreating}
						label="说明"
						maxLength={FEATURE_ACCESS_GROUP_DESCRIPTION_MAX_LENGTH}
						value={description}
						onValueChange={setDescription}
					/>
					<Button
						color="primary"
						isDisabled={isCreating || name.trim() === ''}
						isLoading={isCreating}
						type="submit"
						variant="flat"
					>
						创建
					</Button>
				</form>
			</AdminPanel>
			{message !== null && <AdminMessage message={message} />}
			{groups.length === 0 ? (
				<AdminEmptyState icon={faLayerGroup}>
					暂无授权组
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<AdminTableRow>
							<AdminTableHeadCell>授权组</AdminTableHeadCell>
							<AdminTableHeadCell>模块数</AdminTableHeadCell>
							<AdminTableHeadCell>成员数</AdminTableHeadCell>
							<AdminTableHeadCell>更新时间</AdminTableHeadCell>
							<AdminTableHeadCell className="text-right">
								操作
							</AdminTableHeadCell>
						</AdminTableRow>
					</AdminTableHeader>
					<tbody>
						{groups.map((group) => (
							<AdminTableRow key={group.id}>
								<AdminTableCell>
									<div className="min-w-48 max-w-80">
										<p className="break-words font-medium">
											{group.name}
										</p>
										<p className="break-words text-tiny text-foreground-500">
											{group.description || '无说明'}
										</p>
									</div>
								</AdminTableCell>
								<AdminTableCell isNowrap>
									{group.module_count}
								</AdminTableCell>
								<AdminTableCell isNowrap>
									{group.member_count}
								</AdminTableCell>
								<AdminTableCell isNowrap>
									<TimeAgo timestamp={group.updated_at} />
								</AdminTableCell>
								<AdminTableCell isNowrap className="text-right">
									<div className="flex items-center justify-end gap-2">
										<AdminTableActionLink
											href={`/admin/access/groups/${encodeURIComponent(group.id)}`}
										>
											编辑
										</AdminTableActionLink>
										<AdminConfirmButton
											color="danger"
											confirmAction={group.id}
											confirmLabel={
												FEATURE_ACCESS_ADMIN_MESSAGE_MAP.groupDeleteConfirm
											}
											icon={faTrash}
											isDisabled={
												deletingId !== null ||
												isCreating
											}
											isLoading={deletingId === group.id}
											openAction={openDeleteAction}
											size="sm"
											onConfirm={() => {
												handleDelete(group);
											}}
											onOpenChange={setOpenDeleteAction}
										>
											删除
										</AdminConfirmButton>
									</div>
								</AdminTableCell>
							</AdminTableRow>
						))}
					</tbody>
				</AdminTable>
			)}
		</AdminShell>
	);
}
