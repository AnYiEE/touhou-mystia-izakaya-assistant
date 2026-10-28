'use client';

import {
	faClock,
	faFloppyDisk,
	faLayerGroup,
	faMagnifyingGlass,
	faPlus,
	faTrash,
	faUser,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';

import { type TFeatureModuleKey } from '@/domain/featureAccess/contracts';

import type {
	IAdminMeData,
	IAdminUserListData,
} from '@/features/account/contracts';
import { listAdminUsers } from '@/features/admin/client/api';
import { AdminConfirmButton } from '@/features/admin/client/components/confirmation';
import {
	AdminEmptyState,
	AdminMessage,
} from '@/features/admin/client/components/feedback';
import {
	ADMIN_LIST_DEBOUNCE_MS,
	AdminSearchInput,
} from '@/features/admin/client/components/filters';
import {
	AdminPanel,
	AdminPanelTitle,
	AdminPanelToolbar,
} from '@/features/admin/client/components/panels';
import {
	AdminHeader,
	AdminHeaderActionButton,
	AdminShell,
} from '@/features/admin/client/components/shell';
import {
	AdminBadge,
	AdminStatusBadge,
} from '@/features/admin/client/components/statusBadges';
import {
	AdminEntityCell,
	AdminTable,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '@/features/admin/client/components/table';
import { createAdminUserDisplayName } from '@/features/admin/client/components/userPresentation';
import { AccessAdminNavigation } from '@/features/featureAccess/admin/client/AccessAdminNavigation';
import {
	deleteAdminFeatureGroup,
	updateAdminFeatureGroup,
} from '@/features/featureAccess/admin/client/api';
import { FEATURE_ACCESS_ADMIN_MESSAGE_MAP } from '@/features/featureAccess/admin/client/copy';
import {
	FEATURE_ACCESS_GROUP_DESCRIPTION_MAX_LENGTH,
	FEATURE_ACCESS_GROUP_NAME_MAX_LENGTH,
	type IAdminFeatureAccessGroupDetailData,
	type IAdminFeatureModuleListData,
} from '@/features/featureAccess/contracts';

type TAdminUser = IAdminUserListData['users'][number];

function checkStringSetsEqual(
	left: ReadonlySet<string>,
	right: ReadonlyArray<string>
) {
	return (
		left.size === right.length && right.every((value) => left.has(value))
	);
}

function appendUniqueUsers(
	current: IAdminUserListData,
	next: IAdminUserListData
) {
	const userMap = new Map(
		[...current.users, ...next.users].map((user) => [user.id, user])
	);
	return { ...next, users: [...userMap.values()] };
}

export function AccessGroupDetailClient({
	admin,
	initialData,
	modules,
}: {
	admin: IAdminMeData;
	initialData: IAdminFeatureAccessGroupDetailData;
	modules: IAdminFeatureModuleListData;
}) {
	const router = useRouter();
	const [detail, setDetail] = useState(initialData);
	const [description, setDescription] = useState(
		initialData.group.description
	);
	const [name, setName] = useState(initialData.group.name);
	const [moduleKeys, setModuleKeys] = useState(
		() => new Set(initialData.module_keys)
	);
	const [userIds, setUserIds] = useState(
		() => new Set(initialData.members.map(({ id }) => id))
	);
	const [pendingUsers, setPendingUsers] = useState(
		() => new Map<string, TAdminUser>()
	);
	const [memberQuery, setMemberQuery] = useState('');
	const [memberResults, setMemberResults] =
		useState<IAdminUserListData | null>(null);
	const [isMemberSearching, setIsMemberSearching] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [openDeleteAction, setOpenDeleteAction] = useState<string | null>(
		null
	);
	const memberSearchRequestIdRef = useRef(0);

	const isBusy = isSaving || isDeleting;
	const trimmedMemberQuery = useMemo(() => memberQuery.trim(), [memberQuery]);
	const existingMemberIds = useMemo(
		() => new Set(detail.members.map(({ id }) => id)),
		[detail.members]
	);
	const selectedExistingMembers = useMemo(
		() => detail.members.filter(({ id }) => userIds.has(id)),
		[detail.members, userIds]
	);
	const selectedPendingUserIds = useMemo(
		() => [...userIds].filter((userId) => !existingMemberIds.has(userId)),
		[existingMemberIds, userIds]
	);
	const isNameValid =
		name.trim().length > 0 &&
		name.trim().length <= FEATURE_ACCESS_GROUP_NAME_MAX_LENGTH;
	const isDirty = useMemo(
		() =>
			name.trim() !== detail.group.name ||
			description.trim() !== detail.group.description ||
			!checkStringSetsEqual(moduleKeys, detail.module_keys) ||
			!checkStringSetsEqual(
				userIds,
				detail.members.map(({ id }) => id)
			),
		[
			description,
			detail.group.description,
			detail.group.name,
			detail.members,
			detail.module_keys,
			moduleKeys,
			name,
			userIds,
		]
	);
	const visibleMemberResults = useMemo(
		() =>
			memberResults?.users.filter((user) => !userIds.has(user.id)) ?? [],
		[memberResults, userIds]
	);
	const hasMoreMemberResults =
		memberResults !== null &&
		memberResults.page < memberResults.total_pages;

	const handleModuleToggle = useCallback(
		(moduleKey: TFeatureModuleKey) => {
			if (isBusy) {
				return;
			}
			setMessage(null);
			setModuleKeys((current) => {
				const next = new Set(current);
				if (next.has(moduleKey)) {
					next.delete(moduleKey);
				} else {
					next.add(moduleKey);
				}
				return next;
			});
		},
		[isBusy]
	);

	const handleAddUser = useCallback(
		(user: TAdminUser) => {
			setMessage(null);
			setUserIds((current) => new Set(current).add(user.id));
			if (!existingMemberIds.has(user.id)) {
				setPendingUsers((current) => {
					const next = new Map(current);
					next.set(user.id, user);
					return next;
				});
			}
		},
		[existingMemberIds]
	);

	const handleMemberQueryChange = useCallback((value: string) => {
		memberSearchRequestIdRef.current += 1;
		setIsMemberSearching(false);
		setMessage(null);
		setMemberQuery(value);
		setMemberResults(null);
	}, []);

	const handleRemoveUser = useCallback((userId: string) => {
		setMessage(null);
		setUserIds((current) => {
			const next = new Set(current);
			next.delete(userId);
			return next;
		});
		setPendingUsers((current) => {
			if (!current.has(userId)) {
				return current;
			}
			const next = new Map(current);
			next.delete(userId);
			return next;
		});
	}, []);

	const handleSearchMembers = useCallback(
		(page = 1) => {
			const query = trimmedMemberQuery;
			if (query === '' || isBusy) {
				return;
			}
			const requestId = memberSearchRequestIdRef.current + 1;
			memberSearchRequestIdRef.current = requestId;
			setIsMemberSearching(true);
			setMessage(null);
			if (page === 1) {
				setMemberResults(null);
			}
			void listAdminUsers({ page, query })
				.then((result) => {
					if (requestId !== memberSearchRequestIdRef.current) {
						return;
					}
					if (result.status === 'error') {
						setMessage(result.displayMessage);
						return;
					}
					setMemberResults((current) =>
						page === 1 || current === null
							? result.data
							: appendUniqueUsers(current, result.data)
					);
				})
				.catch(() => {
					if (requestId === memberSearchRequestIdRef.current) {
						setMessage(
							FEATURE_ACCESS_ADMIN_MESSAGE_MAP.usersReadFailed
						);
					}
				})
				.finally(() => {
					if (requestId === memberSearchRequestIdRef.current) {
						setIsMemberSearching(false);
					}
				});
		},
		[isBusy, trimmedMemberQuery]
	);

	useEffect(() => {
		if (trimmedMemberQuery === '' || isBusy) {
			return;
		}

		const timeoutId = setTimeout(() => {
			handleSearchMembers();
		}, ADMIN_LIST_DEBOUNCE_MS);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [handleSearchMembers, isBusy, trimmedMemberQuery]);

	useEffect(
		() => () => {
			memberSearchRequestIdRef.current += 1;
		},
		[]
	);

	const handleSave = useCallback(() => {
		if (isBusy || !isNameValid || !isDirty) {
			return;
		}
		setIsSaving(true);
		setMessage(null);
		void updateAdminFeatureGroup(
			detail.group.id,
			{
				description: description.trim(),
				module_keys: [...moduleKeys],
				name: name.trim(),
				user_ids: [...userIds],
			},
			admin.csrf_token
		)
			.then((result) => {
				if (result.status === 'error') {
					setMessage(result.displayMessage);
					return;
				}
				setDetail(result.data);
				setDescription(result.data.group.description);
				setName(result.data.group.name);
				setModuleKeys(new Set(result.data.module_keys));
				setUserIds(new Set(result.data.members.map(({ id }) => id)));
				setPendingUsers(new Map());
				setMemberQuery('');
				setMemberResults(null);
				setMessage(FEATURE_ACCESS_ADMIN_MESSAGE_MAP.groupSaved);
			})
			.catch(() => {
				setMessage(FEATURE_ACCESS_ADMIN_MESSAGE_MAP.groupSaveFailed);
			})
			.finally(() => {
				setIsSaving(false);
			});
	}, [
		admin.csrf_token,
		description,
		detail.group.id,
		isBusy,
		isDirty,
		isNameValid,
		moduleKeys,
		name,
		userIds,
	]);

	const handleDelete = useCallback(() => {
		if (isBusy) {
			return;
		}
		setIsDeleting(true);
		setMessage(null);
		void deleteAdminFeatureGroup(detail.group.id, admin.csrf_token)
			.then((result) => {
				if (result.status === 'error') {
					setMessage(result.displayMessage);
					return;
				}
				router.push('/admin/access/groups');
			})
			.catch(() => {
				setMessage(FEATURE_ACCESS_ADMIN_MESSAGE_MAP.groupDeleteFailed);
			})
			.finally(() => {
				setIsDeleting(false);
			});
	}, [admin.csrf_token, detail.group.id, isBusy, router]);

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<AdminConfirmButton
							color="danger"
							confirmAction="delete"
							confirmLabel={
								FEATURE_ACCESS_ADMIN_MESSAGE_MAP.groupDeleteConfirm
							}
							icon={faTrash}
							isDisabled={isBusy}
							isLoading={isDeleting}
							openAction={openDeleteAction}
							onConfirm={handleDelete}
							onOpenChange={setOpenDeleteAction}
						>
							删除授权组
						</AdminConfirmButton>
						<AdminHeaderActionButton
							color="primary"
							icon={faFloppyDisk}
							isDisabled={!isDirty || !isNameValid || isBusy}
							isLoading={isSaving}
							onPress={handleSave}
						>
							保存
						</AdminHeaderActionButton>
					</>
				}
				icon={faLayerGroup}
				subtitle={detail.group.name}
				title="编辑授权组"
			/>
			<AccessAdminNavigation />
			{message !== null && <AdminMessage message={message} />}
			<form
				className="space-y-5"
				onSubmit={(event) => {
					event.preventDefault();
					handleSave();
				}}
			>
				<AdminPanel className="space-y-3">
					<AdminPanelTitle icon={faLayerGroup}>
						基本信息
					</AdminPanelTitle>
					<div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_minmax(20rem,2fr)]">
						<Input
							isDisabled={isBusy}
							isRequired
							label="名称"
							maxLength={FEATURE_ACCESS_GROUP_NAME_MAX_LENGTH}
							value={name}
							onValueChange={(value) => {
								setMessage(null);
								setName(value);
							}}
						/>
						<Input
							isDisabled={isBusy}
							label="说明"
							maxLength={
								FEATURE_ACCESS_GROUP_DESCRIPTION_MAX_LENGTH
							}
							value={description}
							onValueChange={(value) => {
								setMessage(null);
								setDescription(value);
							}}
						/>
					</div>
				</AdminPanel>

				<AdminPanel>
					<AdminPanelTitle icon={faPlus}>组内模块</AdminPanelTitle>
					<div className="grid gap-2 md:grid-cols-2">
						{modules.modules.map((module) => (
							<label
								key={module.key}
								className="flex min-w-0 items-start gap-2 rounded-medium border border-default-200 p-3 text-small"
							>
								<span className="flex h-7 shrink-0 items-center">
									<input
										checked={moduleKeys.has(module.key)}
										disabled={
											isBusy || !module.is_available
										}
										type="checkbox"
										onChange={() => {
											handleModuleToggle(module.key);
										}}
									/>
								</span>
								<span className="min-w-0 flex-1">
									<span className="flex flex-wrap items-center gap-2 font-medium">
										<span className="text-pretty break-words">
											{module.label}
										</span>
										<AdminBadge
											tone={
												module.is_available
													? 'success'
													: 'default'
											}
										>
											{module.is_available
												? '可用'
												: '已禁用'}
										</AdminBadge>
									</span>
									<span className="mt-1 block break-all font-mono text-[0.7rem] leading-4 text-foreground-400">
										{module.key}
									</span>
									<span className="mt-1 block text-tiny leading-4 text-foreground-500">
										{module.description}
									</span>
								</span>
							</label>
						))}
					</div>
				</AdminPanel>

				<AdminPanel className="space-y-3">
					<AdminPanelToolbar
						icon={faUser}
						actions={
							<AdminSearchInput
								ariaLabel="搜索要添加的用户"
								icon={faMagnifyingGlass}
								placeholder="搜索用户名、昵称或用户ID"
								value={memberQuery}
								onValueChange={handleMemberQueryChange}
							/>
						}
					>
						组成员
					</AdminPanelToolbar>

					{memberResults === null ? (
						isMemberSearching ? (
							<div className="space-y-2">
								<div className="text-small font-medium text-foreground-600">
									搜索结果
								</div>
								<AdminEmptyState icon={faClock} isLoading>
									正在搜索用户
								</AdminEmptyState>
							</div>
						) : null
					) : (
						<div className="space-y-2">
							<div className="text-small font-medium text-foreground-600">
								搜索结果
							</div>
							{memberResults.total_count === 0 ? (
								<AdminEmptyState icon={faUsers}>
									没有找到用户
								</AdminEmptyState>
							) : visibleMemberResults.length === 0 ? (
								<AdminEmptyState icon={faUsers}>
									当前结果中的用户均已添加
								</AdminEmptyState>
							) : (
								<AdminTable tableClassName="!w-full !min-w-0 table-fixed">
									<AdminTableHeader>
										<AdminTableRow>
											<AdminTableHeadCell className="w-[52%]">
												用户
											</AdminTableHeadCell>
											<AdminTableHeadCell className="w-16">
												状态
											</AdminTableHeadCell>
											<AdminTableHeadCell className="w-20 text-right">
												操作
											</AdminTableHeadCell>
										</AdminTableRow>
									</AdminTableHeader>
									<tbody>
										{visibleMemberResults.map((user) => (
											<AdminTableRow key={user.id}>
												<AdminTableCell>
													<AdminEntityCell
														className="max-w-80"
														id={user.id}
														title={createAdminUserDisplayName(
															user
														)}
													/>
												</AdminTableCell>
												<AdminTableCell isNowrap>
													<AdminStatusBadge
														status={user.status}
													/>
												</AdminTableCell>
												<AdminTableCell
													isNowrap
													className="text-right"
												>
													<Button
														isDisabled={
															isBusy ||
															user.status ===
																'deleted'
														}
														size="sm"
														type="button"
														variant="light"
														onPress={() => {
															handleAddUser(user);
														}}
													>
														添加
													</Button>
												</AdminTableCell>
											</AdminTableRow>
										))}
									</tbody>
								</AdminTable>
							)}
							{hasMoreMemberResults && (
								<Button
									isDisabled={isMemberSearching || isBusy}
									isLoading={isMemberSearching}
									type="button"
									variant="flat"
									onPress={() => {
										handleSearchMembers(
											memberResults.page + 1
										);
									}}
								>
									加载更多
								</Button>
							)}
						</div>
					)}

					<div className="text-small font-medium text-foreground-600">
						已选成员
					</div>
					{userIds.size === 0 ? (
						<AdminEmptyState icon={faUsers}>
							暂无组成员
						</AdminEmptyState>
					) : (
						<AdminTable tableClassName="!w-full !min-w-0 table-fixed">
							<AdminTableHeader>
								<AdminTableRow>
									<AdminTableHeadCell className="w-[52%]">
										用户
									</AdminTableHeadCell>
									<AdminTableHeadCell className="w-16">
										状态
									</AdminTableHeadCell>
									<AdminTableHeadCell className="w-20 text-right">
										操作
									</AdminTableHeadCell>
								</AdminTableRow>
							</AdminTableHeader>
							<tbody>
								{selectedExistingMembers.map((member) => (
									<AdminTableRow key={member.id}>
										<AdminTableCell>
											<AdminEntityCell
												className="max-w-80"
												id={member.id}
												title={createAdminUserDisplayName(
													member
												)}
											/>
										</AdminTableCell>
										<AdminTableCell isNowrap>
											<AdminStatusBadge
												status={member.status}
											/>
										</AdminTableCell>
										<AdminTableCell
											isNowrap
											className="text-right"
										>
											<Button
												color="danger"
												isDisabled={isBusy}
												size="sm"
												type="button"
												variant="light"
												onPress={() => {
													handleRemoveUser(member.id);
												}}
											>
												移除
											</Button>
										</AdminTableCell>
									</AdminTableRow>
								))}
								{selectedPendingUserIds.map((userId) => {
									const user = pendingUsers.get(userId);
									return (
										<AdminTableRow key={userId}>
											<AdminTableCell>
												<AdminEntityCell
													className="max-w-80"
													id={userId}
													title={
														user === undefined
															? userId
															: createAdminUserDisplayName(
																	user
																)
													}
												/>
											</AdminTableCell>
											<AdminTableCell isNowrap>
												{user === undefined ? (
													<AdminBadge tone="warning">
														待保存
													</AdminBadge>
												) : (
													<AdminStatusBadge
														status={user.status}
													/>
												)}
											</AdminTableCell>
											<AdminTableCell
												isNowrap
												className="text-right"
											>
												<Button
													color="danger"
													isDisabled={isBusy}
													size="sm"
													type="button"
													variant="light"
													onPress={() => {
														handleRemoveUser(
															userId
														);
													}}
												>
													移除
												</Button>
											</AdminTableCell>
										</AdminTableRow>
									);
								})}
							</tbody>
						</AdminTable>
					)}
				</AdminPanel>
			</form>
		</AdminShell>
	);
}
