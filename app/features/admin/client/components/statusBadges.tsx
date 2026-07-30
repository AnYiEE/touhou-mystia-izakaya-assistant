'use client';

import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo } from 'react';

import { type TUserStatus } from '@/domain/account/contracts';

const STATUS_META_MAP = {
	active: { label: '正常', tone: 'success' },
	deleted: { label: '已删除', tone: 'danger' },
	disabled: { label: '已禁用', tone: 'warning' },
} as const satisfies Record<
	TUserStatus,
	{ label: string; tone: TAdminBadgeTone }
>;

const BADGE_TONE_CLASS_NAME_MAP = {
	danger: 'border-danger/30 bg-danger/15 text-danger-700 dark:text-danger-600',
	default: 'border-default-300 bg-default/30 text-foreground-500',
	primary:
		'border-primary/30 bg-primary/15 text-primary-700 dark:text-primary',
	success:
		'border-success/30 bg-success/15 text-success-700 dark:text-success',
	warning:
		'border-warning/30 bg-warning/20 text-warning-700 dark:text-warning-600',
} as const;
type TAdminBadgeTone = keyof typeof BADGE_TONE_CLASS_NAME_MAP;
interface IAdminBadgeProps extends PropsWithChildren<
	Pick<HTMLSpanElementAttributes, 'className'>
> {
	tone?: TAdminBadgeTone;
}

export const AdminBadge = memo<IAdminBadgeProps>(function AdminBadge({
	children,
	className,
	tone = 'default',
}) {
	return (
		<span
			className={cn(
				'inline-flex h-7 items-center rounded-small border px-2 text-tiny font-medium',
				BADGE_TONE_CLASS_NAME_MAP[tone],
				className
			)}
		>
			{children}
		</span>
	);
});

interface IAdminStatusBadgeProps {
	status: TUserStatus;
}

export const AdminStatusBadge = memo<IAdminStatusBadgeProps>(
	function AdminStatusBadge({ status }) {
		const meta = STATUS_META_MAP[status];

		return <AdminBadge tone={meta.tone}>{meta.label}</AdminBadge>;
	}
);
export function getAdminStatusLabel(status: TUserStatus) {
	return STATUS_META_MAP[status].label;
}
