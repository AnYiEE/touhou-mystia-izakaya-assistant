'use client';

import {
	faClipboardList,
	faClockRotateLeft,
	faKey,
	faListCheck,
	faRotate,
	faServer,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Link from '@/design/ui/components/link';

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
		const { isHighAppearance } = useDesignPreferences();

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
