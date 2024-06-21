import type {ICustomerSpecial} from './types';

export const CUSTOMER_SPECIAL_LIST = [
	{
		name: '蹦蹦跳跳的三妖精',
		dlc: 0,
		place: ['妖怪兽道', '人间之里', '博丽神社', '红魔馆', '迷途竹林', '妖怪之山'],
		price: '300-400',
		positive: ['家常', '小巧', '甜', '凉爽', '梦幻', '菌类', '流行喜爱'],
		negative: ['生', '猎奇', '灼热', '流行厌恶'],
		beverage: ['无酒精', '水果', '甘', '苦'],
	},
	{
		name: '萌澄果',
		dlc: 0,
		place: [
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
		positive: ['肉', '水产', '甜', '梦幻', '流行喜爱'],
		negative: ['猎奇', '灼热', '流行厌恶'],
		beverage: ['可加冰', '水果', '甘', '辛'],
	},
] as const satisfies ICustomerSpecial[];
