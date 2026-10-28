'use client';

import {
	faCubes,
	faFloppyDisk,
	faUserShield,
} from '@fortawesome/free-solid-svg-icons';
import { Select, SelectItem } from '@heroui/select';
import { useCallback, useMemo, useState } from 'react';

import {
	type TFeatureAccessLevel,
	type TFeatureModuleKey,
	isSsoAppFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

import type { IAdminMeData } from '@/features/account/contracts';
import { AdminConfirmButton } from '@/features/admin/client/components/confirmation';
import {
	AdminEmptyState,
	AdminMessage,
} from '@/features/admin/client/components/feedback';
import {
	AdminHeader,
	AdminShell,
} from '@/features/admin/client/components/shell';
import { AdminBadge } from '@/features/admin/client/components/statusBadges';
import {
	AdminTable,
	AdminTableActionLink,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '@/features/admin/client/components/table';
import { AccessAdminNavigation } from '@/features/featureAccess/admin/client/AccessAdminNavigation';
import { updateAdminFeatureModulePolicy } from '@/features/featureAccess/admin/client/api';
import {
	FEATURE_ACCESS_ADMIN_MESSAGE_MAP,
	FEATURE_ACCESS_LEVEL_LABEL_MAP,
} from '@/features/featureAccess/admin/client/copy';
import {
	type IAdminFeatureModuleListData,
	type IAdminFeatureModuleRecord,
} from '@/features/featureAccess/contracts';

const ACCESS_LEVELS = [
	'public',
	'authenticated',
	'granted',
] as const satisfies ReadonlyArray<TFeatureAccessLevel>;

function filterModules(
	modules: ReadonlyArray<IAdminFeatureModuleRecord>,
	mode: 'apps' | 'modules'
) {
	return modules.filter(({ key }) =>
		mode === 'apps'
			? isSsoAppFeatureModuleKey(key)
			: !isSsoAppFeatureModuleKey(key)
	);
}

export function AccessModulesClient({
	admin,
	initialData,
	mode,
}: {
	admin: IAdminMeData;
	initialData: IAdminFeatureModuleListData;
	mode: 'apps' | 'modules';
}) {
	const [modules, setModules] = useState(initialData.modules);
	const [selectedLevels, setSelectedLevels] = useState<
		Partial<Record<TFeatureModuleKey, TFeatureAccessLevel>>
	>({});
	const [openAction, setOpenAction] = useState<string | null>(null);
	const [savingKey, setSavingKey] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const visibleModules = useMemo(
		() => filterModules(modules, mode),
		[mode, modules]
	);

	const handleLevelChange = useCallback(
		(moduleKey: TFeatureModuleKey, accessLevel: TFeatureAccessLevel) => {
			setSelectedLevels((current) => ({
				...current,
				[moduleKey]: accessLevel,
			}));
			setMessage(null);
		},
		[]
	);

	const handleSave = useCallback(
		(module: IAdminFeatureModuleRecord) => {
			if (savingKey !== null) {
				return;
			}
			const accessLevel =
				selectedLevels[module.key] ?? module.access_level;
			setSavingKey(module.key);
			setMessage(null);
			void updateAdminFeatureModulePolicy(
				{ access_level: accessLevel, module_key: module.key },
				admin.csrf_token
			)
				.then((result) => {
					if (result.status === 'error') {
						setMessage(result.displayMessage);
						return;
					}
					setModules(result.data.modules);
					setSelectedLevels((current) =>
						Object.fromEntries(
							Object.entries(current).filter(
								([moduleKey]) => moduleKey !== module.key
							)
						)
					);
					setOpenAction(null);
					setMessage(
						FEATURE_ACCESS_ADMIN_MESSAGE_MAP.modulePolicySaved
					);
				})
				.catch(() => {
					setMessage(
						FEATURE_ACCESS_ADMIN_MESSAGE_MAP.modulePolicySaveFailed
					);
				})
				.finally(() => {
					setSavingKey(null);
				});
		},
		[admin.csrf_token, savingKey, selectedLevels]
	);

	return (
		<AdminShell>
			<AdminHeader
				icon={mode === 'apps' ? faUserShield : faCubes}
				subtitle={
					mode === 'apps'
						? '控制每个SSO外部应用的默认访问级别'
						: '控制内置功能模块的默认访问级别'
				}
				title={mode === 'apps' ? 'SSO应用' : '功能模块'}
			/>
			<AccessAdminNavigation />
			{message !== null && <AdminMessage message={message} />}
			{visibleModules.length === 0 ? (
				<AdminEmptyState icon={faUserShield}>
					{mode === 'apps' ? '暂无SSO应用' : '暂无功能模块'}
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<AdminTableRow>
							<AdminTableHeadCell>模块</AdminTableHeadCell>
							<AdminTableHeadCell>默认级别</AdminTableHeadCell>
							<AdminTableHeadCell>当前级别</AdminTableHeadCell>
							<AdminTableHeadCell>状态</AdminTableHeadCell>
							<AdminTableHeadCell className="text-right">
								操作
							</AdminTableHeadCell>
						</AdminTableRow>
					</AdminTableHeader>
					<tbody>
						{visibleModules.map((module) => {
							const level =
								selectedLevels[module.key] ??
								module.access_level;
							const isDirty = level !== module.access_level;
							return (
								<AdminTableRow key={module.key}>
									<AdminTableCell align="top">
										<div className="min-w-56 max-w-96">
											<p className="text-pretty break-words font-medium">
												{module.label}
											</p>
											<p className="mt-0.5 break-all font-mono text-[0.7rem] leading-4 text-foreground-400">
												{module.key}
											</p>
											<p className="mt-1 text-tiny text-foreground-500">
												{module.description}
											</p>
										</div>
									</AdminTableCell>
									<AdminTableCell isNowrap>
										{
											FEATURE_ACCESS_LEVEL_LABEL_MAP[
												module.default_access_level
											]
										}
									</AdminTableCell>
									<AdminTableCell isNowrap>
										<Select
											className="w-36"
											isDisabled={
												savingKey !== null ||
												!module.is_available
											}
											disallowEmptySelection
											aria-label={`${module.label}访问级别`}
											classNames={{ trigger: 'w-full' }}
											selectedKeys={new Set([level])}
											selectionMode="single"
											size="sm"
											variant="flat"
											onSelectionChange={(keys) => {
												const [nextLevel] =
													keys === 'all'
														? []
														: [...keys];
												if (
													typeof nextLevel ===
													'string'
												) {
													handleLevelChange(
														module.key,
														nextLevel as TFeatureAccessLevel
													);
												}
											}}
										>
											{ACCESS_LEVELS.map(
												(accessLevel) => (
													<SelectItem
														key={accessLevel}
														textValue={
															FEATURE_ACCESS_LEVEL_LABEL_MAP[
																accessLevel
															]
														}
													>
														{
															FEATURE_ACCESS_LEVEL_LABEL_MAP[
																accessLevel
															]
														}
													</SelectItem>
												)
											)}
										</Select>
									</AdminTableCell>
									<AdminTableCell isNowrap>
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
									</AdminTableCell>
									<AdminTableCell
										isNowrap
										className="text-right"
									>
										<div className="flex items-center justify-end gap-2">
											{mode === 'apps' && (
												<AdminTableActionLink
													href={`/admin/sso/${encodeURIComponent(module.key.slice('sso.app:'.length))}`}
												>
													配置客户端
												</AdminTableActionLink>
											)}
											<AdminConfirmButton
												color="primary"
												confirmAction={module.key}
												confirmColor="primary"
												confirmLabel="确认保存"
												icon={faFloppyDisk}
												isDisabled={
													savingKey !== null ||
													!isDirty ||
													!module.is_available
												}
												isLoading={
													savingKey === module.key
												}
												openAction={openAction}
												size="sm"
												onConfirm={() => {
													handleSave(module);
												}}
												onOpenChange={setOpenAction}
											>
												{isDirty ? '保存' : '已保存'}
											</AdminConfirmButton>
										</div>
									</AdminTableCell>
								</AdminTableRow>
							);
						})}
					</tbody>
				</AdminTable>
			)}
		</AdminShell>
	);
}
