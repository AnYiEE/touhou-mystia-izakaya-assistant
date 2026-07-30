'use client';

import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { type Key } from 'react';

import Input from '@/design/ui/components/input';

import {
	AdminAdvancedFilterPopover,
	AdminDropdownFilter,
	AdminFilterActionButton,
	AdminFilterReferencePanel,
	AdminSearchInput,
	adminAdvancedFilterInputClassNames,
} from '@/features/admin/client/components/filters';
import { AdminFilterPanel } from '@/features/admin/client/components/panels';

import {
	type TActorTypeFilter,
	type TScopeFilter,
	actorTypeOptions,
	auditFilterReferenceGroups,
	scopeOptions,
} from './presentation';

interface IAdminAuditFiltersProps {
	actionInput: string;
	actorIdInput: string;
	actorType: TActorTypeFilter;
	endTimeInput: string;
	isLoading: boolean;
	onActionInputChange: (value: string) => void;
	onActorIdInputChange: (value: string) => void;
	onActorTypeAction: (key: Key) => void;
	onEndTimeInputChange: (value: string) => void;
	onQueryInputChange: (value: string) => void;
	onRefresh: () => void;
	onScopeAction: (key: Key) => void;
	onStartTimeInputChange: (value: string) => void;
	onTargetIdInputChange: (value: string) => void;
	onTargetTypeInputChange: (value: string) => void;
	onTextFilterChange: (
		setter: (value: string) => void
	) => (value: string) => void;
	queryInput: string;
	scope: TScopeFilter;
	startTimeInput: string;
	targetIdInput: string;
	targetTypeInput: string;
}

export function AdminAuditFilters({
	actionInput,
	actorIdInput,
	actorType,
	endTimeInput,
	isLoading,
	onActionInputChange: setActionInput,
	onActorIdInputChange: setActorIdInput,
	onActorTypeAction: handleActorTypeAction,
	onEndTimeInputChange: setEndTimeInput,
	onQueryInputChange: setQueryInput,
	onRefresh: handleRefresh,
	onScopeAction: handleScopeAction,
	onStartTimeInputChange: setStartTimeInput,
	onTargetIdInputChange: setTargetIdInput,
	onTargetTypeInputChange: setTargetTypeInput,
	onTextFilterChange: handleTextFilterChange,
	queryInput,
	scope,
	startTimeInput,
	targetIdInput,
	targetTypeInput,
}: IAdminAuditFiltersProps) {
	const advancedFilterCount = [
		actionInput,
		actorIdInput,
		targetIdInput,
		targetTypeInput,
		startTimeInput,
		endTimeInput,
	].filter((value) => value.trim() !== '').length;

	return (
		<AdminFilterPanel icon={faMagnifyingGlass}>
			<AdminSearchInput
				ariaLabel="搜索审计日志"
				icon={faMagnifyingGlass}
				placeholder="范围、动作、操作者、目标"
				value={queryInput}
				onValueChange={handleTextFilterChange(setQueryInput)}
			/>
			<AdminAdvancedFilterPopover
				activeCount={advancedFilterCount}
				reference={
					<AdminFilterReferencePanel
						groups={auditFilterReferenceGroups}
					/>
				}
			>
				<Input
					aria-label="按动作过滤"
					className="w-full"
					classNames={adminAdvancedFilterInputClassNames}
					placeholder="动作"
					value={actionInput}
					onValueChange={handleTextFilterChange(setActionInput)}
				/>
				<Input
					aria-label="按操作者ID过滤"
					className="w-full"
					classNames={adminAdvancedFilterInputClassNames}
					placeholder="操作者ID"
					value={actorIdInput}
					onValueChange={handleTextFilterChange(setActorIdInput)}
				/>
				<Input
					aria-label="按目标类型过滤"
					className="w-full"
					classNames={adminAdvancedFilterInputClassNames}
					placeholder="目标类型"
					value={targetTypeInput}
					onValueChange={handleTextFilterChange(setTargetTypeInput)}
				/>
				<Input
					aria-label="按目标ID过滤"
					className="w-full"
					classNames={adminAdvancedFilterInputClassNames}
					placeholder="目标ID"
					value={targetIdInput}
					onValueChange={handleTextFilterChange(setTargetIdInput)}
				/>
				<Input
					aria-label="开始时间"
					className="w-full"
					classNames={adminAdvancedFilterInputClassNames}
					placeholder="开始时间"
					type="datetime-local"
					value={startTimeInput}
					onValueChange={handleTextFilterChange(setStartTimeInput)}
				/>
				<Input
					aria-label="结束时间"
					className="w-full"
					classNames={adminAdvancedFilterInputClassNames}
					placeholder="结束时间"
					type="datetime-local"
					value={endTimeInput}
					onValueChange={handleTextFilterChange(setEndTimeInput)}
				/>
			</AdminAdvancedFilterPopover>
			<AdminDropdownFilter
				ariaLabel="筛选审计范围"
				options={scopeOptions}
				value={scope}
				onAction={handleScopeAction}
			/>
			<AdminDropdownFilter
				ariaLabel="筛选操作者类型"
				options={actorTypeOptions}
				value={actorType}
				onAction={handleActorTypeAction}
			/>
			<AdminFilterActionButton
				isLoading={isLoading}
				onPress={handleRefresh}
			>
				刷新
			</AdminFilterActionButton>
		</AdminFilterPanel>
	);
}
