'use client';

import { type PropsWithChildren, memo } from 'react';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';

import { cn } from '@/design/ui/components';
import { type TUserStatus } from '@/lib/account/shared/types';

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

export function AdminShell({
	children,
	className,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<div
			className={cn(
				'min-h-main-content space-y-5 pb-8 text-foreground',
				className
			)}
		>
			{children}
		</div>
	);
}

export function AdminIcon({
	className,
	icon,
}: {
	className?: string;
	icon: FontAwesomeIconProps['icon'];
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
}

export function AdminHeader({
	actions,
	icon,
	subtitle,
	title,
}: {
	actions?: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
	subtitle?: ReactNodeWithoutBoolean;
	title: ReactNodeWithoutBoolean;
}) {
	const hasSubtitle = subtitle !== undefined;

	return (
		<header
			className={cn(
				'flex flex-col gap-3 border-b border-default-200/70 pb-4 lg:flex-row lg:justify-between',
				hasSubtitle ? 'lg:items-start' : 'lg:items-center'
			)}
		>
			<div
				className={cn(
					'flex min-w-0 flex-1 gap-3',
					hasSubtitle ? 'items-start' : 'items-center'
				)}
			>
				<AdminIcon
					icon={icon}
					className={cn(hasSubtitle && 'mt-0.5')}
				/>
				<div className="min-w-0 space-y-1">
					<h1 className="break-words text-xl font-semibold leading-7 text-foreground-900">
						{title}
					</h1>
					{subtitle !== undefined && (
						<p className="break-words text-sm leading-5 text-foreground-500">
							{subtitle}
						</p>
					)}
				</div>
			</div>
			{actions !== undefined && (
				<div
					className={cn(
						'flex shrink-0 flex-wrap items-center gap-2',
						hasSubtitle && 'lg:pt-1'
					)}
				>
					{actions}
				</div>
			)}
		</header>
	);
}

export function AdminPanel({
	children,
	className,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<section
			className={cn(
				'rounded-small border border-default-200/80 bg-default-50/70 p-4 shadow-sm shadow-default-200/30 dark:bg-default-100/20 dark:shadow-none',
				className
			)}
		>
			{children}
		</section>
	);
}

export function AdminPanelTitle({
	children,
	icon,
}: {
	children: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
}) {
	return (
		<div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground-700">
			<FontAwesomeIcon icon={icon} className="w-4 text-primary-600" />
			<span>{children}</span>
		</div>
	);
}

export function AdminInputIcon({
	icon,
}: {
	icon: FontAwesomeIconProps['icon'];
}) {
	return (
		<span className="pointer-events-none inline-flex -translate-y-px items-center text-default-400">
			<FontAwesomeIcon icon={icon} className="block w-3.5" />
		</span>
	);
}

export function AdminStatusBadge({ status }: { status: TUserStatus }) {
	const meta = STATUS_META_MAP[status];

	return (
		<span
			className={cn(
				'inline-flex h-7 items-center rounded-small border px-2 text-xs font-medium',
				meta.className
			)}
		>
			{meta.label}
		</span>
	);
}

export function AdminMetric({
	label,
	value,
}: {
	label: ReactNodeWithoutBoolean;
	value: ReactNodeWithoutBoolean;
}) {
	return (
		<div className="flex min-h-12 min-w-0 flex-col justify-center border-l border-default-200/80 pl-3 first:border-l-0 first:pl-0">
			<div className="truncate text-xs leading-5 text-foreground-500">
				{label}
			</div>
			<div className="min-w-0 break-words text-base font-semibold leading-6 text-foreground-800">
				{value}
			</div>
		</div>
	);
}

export function AdminMessage({ message }: { message: string }) {
	return (
		<div className="rounded-small border border-default-200/80 bg-default/30 px-3 py-2 text-sm leading-6 text-foreground-600">
			{message}
		</div>
	);
}

export function AdminTable({
	children,
	className,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<div
			className={cn(
				'overflow-x-auto rounded-small border border-default-200/80 bg-default-50/50 dark:bg-default-100/10',
				className
			)}
		>
			<table className="min-w-full text-left text-sm">{children}</table>
		</div>
	);
}

export function AdminTableHeader({ children }: PropsWithChildren) {
	return (
		<thead className="bg-default-100/70 text-xs font-medium uppercase text-foreground-500 dark:bg-default-50/10">
			{children}
		</thead>
	);
}

export const AdminTableRow = memo<PropsWithChildren<{ className?: string }>>(
	function AdminTableRow({ children, className }) {
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
	}
);

export function AdminEmptyState({
	children,
	icon,
}: {
	children: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
}) {
	return (
		<div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-small border border-dashed border-default-300/80 bg-default-50/30 px-4 py-8 text-center text-sm text-foreground-500 dark:bg-default-100/10">
			<FontAwesomeIcon icon={icon} className="w-5 text-default-400" />
			<span>{children}</span>
		</div>
	);
}

export function getAdminStatusLabel(status: TUserStatus) {
	return STATUS_META_MAP[status].label;
}
