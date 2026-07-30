import { faCircleInfo, faGear } from '@fortawesome/free-solid-svg-icons';
import { type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

import type { TSpriteTarget } from '@/domain/data/sprites/types';

import { NAV_ITEMS } from '@/features/appShell/navigation/config';

const navItems = NAV_ITEMS;

export interface IMobileIconNavItem {
	href: string;
	icon: FontAwesomeIconProps['icon'];
	label: string;
}

export interface IMobileSpriteNavItem {
	href: string;
	label: string;
	sprite: TSpriteTarget;
	spriteIndex: number;
}

export const MOBILE_CUSTOMER_NAV_ITEMS = [
	{
		href: '/customer-rare',
		label: '稀客',
		sprite: 'customer_rare',
		spriteIndex: 0,
	},
	{
		href: '/customer-normal',
		label: '普客',
		sprite: 'customer_normal',
		spriteIndex: 0,
	},
] as const satisfies ReadonlyArray<IMobileSpriteNavItem>;

export const MOBILE_UTILITY_NAV_ITEMS = [
	{ href: '/preferences', icon: faGear, label: '设置' },
	{ href: '/about', icon: faCircleInfo, label: '关于' },
] as const satisfies ReadonlyArray<IMobileIconNavItem>;

export const MOBILE_QUERY_NAV_GROUPS = navItems.flatMap((navItem) => {
	if ('href' in navItem) {
		return [];
	}

	return Object.entries(navItem).map(([label, items]) => ({ items, label }));
});
