'use client';

import { type Key, memo } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faChevronDown,
	faClipboardList,
	faClockRotateLeft,
	faFilter,
	faKey,
	faListCheck,
	faRotate,
	faServer,
} from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Link,
	Popover,
	PopoverContent,
	PopoverTrigger,
	cn,
} from '@/design/ui/components';

import { AdminBadge } from '../components';

import { globalStore as store } from '@/stores';

import type {
	TAdminSsoCallbackDeliveryStatus,
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
	TAdminSsoTicketStatus,
} from '@/lib/account/shared/types';

export const ADMIN_SSO_DEFAULT_PAGE_SIZE = 20;
export const ADMIN_SSO_LIST_DEBOUNCE_MS = 300;

export const adminSsoFilterInputClassName =
	'w-full min-w-0 md:min-w-56 md:flex-[1_1_16rem]';

export const adminSsoAdvancedFilterInputClassNames = {
	inputWrapper: 'h-10 min-h-10',
} as const;

const ssoNavItems = [
	{ href: '/admin/sso', icon: faServer, label: '客户端' },
	{ href: '/admin/sso/grants', icon: faListCheck, label: '授权关系' },
	{ href: '/admin/sso/callbacks', icon: faRotate, label: 'Callback' },
	{
		href: '/admin/sso/callbacks/history',
		icon: faClockRotateLeft,
		label: '投递历史',
	},
	{ href: '/admin/sso/tickets', icon: faKey, label: 'Tickets' },
	{ href: '/admin/audit?scope=sso', icon: faClipboardList, label: '审计' },
] as const;

interface IAdminSsoOperationNavProps {
	activeHref: (typeof ssoNavItems)[number]['href'];
}

export const AdminSsoOperationNav = memo<IAdminSsoOperationNavProps>(
	function AdminSsoOperationNav({ activeHref }) {
		const isHighAppearance = store.persistence.highAppearance.use();

		return (
			<nav
				aria-label="SSO运营导航"
				className={cn(
					'grid grid-cols-2 gap-2 rounded-small border border-default-200/80 px-3 py-2 text-small text-foreground-500 sm:grid-cols-3 xl:grid-cols-6',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-default-50/50 dark:bg-default-100/10'
				)}
			>
				{ssoNavItems.map((item) => {
					const isActive = item.href === activeHref;

					return (
						<Button
							key={item.href}
							as={Link}
							animationUnderline={false}
							className="w-full min-w-0 px-3"
							color={isActive ? 'primary' : 'default'}
							href={item.href}
							startContent={
								<FontAwesomeIcon
									icon={item.icon}
									className="w-3.5"
								/>
							}
							variant={isActive ? 'solid' : 'flat'}
						>
							<span className="truncate">{item.label}</span>
						</Button>
					);
				})}
			</nav>
		);
	}
);

export function createAdminSsoPageInputValue(page: number) {
	return String(Math.max(1, page));
}

export function parseAdminSsoPageInput(value: string, totalPages: number) {
	const page = Number.parseInt(value, 10);
	if (!Number.isSafeInteger(page) || page < 1) {
		return 1;
	}

	return Math.min(page, Math.max(1, totalPages));
}

export function createAdminSsoDateTimeText(timestamp: number | null) {
	return timestamp === null
		? '无'
		: new Date(timestamp).toLocaleString('zh-CN');
}

function createAdminSsoTimeInputSegment(value: number) {
	return String(value).padStart(2, '0');
}

export function createAdminSsoTimeInputValue(timestamp: number | undefined) {
	if (timestamp === undefined) {
		return '';
	}

	const date = new Date(timestamp);
	return `${date.getFullYear()}-${createAdminSsoTimeInputSegment(
		date.getMonth() + 1
	)}-${createAdminSsoTimeInputSegment(date.getDate())}T${createAdminSsoTimeInputSegment(
		date.getHours()
	)}:${createAdminSsoTimeInputSegment(date.getMinutes())}`;
}

export function parseAdminSsoTimeInputValue(value: string) {
	if (value.trim() === '') {
		return;
	}

	const timestamp = new Date(value).getTime();
	return Number.isSafeInteger(timestamp) && timestamp >= 0
		? timestamp
		: undefined;
}

export function getAdminSsoCallbackEventLabel(event: TAdminSsoCallbackEvent) {
	switch (event) {
		case 'client_deleted':
			return '客户端删除';
		case 'client_disabled':
			return '客户端禁用';
		case 'grant_revoked':
			return '授权撤销';
		case 'secret_rotated':
			return 'Secret轮换';
		case 'user_deleted':
			return '用户删除';
		case 'user_disabled':
			return '用户禁用';
		case 'user_profile_updated':
			return '资料更新';
	}
}

export const AdminSsoCallbackQueueStatusBadge = memo<{
	status: TAdminSsoCallbackQueueStatus;
}>(function AdminSsoCallbackQueueStatusBadge({ status }) {
	switch (status) {
		case 'final_failed':
			return <AdminBadge tone="danger">最终失败</AdminBadge>;
		case 'pending':
			return <AdminBadge tone="primary">待投递</AdminBadge>;
		case 'retrying':
			return <AdminBadge tone="warning">重试中</AdminBadge>;
	}
});

