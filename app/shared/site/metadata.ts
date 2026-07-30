/* eslint-disable sort-keys */
import { PACKAGE_METADATA } from './packageMetadata';

export const SITE_METADATA = {
	id: PACKAGE_METADATA.name,
	name: '东方夜雀食堂小助手',
	enName: "Touhou Mystia's Izakaya Assistant",
	shortName: '夜雀助手',
	author: {
		name: PACKAGE_METADATA.author.name,
		url: PACKAGE_METADATA.author.url,
	},
	description: PACKAGE_METADATA.description,
	keywords: PACKAGE_METADATA.keywords,
	/** @see {@link https://www.heroui.com/docs/api-references/heroui-provider} */
	locale: 'zh-CN',
	version: PACKAGE_METADATA.version,
} as const;
