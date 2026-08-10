/* eslint-disable sort-keys */
import type { ILink } from '@/shared/site/contracts';

import type { TNavItem } from './contracts';

export const NAV_ITEMS = [
	{ label: '首页', href: '/' },
	{ label: '稀客', href: '/customer-rare' },
	{ label: '普客', href: '/customer-normal' },
	{
		查询: [
			{
				label: '料理',
				href: '/recipes',
				sprite: 'recipe',
				spriteIndex: 0,
			},
			{
				label: '酒水',
				href: '/beverages',
				sprite: 'beverage',
				spriteIndex: 0,
			},
			{
				label: '食材',
				href: '/ingredients',
				sprite: 'ingredient',
				spriteIndex: 0,
			},
			{
				label: '厨具',
				href: '/cookers',
				sprite: 'cooker',
				spriteIndex: 0,
			},
			{
				label: '摆件',
				href: '/ornaments',
				sprite: 'ornament',
				spriteIndex: 0,
			},
			{
				label: '衣服',
				href: '/clothes',
				sprite: 'clothes',
				spriteIndex: 2,
			},
			{
				label: '伙伴',
				href: '/partners',
				sprite: 'partner',
				spriteIndex: 0,
			},
			{
				label: '货币',
				href: '/currencies',
				sprite: 'currency',
				spriteIndex: 0,
			},
		],
	},
	{ label: '设置', href: '/preferences' },
	{ label: '关于', href: '/about' },
] as const satisfies TNavItem[];

export const NAV_MENU_ITEMS = NAV_ITEMS.flatMap<ILink>((navItem) =>
	'href' in navItem ? [navItem] : Object.values(navItem).flat()
);

type ExtractNestedHref<T> = T extends { href: infer U }
	? U
	: { [K in keyof T]: ExtractNestedHref<T[K]> }[keyof T];

export type TSitePath = ExtractStringTypes<
	ExtractNestedHref<(typeof NAV_ITEMS)[number]>
>;
