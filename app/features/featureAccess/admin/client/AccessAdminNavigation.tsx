'use client';

import {
	faCubes,
	faDoorOpen,
	faLayerGroup,
	faUserLock,
	faUserShield,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { usePathname } from 'next/navigation';

import {
	AdminOperationNav,
	type IAdminOperationNavItem,
} from '@/features/admin/client/components/operationNav';

const LINKS = [
	{ href: '/admin/access', icon: faDoorOpen, label: '总览', match: 'exact' },
	{
		href: '/admin/access/modules',
		icon: faCubes,
		label: '功能模块',
		match: 'prefix',
	},
	{
		href: '/admin/access/apps',
		icon: faUserShield,
		label: 'SSO应用',
		match: 'prefix',
	},
	{
		href: '/admin/access/groups',
		icon: faLayerGroup,
		label: '授权组',
		match: 'prefix',
	},
	{
		href: '/admin/access/users',
		icon: faUserLock,
		label: '用户访问',
		match: 'prefix',
	},
	{ href: '/admin', icon: faUsers, label: '用户管理', match: 'exact' },
] as const satisfies ReadonlyArray<IAdminOperationNavItem>;

export function AccessAdminNavigation() {
	const pathname = usePathname();

	return (
		<AdminOperationNav
			activeHref={pathname}
			ariaLabel="功能访问导航"
			items={LINKS}
		/>
	);
}
