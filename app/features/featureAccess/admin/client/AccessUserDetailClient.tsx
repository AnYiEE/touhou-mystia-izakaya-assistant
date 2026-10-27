'use client';

import {
	faFloppyDisk,
	faLayerGroup,
	faUser,
	faUserLock,
	faUserShield,
} from '@fortawesome/free-solid-svg-icons';
import { Select, SelectItem } from '@heroui/select';
import { useCallback, useMemo, useState } from 'react';

import type {
	TFeatureAccessOverrideEffect,
	TFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

import type { IAdminMeData } from '@/features/account/contracts';
import { AccessAdminNavigation } from '@/features/featureAccess/admin/client/AccessAdminNavigation';
import { updateAdminFeatureAccessUser } from '@/features/featureAccess/admin/client/api';
import {
	FEATURE_ACCESS_ADMIN_MESSAGE_MAP,
	FEATURE_ACCESS_REASON_LABEL_MAP,
	FEATURE_ACCESS_SOURCE_LABEL_MAP,
} from '@/features/featureAccess/admin/client/copy';
import type {
	IAdminFeatureAccessUserData,
	IAdminFeatureModuleListData,
} from '@/features/featureAccess/contracts';
import {
	AdminEmptyState,
	AdminMessage,
} from '@/features/admin/client/components/feedback';
import {
	AdminPanel,
	AdminPanelTitle,
	AdminPanelToolbar,
} from '@/features/admin/client/components/panels';
import {
	AdminHeader,
	AdminHeaderActionButton,
	AdminHeaderActionLink,
	AdminShell,
} from '@/features/admin/client/components/shell';
import {
	AdminBadge,
	AdminStatusBadge,
} from '@/features/admin/client/components/statusBadges';
import {
	AdminTable,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '@/features/admin/client/components/table';
import { createAdminUserDisplayName } from '@/features/admin/client/components/userPresentation';

type TOverrideSelection = 'inherit' | TFeatureAccessOverrideEffect;

function createOverrideDraft(
	overrides: IAdminFeatureAccessUserData['module_overrides']
) {
	return Object.fromEntries(Object.entries(overrides)) as Partial<
		Record<TFeatureModuleKey, TOverrideSelection>
	>;
}

function checkStringSetsEqual(
	left: ReadonlySet<string>,
	right: ReadonlyArray<string>
) {
	return (
		left.size === right.length && right.every((value) => left.has(value))
	);
}

function createAccessSourceLabels(
	access: IAdminFeatureAccessUserData['effective_access'][TFeatureModuleKey],
	groupNameById: ReadonlyMap<string, string>
) {
	const labels: string[] = [];
	for (const source of access.sources) {
		if (source === 'group-allow') {
			const groupNames = access.groupIds
				.map((groupId) => groupNameById.get(groupId) ?? groupId)
				.join('、');
			labels.push(groupNames === '' ? '授权组' : `授权组：${groupNames}`);
			continue;
		}
		labels.push(FEATURE_ACCESS_SOURCE_LABEL_MAP[source]);
	}
	return [...new Set(labels)];
}

function getReasonBadgeTone(
	access: IAdminFeatureAccessUserData['effective_access'][TFeatureModuleKey]
) {
	if (access.allowed) {
		return 'success';
	}
	if (access.reason === 'denied') {
		return 'danger';
	}
	return access.reason === 'unavailable' ? 'default' : 'warning';
}

export function AccessUserDetailClient({
	admin,
	initialData,
	modules,
}: {
	admin: IAdminMeData;
	initialData: IAdminFeatureAccessUserData;
	modules: IAdminFeatureModuleListData;
}) {
	const [data, setData] = useState(initialData);
	const [groupIds, setGroupIds] = useState(
		() => new Set(initialData.group_ids)
	);
	const [overrides, setOverrides] = useState<
		Partial<Record<TFeatureModuleKey, TOverrideSelection>>
	>(() => createOverrideDraft(initialData.module_overrides));
	const [message, setMessage] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const isEditable = data.user.status !== 'deleted';
	const groupNameById = useMemo(
		() =>
			new Map(
				data.groups.map((group) => [group.id, group.name] as const)
			),
		[data.groups]
	);
	const isDirty = useMemo(() => {
		if (!checkStringSetsEqual(groupIds, data.group_ids)) {
			return true;
		}
		return modules.modules.some(
			(module) =>
				(overrides[module.key] ?? 'inherit') !==
				(data.module_overrides[module.key] ?? 'inherit')
		);
	}, [
		data.group_ids,
		data.module_overrides,
		groupIds,
		modules.modules,
		overrides,
	]);

	const handleGroupToggle = useCallback(
		(groupId: string) => {
			if (isSaving) {
				return;
			}
			setMessage(null);
			setGroupIds((current) => {
				const next = new Set(current);
				if (next.has(groupId)) {
					next.delete(groupId);
				} else {
					next.add(groupId);
				}
				return next;
			});
		},
		[isSaving]
	);

	const handleOverrideChange = useCallback(
		(moduleKey: TFeatureModuleKey, value: TOverrideSelection) => {
			if (isSaving) {
				return;
			}
			setMessage(null);
			setOverrides((current) => ({ ...current, [moduleKey]: value }));
		},
		[isSaving]
	);

	const handleSave = useCallback(() => {
		if (isSaving || !isDirty || !isEditable) {
			return;
		}
		const moduleOverrides = Object.fromEntries(
			modules.modules.flatMap(({ key }) => {
				const effect = overrides[key] ?? 'inherit';
				return effect === 'inherit' ? [] : [[key, effect]];
			})
		) as Partial<Record<TFeatureModuleKey, TFeatureAccessOverrideEffect>>;
		setIsSaving(true);
		setMessage(null);
		void updateAdminFeatureAccessUser(
			data.user.id,
			{ group_ids: [...groupIds], module_overrides: moduleOverrides },
			admin.csrf_token
		)
			.then((result) => {
				if (result.status === 'error') {
					setMessage(result.displayMessage);
					return;
				}
				setData(result.data);
				setGroupIds(new Set(result.data.group_ids));
				setOverrides(createOverrideDraft(result.data.module_overrides));
				setMessage(FEATURE_ACCESS_ADMIN_MESSAGE_MAP.userAccessSaved);
			})
			.catch(() => {
				setMessage(
					FEATURE_ACCESS_ADMIN_MESSAGE_MAP.userAccessSaveFailed
				);
			})
			.finally(() => {
				setIsSaving(false);
			});
	}, [
		admin.csrf_token,
		data.user.id,
		groupIds,
		isDirty,
		isEditable,
		isSaving,
		modules.modules,
		overrides,
	]);

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<AdminHeaderActionLink
							href={`/admin/users/${data.user.id}`}
							icon={faUser}
						>
							用户详情
						</AdminHeaderActionLink>
						<AdminHeaderActionButton
							color="primary"
							icon={faFloppyDisk}
							isDisabled={!isDirty || isSaving || !isEditable}
							isLoading={isSaving}
							onPress={handleSave}
						>
							保存
						</AdminHeaderActionButton>
					</>
				}
				icon={faUserLock}
				subtitle={createAdminUserDisplayName(data.user)}
				title="用户访问配置"
			/>
			<AccessAdminNavigation />
			{message !== null && <AdminMessage message={message} />}
			{!isEditable && (
				<AdminMessage message="该用户已删除，不能继续修改访问配置。" />
			)}
			<AdminPanel>
				<AdminPanelToolbar
					icon={faUserShield}
					actions={
						<div className="flex items-center gap-2 text-small text-foreground-500">
							<span>账号状态</span>
							<AdminStatusBadge status={data.user.status} />
						</div>
					}
				>
					有效权限
				</AdminPanelToolbar>
				<AdminTable tableClassName="!w-full !min-w-0 table-fixed">
					<AdminTableHeader>
						<AdminTableRow>
							<AdminTableHeadCell className="w-[44%]">
								模块
							</AdminTableHeadCell>
							<AdminTableHeadCell className="w-24">
								结果
							</AdminTableHeadCell>
							<AdminTableHeadCell>来源</AdminTableHeadCell>
						</AdminTableRow>
					</AdminTableHeader>
					<tbody>
						{modules.modules.map((module) => {
							const access = data.effective_access[module.key];
							const sourceLabels =
								access === undefined
									? []
									: createAccessSourceLabels(
											access,
											groupNameById
										);
							return (
								<AdminTableRow key={module.key}>
									<AdminTableCell align="top">
										<div className="min-w-0">
											<p className="break-words text-small font-medium leading-5">
												{module.label}
											</p>
											<p className="mt-0.5 break-all font-mono text-[0.7rem] leading-4 text-foreground-400">
												{module.key}
											</p>
										</div>
									</AdminTableCell>
									<AdminTableCell align="top">
										<AdminBadge
											tone={
												access === undefined
													? 'default'
													: getReasonBadgeTone(access)
											}
										>
											{
												FEATURE_ACCESS_REASON_LABEL_MAP[
													access?.reason ??
														'unavailable'
												]
											}
										</AdminBadge>
									</AdminTableCell>
									<AdminTableCell align="top">
										<span className="break-words leading-5">
											{sourceLabels.length === 0
												? '无'
												: sourceLabels.join('、')}
										</span>
									</AdminTableCell>
								</AdminTableRow>
							);
						})}
					</tbody>
				</AdminTable>
			</AdminPanel>
			<form
				className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)]"
				onSubmit={(event) => {
					event.preventDefault();
					handleSave();
				}}
			>
				<AdminPanel className="min-w-0 space-y-3">
					<AdminPanelToolbar
						icon={faLayerGroup}
						actions={
							<AdminBadge
								tone={groupIds.size > 0 ? 'primary' : 'default'}
							>
								已选{groupIds.size}个
							</AdminBadge>
						}
					>
						授权组
					</AdminPanelToolbar>
					{data.groups.length === 0 ? (
						<AdminEmptyState icon={faLayerGroup}>
							暂无授权组
						</AdminEmptyState>
					) : (
						<div className="grid gap-2">
							{data.groups.map((group) => (
								<label
									key={group.id}
									className="flex min-w-0 items-start gap-3 rounded-medium border border-default-200 p-3"
								>
									<span className="flex h-5 shrink-0 items-center">
										<input
											checked={groupIds.has(group.id)}
											disabled={isSaving || !isEditable}
											type="checkbox"
											onChange={() => {
												handleGroupToggle(group.id);
											}}
										/>
									</span>
									<span className="min-w-0 flex-1">
										<span className="block break-words text-small font-medium leading-5">
											{group.name}
										</span>
										<span className="mt-1 block break-words text-tiny leading-4 text-foreground-500">
											{group.description || '无说明'}
											{' ⦁ '}
											{group.module_count}个模块
										</span>
									</span>
								</label>
							))}
						</div>
					)}
				</AdminPanel>

				<AdminPanel className="min-w-0">
					<AdminPanelTitle icon={faUserShield}>
						模块覆盖
					</AdminPanelTitle>
					<p className="mb-3 text-small leading-5 text-foreground-500">
						直接禁止优先于公开、登录、直接允许和所有授权组。
					</p>
					<div className="space-y-2">
						{modules.modules.map((module) => (
							<div
								key={module.key}
								className="grid min-w-0 gap-3 rounded-medium border border-default-200 p-3 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-start"
							>
								<div className="min-w-0">
									<p className="text-pretty break-words text-small font-medium leading-5">
										{module.label}
									</p>
									<p className="mt-1 break-all font-mono text-[0.7rem] leading-4 text-foreground-400">
										{module.key}
									</p>
									<p className="mt-1 text-tiny leading-4 text-foreground-500">
										{module.description}
									</p>
								</div>
								<Select
									className="w-full sm:w-36"
									disallowEmptySelection
									isDisabled={
										isSaving ||
										!isEditable ||
										!module.is_available
									}
									aria-label={`${module.label}用户覆盖`}
									classNames={{ trigger: 'w-full' }}
									selectedKeys={
										new Set([
											overrides[module.key] ?? 'inherit',
										])
									}
									selectionMode="single"
									size="sm"
									variant="flat"
									onSelectionChange={(keys) => {
										const [nextValue] =
											keys === 'all' ? [] : [...keys];
										if (typeof nextValue === 'string') {
											handleOverrideChange(
												module.key,
												nextValue as TOverrideSelection
											);
										}
									}}
								>
									<SelectItem key="inherit">
										继承策略
									</SelectItem>
									<SelectItem key="allow">
										直接允许
									</SelectItem>
									<SelectItem key="deny">直接禁止</SelectItem>
								</Select>
							</div>
						))}
					</div>
				</AdminPanel>
			</form>
		</AdminShell>
	);
}
