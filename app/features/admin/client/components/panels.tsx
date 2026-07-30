'use client';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Card from '@/design/ui/components/card';

interface IAdminPanelProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

export const AdminPanel = memo<IAdminPanelProps>(function AdminPanel({
	children,
	className,
}) {
	const { isHighAppearance } = useDesignPreferences();

	return (
		<Card
			as="section"
			fullWidth
			shadow="sm"
			classNames={{
				base: cn(
					'overflow-hidden p-4',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-content1/60 dark:bg-content1/50',
					className
				),
			}}
		>
			{children}
		</Card>
	);
});

interface IAdminPanelTitleProps {
	children: ReactNodeWithoutBoolean;
	className?: string;
	icon: FontAwesomeIconProps['icon'];
}

export const AdminPanelTitle = memo<IAdminPanelTitleProps>(
	function AdminPanelTitle({ children, className, icon }) {
		return (
			<div
				className={cn(
					'mb-3 flex items-center gap-2 text-small font-medium text-foreground-700',
					className
				)}
			>
				<FontAwesomeIcon icon={icon} className="w-4" />
				<span>{children}</span>
			</div>
		);
	}
);

interface IAdminPanelToolbarProps {
	actionClassName?: string;
	actions?: ReactNodeWithoutBoolean;
	children: ReactNodeWithoutBoolean;
	icon: FontAwesomeIconProps['icon'];
}

export const AdminPanelToolbar = memo<IAdminPanelToolbarProps>(
	function AdminPanelToolbar({ actionClassName, actions, children, icon }) {
		return (
			<div className="mb-4 flex min-w-0 flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
				<AdminPanelTitle className="mb-0" icon={icon}>
					{children}
				</AdminPanelTitle>
				{actions !== undefined && (
					<div
						className={cn(
							'flex w-full min-w-0 flex-col items-stretch gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end',
							actionClassName
						)}
					>
						{actions}
					</div>
				)}
			</div>
		);
	}
);

interface IAdminFilterPanelProps extends PropsWithChildren<object> {
	icon: FontAwesomeIconProps['icon'];
}

export const AdminFilterPanel = memo<IAdminFilterPanelProps>(
	function AdminFilterPanel({ children, icon }) {
		return (
			<AdminPanel>
				<AdminPanelTitle icon={icon}>筛选</AdminPanelTitle>
				<div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center">
					{children}
				</div>
			</AdminPanel>
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

interface IAdminMetricPanelProps extends PropsWithChildren<
	Pick<HTMLDivElementAttributes, 'className'>
> {}

export const AdminMetricPanel = memo<IAdminMetricPanelProps>(
	function AdminMetricPanel({ children, className }) {
		return (
			<AdminPanel className={cn('grid gap-4', className)}>
				{children}
			</AdminPanel>
		);
	}
);

interface IAdminMutedTextProps extends PropsWithChildren<object> {}

export const AdminMutedText = memo<IAdminMutedTextProps>(
	function AdminMutedText({ children }) {
		return <span className="text-foreground-400">{children}</span>;
	}
);
