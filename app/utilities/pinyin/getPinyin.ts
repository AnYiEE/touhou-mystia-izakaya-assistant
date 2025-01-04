/* eslint-disable sort-keys */
import {customPinyin, pinyin} from 'pinyin-pro';

customPinyin(
	{
		// cSpell:disable
		番长服: 'fān zhǎng fú',
		访问着和服: 'fǎng wèn zhuó hé fú',
		冴月麟: 'hù yuè lín',
		冯风渡御: 'píng fēng dù yù',
		// cSpell:enable
	},
	{
		multiple: 'replace',
	}
);

const pinyinCache = new Map<string, string[]>();

export function getPinyin(word: string) {
	if (pinyinCache.has(word)) {
		return pinyinCache.get(word);
	}

	const result = pinyin(word, {
		toneType: 'num',
		type: 'array',
		v: true,
	});

	pinyinCache.set(word, result);

	return result;
}
