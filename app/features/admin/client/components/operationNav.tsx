'use client';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Link from '@/design/ui/components/link';

export interface IAdminOperationNavItem {
	href: string;
	icon?: FontAwesomeIconProps['icon'];
	label: string;
	match?: 'exact' | 'prefix';
}

interface IAdminOperationNavProps {
	activeHref: string;
	ariaLabel: string;
	items: ReadonlyArray<IAdminOperationNavItem>;
}

export const AdminOperationNav = memo<IAdminOperationNavProps>(
	function AdminOperationNav({ activeHref, ariaLabel, items }) {
		const { isHighAppearance } = useDesignPreferences();

		return (
			<nav
				aria-label={ariaLabel}
				className={cn(
					'grid grid-cols-2 gap-2 rounded-small border border-default-200/80 px-3 py-2 text-small text-foreground-500 sm:grid-cols-3 xl:grid-cols-6',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-default-50/50 dark:bg-default-100/10'
				)}
			>
				{items.map((item) => {
					const isActive =
						item.match === 'prefix'
							? activeHref.startsWith(item.href)
							: activeHref === item.href;

					return (
						<Button
							key={item.href}
							as={Link}
							animationUnderline={false}
							className="w-full min-w-0 px-3"
							color={isActive ? 'primary' : 'default'}
							href={item.href}
							startContent={
								item.icon === undefined ? undefined : (
									<FontAwesomeIcon
										icon={item.icon}
										className="w-3.5"
									/>
								)
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
