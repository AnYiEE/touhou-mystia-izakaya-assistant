import type { ILink } from '@/shared/site/contracts';

export const META_MYSTIA_LINKS = {
	docs: {
		href: 'https://doc.meta-mystia.izakaya.cc/',
		label: 'MetaMystia使用文档',
	},
	download: {
		href: 'https://url.izakaya.cc/getMetaMystia',
		label: 'MetaMystia Mod管理工具',
	},
	github: {
		href: 'https://github.com/MetaMystia/MetaMystia',
		label: 'MetaMystia代码仓库',
	},
	qqGroup: {
		href: 'https://qm.qq.com/q/s0Qp3QPtOC',
		label: 'MetaMystia QQ群',
	},
} as const satisfies Record<string, ILink>;

export const META_MYSTIA_PAGE_PATH = '/pages/meta-mystia';

interface IBilibiliVideo {
	aid: string;
	title: string;
}

/** MetaMystia showcase videos on Bilibili, referenced by their av numbers. */
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

/** The player is only inserted after the viewer presses play, so it starts playing right away. */
export function getBilibiliPlayerUrl(aid: string) {
	return `https://player.bilibili.com/player.html?isOutside=true&aid=${aid}&p=1&autoplay=1`;
}

export function getBilibiliVideoUrl(aid: string) {
	return `https://www.bilibili.com/video/av${aid}/`;
}

export const META_MYSTIA_QQ_GROUP_NUMBER = '1034953242';
