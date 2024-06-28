import PACKAGE from '@/../package.json';
import type {ISiteConfig} from './types';

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
	{
		label: '关于',
		href: '/about',
	},
] as const satisfies ISiteConfig['navItems'];

export const siteConfig = {
	name: '东方夜雀食堂小助手',
	shortName: '夜雀助手',
	author: {
		name: PACKAGE.author.name,
		url: PACKAGE.author.url,
	},
	description: PACKAGE.description,
	keywords: PACKAGE.keywords,
	locale: 'zh-Hans-CN',
	version: PACKAGE.version,
	navItems: [...navItems],
	navMenuItems: [...navItems],
	links: {
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
	isVercel: Boolean(process.env.VERCEL),
} as const satisfies ISiteConfig;
