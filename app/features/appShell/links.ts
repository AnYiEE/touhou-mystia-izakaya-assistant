/* eslint-disable sort-keys */
import type { ILink } from '@/shared/site/contracts';
import { PACKAGE_METADATA } from '@/shared/site/packageMetadata';

function getShortUrl(key: string) {
	return `${process.env.SHORT_LINK_URL ?? '/#'}/${key}`;
}

export const SITE_LINKS = {
	appQA: { label: 'APP相关常见问题和说明', href: getShortUrl('wb21Sv') },
	china: { label: '国内线路', href: getShortUrl('tiXDNm') },
	donate: { label: '支付宝收款链接', href: getShortUrl('HI9lxP') },
	github: { label: '本项目代码仓库', href: PACKAGE_METADATA.repositoryUrl },
	gnuLicense: {
		label: 'GNU Affero General Public License v3.0',
		href: 'https://www.gnu.org/licenses/agpl-3.0-standalone.html',
	},
	icpFiling: {
		label: process.env.ICP_FILING ?? '',
		href: 'https://beian.miit.gov.cn/',
	},
	index: { label: '首页', href: '/' },
	qqGroup1: { label: 'QQ一群', href: getShortUrl('l40oUu') },
	qqGroup2: { label: 'QQ二群', href: getShortUrl('KCo1fT') },
	rednoteGroup: { label: '小红书群', href: getShortUrl('Y9YVAt') },
	steam: {
		label: "Steam上的东方夜雀食堂 - Touhou Mystia's Izakaya",
		href: 'https://store.steampowered.com/app/1584090/__Touhou_Mystias_Izakaya',
	},
} as const satisfies Record<string, ILink>;
