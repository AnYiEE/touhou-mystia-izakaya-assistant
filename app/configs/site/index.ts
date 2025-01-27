/* eslint-disable sort-keys */
import PACKAGE from '@/../package.json';
import type {ISiteConfig, TNavMenuItem} from './types';

function getShortUrl<T extends string>(key: T, isJson?: boolean) {
	return `${process.env.SHORT_LINK_URL ?? '/#'}/${key}${isJson ? '.json' : ''}` as const;
}

const {hostname: domain} = new URL(process.env.BASE_URL ?? PACKAGE.homepage);

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
	{
		label: '设置',
		href: '/preferences',
	},
	{
		label: '关于',
		href: '/about',
	},
] as const satisfies ISiteConfig['navItems'];

export const siteConfig = {
	domain,
	id: PACKAGE.name,
	name: '东方夜雀食堂小助手',
	enName: "Touhou Mystia's Izakaya Assistant",
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
	navMenuItems: navItems.reduce<TNavMenuItem[]>((acc, navItem) => {
		let hasNestedArray = false as boolean;
		Object.keys(navItem).forEach((key) => {
			if (Array.isArray(navItem[key as never])) {
				hasNestedArray = true;
				acc.push(...(navItem[key as never] as TNavMenuItem[]));
			}
		});
		if (!hasNestedArray) {
			acc.push(navItem as TNavMenuItem);
		}
		return acc;
	}, []),
	links: {
		appQA: {
			label: 'APP相关常见问题和说明',
			href: getShortUrl('wb21Sv'),
		},
		china: {
			label: '国内线路',
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
			label: 'GNU Affero General Public License v3.0',
			href: 'https://www.gnu.org/licenses/agpl-3.0-standalone.html',
		},
		icpFiling: {
			label: process.env.ICP_FILING ?? '',
			href: 'https://beian.miit.gov.cn/',
		},
		index: {
			label: '首页',
			href: '/',
		},
		qqGroup: {
			label: '点击加入QQ群',
			href: getShortUrl('l40oUu'),
		},
		rednoteGroup: {
			label: '扫码加入小红书群',
			href: getShortUrl('Y9YVAt'),
		},
		steam: {
			label: "Steam上的东方夜雀食堂 - Touhou Mystia's Izakaya",
			href: 'https://store.steampowered.com/app/1584090/__Touhou_Mystias_Izakaya',
		},
		wxGroup: {
			label: '扫码加入微信群',
			href: getShortUrl('3hGM9A', true),
		},
	},
	cdnUrl: process.env.CDN_URL ?? '',
	analyticsApiUrl: process.env.ANALYTICS_API_URL ?? '',
	analyticsScriptUrl: process.env.ANALYTICS_SCRIPT_URL ?? '',
	analyticsSiteId: process.env.ANALYTICS_SITE_ID ?? '',
	isAnalytics: Boolean(process.env.ANALYTICS_SITE_ID),
	isIcpFiling: Boolean(process.env.ICP_FILING),
	nodeEnv: process.env.NODE_ENV,
	vercelEnv: process.env.VERCEL_ENV,
	vercelSha: process.env.VERCEL_GIT_COMMIT_SHA,
	isProduction: process.env.NODE_ENV === 'production',
	isSelfHosted: Boolean(process.env.SELF_HOSTED),
	isVercel: Boolean(process.env.VERCEL),
} as const satisfies ISiteConfig;

export type {TSitePath} from './types';
