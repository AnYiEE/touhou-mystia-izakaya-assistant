import type { ILink } from '@/shared/site/contracts';
import { PACKAGE_METADATA } from '@/shared/site/packageMetadata';

function getShortUrl(key: string) {
	return `${process.env.SHORT_LINK_URL ?? '/#'}/${key}`;
}

export const SITE_LINKS = {
	appQA: { href: getShortUrl('wb21Sv'), label: 'APP相关常见问题和说明' },
	china: { href: getShortUrl('tiXDNm'), label: '国内线路' },
	donate: { href: getShortUrl('HI9lxP'), label: '支付宝收款链接' },
	github: { href: PACKAGE_METADATA.repositoryUrl, label: '本项目代码仓库' },
	gnuLicense: {
		href: 'https://www.gnu.org/licenses/agpl-3.0-standalone.html',
		label: 'GNU Affero General Public License v3.0',
	},
	icpFiling: {
		href: 'https://beian.miit.gov.cn/',
		label: process.env.ICP_FILING ?? '',
	},
	index: { href: '/', label: '首页' },
	qqGroup1: { href: getShortUrl('l40oUu'), label: 'QQ一群' },
	qqGroup2: { href: getShortUrl('KCo1fT'), label: 'QQ二群' },
	rednoteGroup: { href: getShortUrl('Y9YVAt'), label: '小红书群' },
	steam: {
		href: 'https://store.steampowered.com/app/1584090/__Touhou_Mystias_Izakaya',
		label: "Steam上的东方夜雀食堂 - Touhou Mystia's Izakaya",
	},
} as const satisfies Record<string, ILink>;
