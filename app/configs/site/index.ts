/* eslint-disable sort-keys */
import PACKAGE from '@/../package.json';
import type {ISiteConfig} from './types';

type TNavMenuItems = ISiteConfig['navMenuItems'];

const navItems = [
	{
		label: '首页',
		href: '/',
	},
	{
		label: '稀客',
		href: '/customer-rare',
	},
	{
		label: '普客',
		href: '/customer-normal',
	},
	{
		查询: [
			{
				label: '料理',
				href: '/recipes',
			},
			{
				label: '酒水',
				href: '/beverages',
			},
			{
				label: '食材',
				href: '/ingredients',
			},
		],
	},
	{
		label: '关于',
		href: '/about',
	},
] as const satisfies ISiteConfig['navItems'];

export const siteConfig = {
	domain: new URL(PACKAGE.homepage).hostname,
	name: '东方夜雀食堂小助手',
	shortName: '夜雀助手',
	author: {
		name: PACKAGE.author.name,
		url: PACKAGE.author.url,
	},
	description: PACKAGE.description,
	keywords: PACKAGE.keywords,
	locale: 'zh-CN',
	version: PACKAGE.version,
	navItems,
	navMenuItems: navItems.reduce<TNavMenuItems>((acc, navItem) => {
		let hasNestedArray = false as boolean;
		Object.keys(navItem).forEach((key) => {
			if (Array.isArray(navItem[key as never])) {
				hasNestedArray = true;
				acc.push(...(navItem[key as never] as TNavMenuItems));
			}
		});
		if (!hasNestedArray) {
			acc.push(navItem as TNavMenuItems[number]);
		}
		return acc;
	}, []),
	links: {
		donate: {
			label: '支付宝收款码',
			href: 'https://static.sukiu.net/assets/alipay.jpg',
		},
		github: {
			label: '本项目代码仓库',
			href: PACKAGE.repository.url,
		},
		steam: {
			label: "Steam上的东方夜雀食堂 - Touhou Mystia's Izakaya",
			href: 'https://store.steampowered.com/app/1584090/__Touhou_Mystias_Izakaya',
		},
	},
	nodeEnv: process.env.NODE_ENV,
	vercelEnv: process.env.VERCEL_ENV,
	isHosted: Boolean(process.env.HOSTED),
	isVercel: Boolean(process.env.VERCEL),
} as const satisfies ISiteConfig;
