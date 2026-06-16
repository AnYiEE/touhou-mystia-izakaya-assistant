'use client';

import { type ReactNode, memo } from 'react';

import {
	faCircleInfo,
	faKey,
	faRightToBracket,
	faShieldHalved,
	faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { Card, type ICardProps, cn } from '@/design/ui/components';

import { globalStore as store } from '@/stores';

type TAuthorizePanelTone = 'danger' | 'primary' | 'warning';

interface IAuthorizePanelProps extends Omit<ICardProps, 'children' | 'title'> {
	children: ReactNode;
	icon?: IconDefinition;
	subtitle: ReactNode;
	title?: ReactNode;
	tone?: TAuthorizePanelTone;
}

interface IAuthorizeNoticeProps {
	children: ReactNode;
	icon?: IconDefinition;
	tone?: TAuthorizePanelTone;
}

interface IAuthorizeDetailRowProps {
	label: ReactNode;
	value: ReactNode;
}

const toneClassNames: Record<
	TAuthorizePanelTone,
	{ icon: string; notice: string }
> = {
	danger: {
		icon: 'bg-danger/10 text-danger-600 dark:text-danger',
		notice: 'bg-danger/10 text-danger-700 dark:text-danger',
	},
	primary: {
		icon: 'bg-primary/10 text-primary-600',
		notice: 'bg-primary/10 text-primary-700 dark:text-primary-500',
	},
	warning: {
		icon: 'bg-warning/10 text-warning-700 dark:text-warning-600',
		notice: 'bg-warning/10 text-warning-700 dark:text-warning-600',
	},
};

export const authorizePanelIcons = {
	error: faTriangleExclamation,
	login: faRightToBracket,
	password: faKey,
	shield: faShieldHalved,
} as const;

export default memo<IAuthorizePanelProps>(function SsoAuthorizePanel({
	children,
	classNames,
	icon = faShieldHalved,
	subtitle,
	title = 'SSO授权',
	tone = 'primary',
	...props
}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<Card
			fullWidth
			shadow="sm"
			classNames={{
				...classNames,
				base: cn(
					'!transition motion-reduce:!transition-none',
					{ 'bg-content1/40 backdrop-blur': isHighAppearance },
					classNames?.base
				),
			}}
			{...props}
		>
			<div className="space-y-5 p-4">
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<div
						className={cn(
							'flex h-10 w-10 shrink-0 items-center justify-center rounded-small',
							subtitle !== undefined && 'mt-0.5',
							toneClassNames[tone].icon
						)}
					>
						<FontAwesomeIcon icon={icon} className="w-4" />
					</div>
					<div className="min-w-0 space-y-1">
						<h1 className="break-words text-xl font-semibold leading-7 text-foreground-900">
							{title}
						</h1>
						<p className="break-words text-small leading-5 text-foreground-500">
							{subtitle}
						</p>
					</div>
				</div>
				{children}
			</div>
		</Card>
	);
});

export const SsoAuthorizeNotice = memo<IAuthorizeNoticeProps>(
	function SsoAuthorizeNotice({
		children,
		icon = faCircleInfo,
		tone = 'primary',
	}) {
		return (
			<div
				className={cn(
					'flex items-start gap-2 rounded-small px-3 py-2 text-small leading-6',
					toneClassNames[tone].notice
				)}
			>
				<FontAwesomeIcon icon={icon} className="mt-1 w-4 shrink-0" />
				<p>{children}</p>
			</div>
		);
	}
);

export const SsoAuthorizeDetailList = memo<{ children: ReactNode }>(
	function SsoAuthorizeDetailList({ children }) {
		return (
			<div className="divide-y divide-default-200/80 rounded-small border border-default-200/80 bg-default/30 text-small">
				{children}
			</div>
		);
	}
);

export const SsoAuthorizeDetailRow = memo<IAuthorizeDetailRowProps>(
	function SsoAuthorizeDetailRow({ label, value }) {
		return (
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2">
				<span className="text-foreground-500">{label}</span>
				<span className="min-w-0 break-all text-right font-medium text-foreground-800">
					{value}
				</span>
			</div>
		);
	}
);
