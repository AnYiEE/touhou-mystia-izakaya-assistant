import { PACKAGE_METADATA } from './packageMetadata';

export const SITE_METADATA = {
	author: {
		name: PACKAGE_METADATA.author.name,
		url: PACKAGE_METADATA.author.url,
	},
	description: PACKAGE_METADATA.description,
	enName: "Touhou Mystia's Izakaya Assistant",
	id: PACKAGE_METADATA.name,
	keywords: PACKAGE_METADATA.keywords,
	/** @see {@link https://www.heroui.com/docs/api-references/heroui-provider} */
	locale: 'zh-CN',
	name: '东方夜雀食堂小助手',
	shortName: '夜雀助手',
	version: PACKAGE_METADATA.version,
} as const;
