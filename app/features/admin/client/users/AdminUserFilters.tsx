'use client';

import {
	faChevronDown,
	faMagnifyingGlass,
	faRotate,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type Key, memo } from 'react';

import Button from '@/design/ui/components/button';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from '@/design/ui/components/dropdown';

import { type TUserStatus } from '@/domain/account/contracts';

import { AdminSearchInput } from '@/features/admin/client/components/filters';
import { AdminFilterPanel } from '@/features/admin/client/components/panels';
import { getAdminStatusLabel } from '@/features/admin/client/components/statusBadges';

const statusOptions: Array<{ label: string; value: TUserStatus | 'all' }> = [
	{ label: '全部状态', value: 'all' },
	{ label: '正常', value: 'active' },
	{ label: '已禁用', value: 'disabled' },
	{ label: '已删除', value: 'deleted' },
];

export function getFilterStatusLabel(status: TUserStatus | '') {
	return status === '' ? '全部状态' : getAdminStatusLabel(status);
}

export function getStatusFilterKey(status: TUserStatus | '') {
	return status === '' ? 'all' : status;
}

interface IAdminUserFilterPanelProps {
	isUsersLoading: boolean;
	onQueryInputChange: (value: string) => void;
	onRefresh: () => void;
	onStatusAction: (key: Key) => void;
	queryInput: string;
	statusFilterKey: string;
	statusFilterLabel: string;
}

export const AdminUserFilterPanel = memo<IAdminUserFilterPanelProps>(
	function AdminUserFilterPanel({
		isUsersLoading,
		onQueryInputChange,
		onRefresh,
		onStatusAction,
		queryInput,
		statusFilterKey,
		statusFilterLabel,
	}) {
		return (
			<AdminFilterPanel icon={faMagnifyingGlass}>
				<AdminSearchInput
					ariaLabel="搜索用户名或用户ID"
					icon={faMagnifyingGlass}
					placeholder="搜索用户名或用户ID"
					value={queryInput}
					onValueChange={onQueryInputChange}
				/>
				<Dropdown showArrow>
					<DropdownTrigger>
						<Button
							className="h-12 min-h-12 w-full min-w-0 gap-2 px-3 md:w-auto md:flex-none"
							endContent={
								<FontAwesomeIcon
									icon={faChevronDown}
									className="w-3 text-default-500"
								/>
							}
							variant="flat"
						>
							<span className="text-small">
								{statusFilterLabel}
							</span>
						</Button>
					</DropdownTrigger>
					<DropdownMenu
						disallowEmptySelection
						aria-label="筛选用户状态"
						selectedKeys={[statusFilterKey]}
						selectionMode="single"
						variant="flat"
						itemClasses={{
							base: 'transition-background motion-reduce:transition-none',
						}}
						onAction={onStatusAction}
					>
						{statusOptions.map((option) => (
							<DropdownItem
								key={option.value}
								textValue={option.label}
							>
								{option.label}
							</DropdownItem>
						))}
					</DropdownMenu>
				</Dropdown>
				<Button
					className="h-12 min-h-12 w-full md:w-auto md:flex-none"
					color="primary"
					isLoading={isUsersLoading}
					startContent={
						isUsersLoading ? null : (
							<FontAwesomeIcon
								icon={faRotate}
								className="w-3.5"
							/>
						)
					}
					variant="flat"
					onPress={onRefresh}
				>
					刷新
				</Button>
			</AdminFilterPanel>
		);
	}
);
