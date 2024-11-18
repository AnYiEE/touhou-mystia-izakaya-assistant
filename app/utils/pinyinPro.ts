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

export function pinyinPro(word: string) {
	return pinyin(word, {
		toneType: 'num',
		type: 'array',
		v: true,
	});
}
