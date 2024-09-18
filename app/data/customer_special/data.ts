/* eslint-disable sort-keys */
import type {ICustomerSpecial} from './types';

export const CUSTOMER_SPECIAL_LIST = [
	{
		name: '蹦蹦跳跳的三妖精',
		dlc: 0,
		places: ['妖怪兽道', '人间之里', '博丽神社', '红魔馆', '迷途竹林', '妖怪之山'],
		price: '300-400',
		positiveTags: ['家常', '甜', '凉爽', '菌类', '小巧', '梦幻', '流行喜爱'],
		negativeTags: ['生', '灼热', '猎奇', '流行厌恶'],
		beverageTags: ['无酒精', '水果', '甘', '苦'],
		bondRewards: [],
		spellCards: {},
		positiveTagMapping: {},
	},
	{
		name: '萌澄果',
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
		],
		price: '1200-1600',
		positiveTags: ['肉', '水产', '甜', '梦幻', '流行喜爱'],
		negativeTags: ['灼热', '猎奇', '流行厌恶'],
		beverageTags: ['可加冰', '水果', '甘', '辛'],
		bondRewards: [],
		spellCards: {},
		positiveTagMapping: {},
	},
] as const satisfies ICustomerSpecial[];
