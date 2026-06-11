'use client';

import { type PropsWithChildren, memo } from 'react';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';

import { Card, cn } from '@/design/ui/components';

import Placeholder from '@/components/placeholder';

import { type TUserStatus } from '@/lib/account/shared/types';
import { globalStore as store } from '@/stores';

const STATUS_META_MAP = {
	active: {
		className:
			'border-success/30 bg-success/15 text-success-700 dark:text-success',
		label: '正常',
	},
	deleted: {
		className:
			'border-danger/30 bg-danger/15 text-danger-700 dark:text-danger-600',
		label: '已删除',
	},
	disabled: {
		className:
			'border-warning/30 bg-warning/20 text-warning-700 dark:text-warning-600',
		label: '禁用',
	},
} as const satisfies Record<TUserStatus, { className: string; label: string }>;

export interface IAdminListLocationState {
	page: number;
	query: string;
	status: TUserStatus | '';
}

export function getAdminListPageFromSearchValue(value: string | null) {
	const page = Number.parseInt(value ?? '', 10);

	return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function getAdminListStatusFromSearchValue(
	value: string | null
): TUserStatus | '' {
	switch (value) {
		case 'active':
		case 'deleted':
		case 'disabled':
			return value;
		default:
			return '';
	}
}

function createAdminListSearchParams({
	page,
	query,
	status,
}: IAdminListLocationState) {
	const params = new URLSearchParams();

	if (page > 1) {
		params.set('page', String(page));
	}
	if (query.length > 0) {
		params.set('query', query);
	}
	if (status !== '') {
		params.set('status', status);
	}

	return params;
}

export function getAdminListHref(state: IAdminListLocationState) {
	const search = createAdminListSearchParams(state).toString();

	return search.length === 0 ? '/admin' : `/admin?${search}`;
}

export function getAdminUserDetailHref(
	userId: string,
	state: IAdminListLocationState
) {
	const search = createAdminListSearchParams(state).toString();
	const pathname = `/admin/users/${encodeURIComponent(userId)}`;

	return search.length === 0 ? pathname : `${pathname}?${search}`;
}

interface IAdminShellProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

export const AdminShell = memo<IAdminShellProps>(function AdminShell({
	children,
	className,
}) {
	return (
		<div
			className={cn(
				'min-h-main-content space-y-5 text-foreground',
				className
			)}
		>
			{children}
		</div>
	);
});

interface IAdminIconProps
	extends
		Pick<HTMLSpanElementAttributes, 'className'>,
		Pick<FontAwesomeIconProps, 'icon'> {}

export const AdminIcon = memo<IAdminIconProps>(function AdminIcon({
	className,
	icon,
}) {
	return (
		<span
			className={cn(
				'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-small border border-primary/20 bg-primary/15 text-primary-700 dark:text-primary',
				className
			)}
		>
			<FontAwesomeIcon icon={icon} className="w-4" />
		</span>
	);
});

interface IAdminHeaderProps {
	actions?: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
	subtitle?: ReactNodeWithoutBoolean;
	title: ReactNodeWithoutBoolean;
}

export const AdminHeader = memo<IAdminHeaderProps>(function AdminHeader({
	actions,
	icon,
	subtitle,
	title,
}) {
	const hasSubtitle = subtitle !== undefined;
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<Card
			as="header"
			fullWidth
			shadow="sm"
			classNames={{
				base: cn(
					'flex flex-col gap-3 space-y-0 p-4 lg:flex-row lg:items-center lg:justify-between',
					{ 'bg-content1/40 backdrop-blur': isHighAppearance }
				),
			}}
		>
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<AdminIcon
					icon={icon}
					className={cn(hasSubtitle && 'mt-0.5')}
				/>
				<div className="min-w-0 space-y-1">
					<h1 className="break-words text-xl font-semibold leading-7 text-foreground-900">
						{title}
					</h1>
					{subtitle !== undefined && (
						<p className="break-words text-small leading-5 text-foreground-500">
							{subtitle}
						</p>
					)}
				</div>
			</div>
			{actions !== undefined && (
				<div className="flex shrink-0 flex-wrap items-center gap-2">
					{actions}
				</div>
			)}
		</Card>
	);
});

interface IAdminPanelProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

export const AdminPanel = memo<IAdminPanelProps>(function AdminPanel({
	children,
	className,
}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<Card
			as="section"
			fullWidth
			shadow="sm"
			classNames={{
				base: cn('p-4', className, {
					'bg-content1/40 backdrop-blur': isHighAppearance,
				}),
			}}
		>
			{children}
		</Card>
	);
});

