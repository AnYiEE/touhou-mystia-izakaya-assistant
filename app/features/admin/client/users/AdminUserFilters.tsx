'use client';

import {
	faChevronDown,
	faMagnifyingGlass,
	faRotate,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type Key, memo, useCallback, useMemo } from 'react';

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
import { ADMIN_USER_STATUS_FILTER_OPTIONS } from '@/features/admin/copy';

const ADMIN_USER_STATUS_ITEM_CLASSES = {
	base: 'transition-background motion-reduce:transition-none',
} as const;

const ADMIN_USER_STATUS_BY_KEY: ReadonlyMap<Key, TUserStatus | ''> = new Map(
	ADMIN_USER_STATUS_FILTER_OPTIONS.map((option) => [
		option.value,
		option.value === 'all' ? '' : option.value,
	])
);

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
	onStatusAction: (value: TUserStatus | '') => void;
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
		const selectedStatusKeys = useMemo(
			() => [statusFilterKey],
			[statusFilterKey]
		);

		const handleStatusAction = useCallback(
			(key: Key) => {
				const value = ADMIN_USER_STATUS_BY_KEY.get(key);
				if (value !== undefined) {
					onStatusAction(value);
				}
			},
			[onStatusAction]
		);

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
						selectedKeys={selectedStatusKeys}
						selectionMode="single"
						variant="flat"
						itemClasses={ADMIN_USER_STATUS_ITEM_CLASSES}
						onAction={handleStatusAction}
					>
						{ADMIN_USER_STATUS_FILTER_OPTIONS.map((option) => (
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
