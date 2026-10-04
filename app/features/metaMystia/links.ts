import type { ILink } from '@/shared/site/contracts';

export const META_MYSTIA_LINKS = {
	docs: {
		href: 'https://doc.meta-mystia.izakaya.cc/',
		label: 'MetaMystia使用文档',
	},
	download: {
		href: 'https://doc.meta-mystia.izakaya.cc/user_guide/how_to_install.html',
		label: 'MetaMystia安装指南',
	},
	github: {
		href: 'https://github.com/MetaMystia/MetaMystia',
		label: 'MetaMystia代码仓库',
	},
	qqGroup: {
		href: 'https://url.izakaya.cc/lKd681',
		label: 'MetaMystia QQ群',
	},
} as const satisfies Record<string, ILink>;

export const META_MYSTIA_PAGE_PATH = '/pages/meta-mystia';

interface IBilibiliVideo {
	aid: string;
	title: string;
}

export const META_MYSTIA_VIDEOS = [
	{
		aid: '116358163464340',
		title: '【东方/mod开发】什么叫厨师比顾客多？！十人同屏的夜雀食堂多人联机 MetaMystia',
	},
	{
		aid: '116493236961425',
		title: '【东方/mod开发】十六人联机 & 新服装新剧情 | 东方夜雀食堂联机mod开发日记 (十一)',
	},
] as const satisfies ReadonlyArray<IBilibiliVideo>;

/**
 * Bilibili player embed URL for an av number.
 * The external player defaults to autoplay on, so it is disabled explicitly; `poster=1` keeps the cover visible until playback starts.
 */
export function getBilibiliPlayerUrl(aid: string) {
	return `https://player.bilibili.com/player.html?isOutside=true&aid=${aid}&p=1&autoplay=0&poster=1`;
}

export function getBilibiliVideoUrl(aid: string) {
	return `https://www.bilibili.com/video/av${aid}/`;
}

export const META_MYSTIA_QQ_GROUP_NUMBER = '1034953242';
