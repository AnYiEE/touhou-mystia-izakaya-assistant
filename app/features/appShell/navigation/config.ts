import type { ILink } from '@/shared/site/contracts';

import type { TNavItem } from './contracts';

export const NAV_ITEMS = [
	{ href: '/', label: '首页' },
	{ href: '/special-guests', label: '稀客' },
	{ href: '/normal-guests', label: '普客' },
	{
		查询: [
			{
				href: '/foods',
				label: '料理',
				sprite: 'food',
				spriteRecordId: 0,
			},
			{
				href: '/beverages',
				label: '酒水',
				sprite: 'beverage',
				spriteRecordId: 0,
			},
			{
				href: '/ingredients',
				label: '食材',
				sprite: 'ingredient',
				spriteRecordId: 0,
			},
			{
				href: '/cookers',
				label: '厨具',
				sprite: 'cooker',
				spriteRecordId: 0,
			},
			{
				href: '/decorations',
				label: '摆件',
				sprite: 'decoration',
				spriteRecordId: 32,
			},
			{
				href: '/clothes',
				label: '衣服',
				sprite: 'clothes',
				spriteRecordId: 23,
			},
			{
				href: '/partners',
				label: '伙伴',
				sprite: 'partner',
				spriteRecordId: 14,
			},
			{
				href: '/currencies',
				label: '货币',
				sprite: 'currency_item',
				spriteRecordId: 3,
			},
			{
				href: '/items',
				label: '道具',
				sprite: 'item',
				spriteRecordId: 52,
			},
			{
				href: '/records',
				label: '唱片',
				sprite: 'record',
				spriteRecordId: 11,
			},
			{
				href: '/fishing-collectibles',
				label: '垂钓收藏',
				sprite: 'trophy',
				spriteRecordId: 4100,
			},
			{
				href: '/badges',
				label: '徽章',
				sprite: 'badge',
				spriteRecordId: 1000,
			},
		],
	},
	{ href: '/preferences', label: '设置' },
	{ href: '/about', label: '关于' },
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
