import PACKAGE from '@/../package.json';
import type {ISiteConfig} from './types';

export const siteConfig = {
	name: '东方夜雀食堂小助手',
	shortName: '夜雀助手',
	author: {
		name: PACKAGE.author.name,
		url: PACKAGE.homepage,
	},
	description: PACKAGE.description,
	keywords: PACKAGE.keywords,
	locale: 'zh-Hans-CN',
	navItems: [
		{
			label: '首页',
			href: '/',
		},
		{
			label: '酒水',
			href: '/beverages',
		},
		{
			label: '关于',
			href: '/about',
		},
	],
	navMenuItems: [
		{
			label: '首页',
			href: '/',
		},
		{
			label: '酒水',
			href: '/beverages',
		},
		{
			label: '关于',
			href: '/about',
		},
	],
	links: {
		github: {
			label: '本项目代码仓库',
			href: PACKAGE.homepage,
		},
		steam: {
			label: "Steam上的东方夜雀食堂 - Touhou Mystia's Izakaya",
			href: 'https://store.steampowered.com/app/1584090/__Touhou_Mystias_Izakaya',
		},
	},
} as const satisfies ISiteConfig;
