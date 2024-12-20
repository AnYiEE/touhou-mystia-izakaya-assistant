export const LABEL_BR = '{{br}}';
export const LABEL_DLC_0 = '游戏本体';

export const BEVERAGE_TAG_MAP = {
	[-1]: '无酒精',
	0: '低酒精',
	1: '中酒精',
	2: '高酒精',
	3: '可加冰',
	4: '可加热',
	5: '烧酒',
	6: '清酒',
	7: '鸡尾酒',
	8: '西洋酒',
	9: '利口酒',
	10: '啤酒',
	11: '直饮',
	12: '水果',
	13: '甘',
	14: '辛',
	15: '苦',
	16: '气泡',
	17: '古典',
	18: '现代',
	19: '提神',
} as const;

export const FOOD_TAG_MAP = {
	[-21]: '流行厌恶',
	[-20]: '流行喜爱',
	[-4]: '黑暗物质',
	[-3]: '昂贵',
	[-2]: '实惠',
	[-1]: '大份',
	0: '肉',
	1: '水产',
	2: '素',
	3: '家常',
	4: '高级',
	5: '传说',
	6: '重油',
	7: '清淡',
	8: '下酒',
	9: '饱腹',
	10: '山珍',
	11: '海味',
	12: '和风',
	13: '西式',
	14: '中华',
	15: '咸',
	16: '鲜',
	17: '甜',
	18: '生',
	19: '招牌',
	20: '适合拍照',
	21: '凉爽',
	22: '灼热',
	23: '力量涌现',
	24: '猎奇',
	25: '文化底蕴',
	26: '菌类',
	27: '不可思议',
	28: '小巧',
	29: '梦幻',
	30: '特产',
	31: '果味',
	32: '汤羹',
	33: '烧烤',
	34: '辣',
	35: '燃起来了',
	2000: '酸',
	4000: '忧郁之毒',
	4001: '毒',
	5000: '天罚',
} as const;

export const COOKER_CATEGORY_MAP = {
	[-1]: 'DLC',
	0: '初始',
	1: '夜雀',
	2: '超',
	3: '极',
	4: '核能',
	5: '可疑',
	6: '月见',
} as const;

export const COOKER_TYPE_MAP = {
	0: '煮锅',
	1: '烧烤架',
	2: '油锅',
	3: '蒸锅',
	4: '料理台',
} as const;

export const INGREDIENT_TYPE_MAP = {
	[-1]: '其他',
	0: '肉类',
	1: '海鲜',
	2: '蔬菜',
} as const;

export const PLACE_MAP = {
	0: '妖怪兽道',
	1: '人间之里',
	2: '博丽神社',
	3: '红魔馆',
	4: '迷途竹林',
	1000: '魔法森林',
	1001: '妖怪之山',
	2000: '旧地狱',
	2001: '地灵殿',
	3000: '命莲寺',
	3001: '神灵庙',
	4000: '太阳花田',
	4001: '辉针城',
	5000: '月之都',
	5001: '魔界',
} as const;

export const SPEED_MAP = {
	[-1]: '瞬间移动',
	0: '慢',
	1: '中等',
	2: '快',
} as const;

export const DARK_MATTER_NAME = FOOD_TAG_MAP[-4];
export const DARK_MATTER_PRICE = 1;
export const DARK_MATTER_TAG = FOOD_TAG_MAP[-4];

export const TAG_ECONOMICAL = FOOD_TAG_MAP[-2];
export const TAG_EXPENSIVE = FOOD_TAG_MAP[-3];
export const TAG_LARGE_PARTITION = FOOD_TAG_MAP[-1];
export const TAG_POPULAR_NEGATIVE = FOOD_TAG_MAP[-21];
export const TAG_POPULAR_POSITIVE = FOOD_TAG_MAP[-20];
export const TAG_SIGNATURE = FOOD_TAG_MAP[19];
