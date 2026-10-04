import { type Metadata } from 'next';

import {
	META_MYSTIA_GUESTS,
	META_MYSTIA_SHOWCASE_GROUPS,
} from '@/features/metaMystia/content';

import { SITE_METADATA } from '@/shared/site/metadata';

const { keywords } = SITE_METADATA;

const {
	beverages: { records: beverages },
	clothes: { records: clothes },
	foods: { records: foods },
	ingredients: { records: ingredients },
} = META_MYSTIA_SHOWCASE_GROUPS;

export const metadata: Metadata = {
	title: 'MetaMystia - 东方夜雀食堂联机Mod',

	description: `MetaMystia是为《东方夜雀食堂》制作的非官方Mod，支持多人联机共同经营食堂；示例资源包新增${META_MYSTIA_GUESTS.length}位稀客、${foods.length}道料理、${ingredients.length}种食材、${beverages.length}款酒水和${clothes.length}套服装，并提供皮肤系统与一键安装工具。`,
	keywords: keywords.toSpliced(
		18,
		Infinity,
		'MetaMystia',
		'东方夜雀食堂联机',
		'夜雀食堂联机',
		'夜雀食堂多人',
		'东方夜雀食堂Mod',
		'夜雀食堂Mod',
		'ResourceEx内容扩展',
		'夜雀食堂新稀客',
		'夜雀食堂皮肤'
	),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
