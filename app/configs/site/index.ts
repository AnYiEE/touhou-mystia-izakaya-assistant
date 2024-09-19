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
				sprite: 'recipe',
			},
			{
				label: '酒水',
				href: '/beverages',
				sprite: 'beverage',
			},
			{
				label: '食材',
				href: '/ingredients',
				sprite: 'ingredient',
			},
			{
				label: '厨具',
				href: '/cookers',
				sprite: 'cooker',
			},
			{
				label: '摆件',
				href: '/ornaments',
				sprite: 'ornament',
			},
		],
	},
	{
		label: '设置',
		href: '/preferences',
	},
	{
		label: '关于',
		href: '/about',
	},
] as const satisfies ISiteConfig['navItems'];

const {hostname: domain} = new URL(PACKAGE.homepage);

const getShortUrl = (key: string) => `https://url.${domain}/${key}`;

export const siteConfig = {
	domain,
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
		backup: {
			label: '备用线路',
			href: getShortUrl('tiXDNm'),
		},
		donate: {
			label: '支付宝收款链接',
			href: getShortUrl('HI9lxP'),
		},
		github: {
			label: '本项目代码仓库',
			href: PACKAGE.repository.url,
		},
		gnuLicense: {
			label: 'The GNU General Public License v3.0',
			href: 'https://www.gnu.org/licenses/gpl-3.0-standalone.html',
		},
		index: {
			label: '首页',
			href: '/',
		},
		qqGroup: {
			label: '点击加入QQ群',
			href: getShortUrl('l40oUu'),
		},
		steam: {
			label: "Steam上的东方夜雀食堂 - Touhou Mystia's Izakaya",
			href: 'https://store.steampowered.com/app/1584090/__Touhou_Mystias_Izakaya',
		},
		xiaohongshuGroup: {
			label: '点击加入小红书群',
			href: getShortUrl('Y9YVAt'),
		},
	},
	nodeEnv: process.env.NODE_ENV,
	vercelEnv: process.env.VERCEL_ENV,
	isHosted: Boolean(process.env.HOSTED),
	isVercel: Boolean(process.env.VERCEL),
} as const satisfies ISiteConfig;
