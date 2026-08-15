export const DARK_MATTER_META_MAP = {
	name: '黑暗物质',
	positiveTag: -4,
	price: 1,
} as const;

export const DYNAMIC_TAG_MAP = {
	economical: '实惠',
	expensive: '昂贵',
	largePartition: '大份',
	popularNegative: '流行厌恶',
	popularPositive: '流行喜爱',
	signature: '招牌',
} as const;

export const DYNAMIC_FOOD_TAG_MAP = {
	economical: -2,
	expensive: -3,
	largePartition: -1,
	popularNegative: -21,
	popularPositive: -20,
	signature: 19,
} as const;

/**
 * Authoritative game BeverageTag IDs and their Simplified Chinese labels.
 * BeverageTag and FoodTag are separate numeric categories even when IDs overlap.
 */
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

/**
 * Authoritative game FoodTag IDs and their Simplified Chinese labels.
 * These IDs must not be mixed with BeverageTag or Cooker category IDs.
 */
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
