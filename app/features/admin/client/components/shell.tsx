'use client';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { type ComponentProps, type PropsWithChildren, memo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button, { type IButtonProps } from '@/design/ui/components/button';
import Card from '@/design/ui/components/card';
import Link from '@/design/ui/components/link';

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
				'min-h-main-content min-w-0 space-y-5 text-foreground',
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
	const { isHighAppearance } = useDesignPreferences();

	return (
		<Card
			as="header"
			fullWidth
			shadow="sm"
			classNames={{
				base: cn(
					'flex flex-col gap-3 space-y-0 p-4 lg:flex-row lg:items-center lg:justify-between',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-content1/60 dark:bg-content1/50'
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

interface IAdminHeaderActionLinkProps extends PropsWithChildren<object> {
	color?: IButtonProps['color'];
	href: string;
	icon?: FontAwesomeIconProps['icon'];
	onPress?: ComponentProps<typeof Link>['onPress'] | undefined;
}

export const AdminHeaderActionLink = memo<IAdminHeaderActionLinkProps>(
	function AdminHeaderActionLink({ children, color, href, icon, onPress }) {
		return (
			<Button
				as={Link}
				animationUnderline={false}
				href={href}
				startContent={
					icon === undefined ? undefined : (
						<FontAwesomeIcon icon={icon} className="w-3.5" />
					)
				}
				variant="flat"
				{...(color === undefined ? {} : { color })}
				{...(onPress === undefined ? {} : { onPress })}
			>
				{children}
			</Button>
		);
	}
);

interface IAdminHeaderActionButtonProps extends PropsWithChildren<object> {
	color?: IButtonProps['color'];
	icon?: FontAwesomeIconProps['icon'];
	isDisabled?: boolean;
	isLoading?: boolean;
	onPress: NonNullable<IButtonProps['onPress']>;
}

export const AdminHeaderActionButton = memo<IAdminHeaderActionButtonProps>(
	function AdminHeaderActionButton({
		children,
		color,
		icon,
		isDisabled = false,
		isLoading = false,
		onPress,
	}) {
		const startContent =
			isLoading || icon === undefined ? undefined : (
				<FontAwesomeIcon icon={icon} className="w-3.5" />
			);

		return (
			<Button
				isDisabled={isDisabled}
				isLoading={isLoading}
				variant="flat"
				onPress={onPress}
				{...(color === undefined ? {} : { color })}
				{...(startContent === undefined ? {} : { startContent })}
			>
				{children}
			</Button>
		);
	}
);
