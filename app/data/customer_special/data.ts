/* eslint-disable sort-keys */
import type {ICustomerSpecial} from './types';
import {TAG_POPULAR_NEGATIVE, TAG_POPULAR_POSITIVE} from '@/data/constant';

export const CUSTOMER_SPECIAL_LIST = [
	{
		id: 30,
		name: '萌澄果',
		description: [
			'MC幻想乡的板娘，通过“联动之门”穿越过来的异世界人，同时也担当驻夜雀食堂的形象大使，不断邀请着夜雀食堂世界的居民去MC幻想乡做客，积极的推进着两边的生态发展中。',
			null,
			null,
		],
		dlc: 0,
		places: [
			'妖怪兽道',
			'人间之里',
			'博丽神社',
			'红魔馆',
			'迷途竹林',
			'魔法森林',
			'妖怪之山',
			'命莲寺',
			'神灵庙',
			'太阳花田',
			'辉针城',
			'月之都',
			'魔界',
		],
		price: '1200-1600',
		positiveTags: ['肉', '水产', '甜', '梦幻', TAG_POPULAR_POSITIVE],
		negativeTags: ['灼热', '猎奇', TAG_POPULAR_NEGATIVE],
		beverageTags: ['可加冰', '水果', '甘', '辛'],
		collection: false,
		spellCards: {},
		positiveTagMapping: {},
	},
	{
		id: 31,
		name: '蹦蹦跳跳的三妖精',
		description: [
			'蹦蹦跳跳的三妖精讨伐大作战中的主角，通过“联动之门”穿越过来的异世界妖精。因为无尽的好奇心和行动力，在本世界也受到了大家的欢迎，看到她们就感到元气满满。',
			null,
			null,
		],
		dlc: 0,
		places: ['妖怪兽道', '人间之里', '博丽神社', '红魔馆', '迷途竹林', '妖怪之山'],
		price: '300-400',
		positiveTags: ['家常', '甜', '凉爽', '菌类', '小巧', '梦幻', TAG_POPULAR_POSITIVE],
		negativeTags: ['生', '灼热', '猎奇', TAG_POPULAR_NEGATIVE],
		beverageTags: ['无酒精', '水果', '甘', '苦'],
		collection: false,
		spellCards: {},
		positiveTagMapping: {},
	},
] as const satisfies ICustomerSpecial[];