export const AdminSsoCallbackDeliveryStatusBadge = memo<{
	status: TAdminSsoCallbackDeliveryStatus;
}>(function AdminSsoCallbackDeliveryStatusBadge({ status }) {
	switch (status) {
		case 'failed':
			return <AdminBadge tone="warning">失败</AdminBadge>;
		case 'final_failed':
			return <AdminBadge tone="danger">最终失败</AdminBadge>;
		case 'succeeded':
			return <AdminBadge tone="success">成功</AdminBadge>;
	}
});

export const AdminSsoTicketStatusBadge = memo<{
	status: TAdminSsoTicketStatus;
}>(function AdminSsoTicketStatusBadge({ status }) {
	switch (status) {
		case 'expired':
			return <AdminBadge tone="warning">已过期</AdminBadge>;
		case 'pending':
			return <AdminBadge tone="primary">未消费</AdminBadge>;
		case 'revoked':
			return <AdminBadge tone="danger">已撤销</AdminBadge>;
		case 'used':
			return <AdminBadge tone="success">已消费</AdminBadge>;
	}
});

interface IAdminSsoFilterButtonProps {
	children: ReactNodeWithoutBoolean;
	isLoading: boolean;
	onPress: () => void;
}

export const AdminSsoFilterButton = memo<IAdminSsoFilterButtonProps>(
	function AdminSsoFilterButton({ children, isLoading, onPress }) {
		return (
			<Button
				className="h-12 min-h-12 w-full shrink-0 px-4 md:w-auto md:flex-none"
				color="primary"
				isLoading={isLoading}
				startContent={
					isLoading ? null : (
						<FontAwesomeIcon icon={faRotate} className="w-3.5" />
					)
				}
				variant="flat"
				onPress={onPress}
			>
				{children}
			</Button>
		);
	}
);

interface IAdminSsoAdvancedFilterPopoverProps {
	activeCount?: number;
	children: ReactNodeWithoutBoolean;
	label?: ReactNodeWithoutBoolean;
}

export const AdminSsoAdvancedFilterPopover =
	memo<IAdminSsoAdvancedFilterPopoverProps>(
		function AdminSsoAdvancedFilterPopover({
			activeCount = 0,
			children,
			label = '更多筛选',
		}) {
			const hasActiveFilter = activeCount > 0;

			return (
				<Popover placement="bottom-start" showArrow>
					<PopoverTrigger>
						<Button
							className="h-12 min-h-12 w-full shrink-0 gap-2 px-4 md:w-auto md:min-w-32 md:flex-none"
							color={hasActiveFilter ? 'primary' : 'default'}
							startContent={
								<FontAwesomeIcon
									icon={faFilter}
									className="w-3.5"
								/>
							}
							variant={hasActiveFilter ? 'flat' : 'light'}
						>
							<span>{label}</span>
							{hasActiveFilter && (
								<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-tiny font-medium text-primary">
									{activeCount}
								</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-3">
						<div className="grid w-72 max-w-full gap-3">
							{children}
						</div>
					</PopoverContent>
				</Popover>
			);
		}
	);

interface IAdminSsoDropdownFilterProps<TValue extends string> {
	ariaLabel: string;
	onAction: (key: Key) => void;
	options: ReadonlyArray<{ label: string; value: TValue }>;
	value: TValue;
}

function getAdminSsoDropdownFilterLabel<TValue extends string>(
	options: ReadonlyArray<{ label: string; value: TValue }>,
	value: TValue
) {
	return options.find((option) => option.value === value)?.label ?? '';
}

function AdminSsoDropdownFilterBase<TValue extends string>({
	ariaLabel,
	onAction,
	options,
	value,
}: IAdminSsoDropdownFilterProps<TValue>) {
	return (
		<Dropdown className="w-full shrink-0 md:w-auto md:flex-none" showArrow>
			<DropdownTrigger>
				<Button
					className="h-12 min-h-12 w-full min-w-0 shrink-0 gap-2 px-3 md:w-auto md:flex-none"
					endContent={
						<FontAwesomeIcon
							icon={faChevronDown}
							className="w-3 text-default-500"
						/>
					}
					variant="flat"
				>
					<span className="truncate text-small">
						{getAdminSsoDropdownFilterLabel(options, value)}
					</span>
				</Button>
			</DropdownTrigger>
			<DropdownMenu
				disallowEmptySelection
				aria-label={ariaLabel}
				selectedKeys={[value]}
				selectionMode="single"
				variant="flat"
				onAction={onAction}
			>
				{options.map((option) => (
					<DropdownItem key={option.value} textValue={option.label}>
						{option.label}
					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	);
}

export const AdminSsoDropdownFilter = memo(
	AdminSsoDropdownFilterBase
) as typeof AdminSsoDropdownFilterBase;

interface IAdminSsoMetadataProps {
	metadata: Record<string, unknown>;
}

export const AdminSsoMetadata = memo<IAdminSsoMetadataProps>(
	function AdminSsoMetadata({ metadata }) {
		const entries = Object.entries(metadata);
		if (entries.length === 0) {
			return <span className="text-foreground-400">无</span>;
		}

		return (
			<div className="flex max-w-96 flex-wrap gap-1">
				{entries.map(([key, value]) => (
					<span
						key={key}
						className={cn(
							'inline-flex max-w-full rounded-small bg-default/40 px-2 py-1',
							'font-mono text-[0.68rem] leading-4 text-foreground-500'
						)}
					>
						<span className="truncate">
							{key}:{' '}
							{typeof value === 'string' ||
							typeof value === 'number'
								? value
								: JSON.stringify(value)}
						</span>
					</span>
				))}
			</div>
		);
	}
);
