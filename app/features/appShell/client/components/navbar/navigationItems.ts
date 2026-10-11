import { faCircleInfo, faGear } from '@fortawesome/free-solid-svg-icons';
import { type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

import {
	NAV_ITEMS,
	type TSitePath,
} from '@/features/appShell/navigation/config';
import type { TSpriteNavigationItem } from '@/features/appShell/navigation/contracts';

const navItems = NAV_ITEMS;

export interface IMobileIconNavItem {
	href: TSitePath;
	icon: FontAwesomeIconProps['icon'];
}

export type TMobileSpriteNavItem = TSpriteNavigationItem<TSitePath>;

export const MOBILE_GUEST_NAV_ITEMS = [
	{
		href: '/special-guests',
		label: '稀客',
		sprite: 'special_guest',
		spriteRecordId: 0,
	},
	{
		href: '/normal-guests',
		label: '普客',
		sprite: 'normal_guest',
		spriteRecordId: 0,
	},
] as const satisfies ReadonlyArray<TMobileSpriteNavItem>;

export const MOBILE_UTILITY_NAV_ITEMS = [
	{ href: '/preferences', icon: faGear },
	{ href: '/about', icon: faCircleInfo },
] as const satisfies ReadonlyArray<IMobileIconNavItem>;

export const MOBILE_QUERY_NAV_GROUPS = navItems.flatMap((navItem) => {
	if ('href' in navItem) {
		return [];
	}

	return Object.entries(navItem).map(([label, items]) => ({ items, label }));
});
