import { customPinyin, pinyin } from 'pinyin-pro';

import { memoize } from '@/shared/utilities/cache/memoize';

customPinyin(
	{
		// cSpell:disable
		冯风渡御: 'píng fēng dù yù',
		冴月麟: 'hù yuè lín',
		炸: 'zhá',
		番长服: 'fān zhǎng fú',
		访问着和服: 'fǎng wèn zhuó hé fú',
		// cSpell:enable
	},
	{ multiple: 'replace' }
);

export const getPinyin = memoize(function getPinyin(word: string) {
	const result = pinyin(word, {
		nonZh: 'removed',
		nonZhScope: /\W/u,
		toneType: 'num',
		type: 'array',
		v: true,
	}).map((string) => string.toLowerCase());

	return result;
});