interface IAdminPanelTitleProps {
	children: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
}

export const AdminPanelTitle = memo<IAdminPanelTitleProps>(
	function AdminPanelTitle({ children, icon }) {
		return (
			<div className="mb-3 flex items-center gap-2 text-small font-medium text-foreground-700">
				<FontAwesomeIcon icon={icon} className="w-4" />
				<span>{children}</span>
			</div>
		);
	}
);

interface IAdminInputIconProps extends Pick<FontAwesomeIconProps, 'icon'> {}

export const AdminInputIcon = memo<IAdminInputIconProps>(
	function AdminInputIcon({ icon }) {
		return (
			<span className="pointer-events-none inline-flex -translate-y-px items-center text-default-400">
				<FontAwesomeIcon icon={icon} className="block w-3.5" />
			</span>
		);
	}
);

interface IAdminStatusBadgeProps {
	status: TUserStatus;
}

export const AdminStatusBadge = memo<IAdminStatusBadgeProps>(
	function AdminStatusBadge({ status }) {
		const meta = STATUS_META_MAP[status];

		return (
			<span
				className={cn(
					'inline-flex h-7 items-center rounded-small border px-2 text-tiny font-medium',
					meta.className
				)}
			>
				{meta.label}
			</span>
		);
	}
);

interface IAdminMetricProps {
	className?: string;
	label: ReactNodeWithoutBoolean;
	value: ReactNodeWithoutBoolean;
}

export const AdminMetric = memo<IAdminMetricProps>(function AdminMetric({
	className,
	label,
	value,
}) {
	return (
		<div
			className={cn(
				'flex min-h-12 min-w-0 flex-col justify-center',
				className
			)}
		>
			<div className="truncate text-tiny leading-5 text-foreground-500">
				{label}
			</div>
			<div className="min-w-0 break-words text-base font-semibold leading-6 text-foreground-800">
				{value}
			</div>
		</div>
	);
});

interface IAdminMessageProps {
	message: string;
}

export const AdminMessage = memo<IAdminMessageProps>(function AdminMessage({
	message,
}) {
	return (
		<div className="rounded-small border border-default-200/80 bg-default/30 px-3 py-2 text-small leading-6 text-foreground-600">
			{message}
		</div>
	);
});

interface IAdminTableProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

export const AdminTable = memo<IAdminTableProps>(function AdminTable({
	children,
	className,
}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<div
			className={cn(
				'overflow-x-auto rounded-small border border-default-200/80',
				isHighAppearance
					? 'bg-content1/40 backdrop-blur'
					: 'bg-default-50/50 dark:bg-default-100/10',
				className
			)}
		>
			<table className="min-w-full text-left text-small">
				{children}
			</table>
		</div>
	);
});

interface IAdminTableHeaderProps extends PropsWithChildren<object> {}

export const AdminTableHeader = memo<IAdminTableHeaderProps>(
	function AdminTableHeader({ children }) {
		return (
			<thead className="bg-default-100/70 text-tiny font-medium uppercase text-foreground-500 dark:bg-default-50/10">
				{children}
			</thead>
		);
	}
);

interface IAdminTableRowProps extends PropsWithChildren<object> {
	className?: string;
}

export const AdminTableRow = memo<IAdminTableRowProps>(function AdminTableRow({
	children,
	className,
}) {
	return (
		<tr
			className={cn(
				'border-t border-default-200/70 transition-colors hover:bg-default-100/60 motion-reduce:transition-none dark:hover:bg-default-50/10',
				className
			)}
		>
			{children}
		</tr>
	);
});

interface IAdminEmptyStateProps {
	children: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
}

export const AdminEmptyState = memo<IAdminEmptyStateProps>(
	function AdminEmptyState({ children, icon }) {
		const isHighAppearance = store.persistence.highAppearance.use();

		return (
			<Placeholder
				className={cn(
					'min-h-32 gap-2 space-y-0 rounded-small border border-dashed border-default-300/80 px-4 py-8',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-default-50/30 dark:bg-default-100/10'
				)}
			>
				<FontAwesomeIcon icon={icon} size="lg" />
				<span>{children}</span>
			</Placeholder>
		);
	}
);

export function getAdminStatusLabel(status: TUserStatus) {
	return STATUS_META_MAP[status].label;
}
