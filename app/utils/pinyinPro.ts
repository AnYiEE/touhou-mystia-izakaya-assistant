/* eslint-disable sort-keys */
import {customPinyin} from 'pinyin-pro';

customPinyin(
	{
		// cSpell:disable
		番长服: 'fān zhǎng fú',
		访问着和服: 'fǎng wèn zhuó hé fú',
		冴月麟: 'hù yuè lín',
		// cSpell:enable
	},
	{
		multiple: 'replace',
	}
);

export {pinyin as pinyinPro} from 'pinyin-pro';
