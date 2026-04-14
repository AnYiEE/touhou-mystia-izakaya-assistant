/**
 * 翻译表注册入口。
 * 在应用启动时 import 此文件，自动将所有 locale 的 UI 和数据翻译表注册到 i18n 模块。
 * zh-hans 是默认 locale，不需要翻译表。
 */

import { registerUITranslations, registerDataTranslations } from '@/i18n';

import zhHantUI from '@/i18n/locales/zh-hant';
import enUI from '@/i18n/locales/en';
import jaUI from '@/i18n/locales/ja';
import koUI from '@/i18n/locales/ko';

import { zhHantData, enData, jaData, koData } from '@/data/i18n';

registerUITranslations('zh-hant', zhHantUI);
registerUITranslations('en', enUI);
registerUITranslations('ja', jaUI);
registerUITranslations('ko', koUI);

registerDataTranslations('zh-hant', zhHantData);
registerDataTranslations('en', enData);
registerDataTranslations('ja', jaData);
registerDataTranslations('ko', koData);
