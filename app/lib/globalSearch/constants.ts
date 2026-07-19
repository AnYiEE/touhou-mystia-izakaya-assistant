import type {
	IGlobalSearchExampleQuery,
	IGlobalSearchFieldPrefixGroup,
	IGlobalSearchSectionPrefixGroup,
	TGlobalSearchIndexSection,
	TGlobalSearchSection,
} from './types';

export const GLOBAL_SEARCH_CUSTOMER_SECTIONS = [
	'customer-normal',
	'customer-rare',
] as const satisfies ReadonlyArray<TGlobalSearchSection>;

export function checkGlobalSearchSectionMatches(
	querySection: TGlobalSearchSection,
	itemSection: TGlobalSearchSection
) {
	return querySection === 'customers'
		? GLOBAL_SEARCH_CUSTOMER_SECTIONS.includes(
				itemSection as (typeof GLOBAL_SEARCH_CUSTOMER_SECTIONS)[number]
			)
		: querySection === itemSection;
}

export function checkGlobalSearchFieldTypeMatches(
	queryFieldType: IGlobalSearchFieldPrefixGroup['key'],
	itemFieldType: IGlobalSearchFieldPrefixGroup['key']
) {
	if (queryFieldType === 'spell-card') {
		return (
			itemFieldType === 'positive-spell-card' ||
			itemFieldType === 'negative-spell-card'
		);
	}

	if (queryFieldType === 'speed') {
		return (
			itemFieldType === 'moving-speed' ||
			itemFieldType === 'working-speed'
		);
	}

	return queryFieldType === itemFieldType;
}

export const GLOBAL_SEARCH_SECTION_PREFIX_GROUPS = [
	{
		aliases: ['料理', '食谱', 'recipe', 'recipes'],
		key: 'recipes',
		label: '料理',
		order: 10,
		spriteTarget: 'recipe',
	},
	{
		aliases: ['酒水', '饮品', 'beverage', 'beverages', 'drink', 'drinks'],
		key: 'beverages',
		label: '酒水',
		order: 20,
		spriteTarget: 'beverage',
	},
	{
		aliases: ['食材', 'ingredient', 'ingredients'],
		key: 'ingredients',
		label: '食材',
		order: 30,
		spriteTarget: 'ingredient',
	},
	{
		aliases: ['厨具', 'cooker', 'cookers'],
		key: 'cookers',
		label: '厨具',
		order: 40,
		spriteTarget: 'cooker',
	},
	{
		aliases: ['摆件', '道具', 'ornament', 'ornaments'],
		key: 'ornaments',
		label: '摆件',
		order: 50,
		spriteTarget: 'ornament',
	},
	{
		aliases: ['衣服', '服装', '皮肤', 'clothes', 'clothing'],
		key: 'clothes',
		label: '衣服',
		order: 60,
		spriteTarget: 'clothes',
	},
	{
		aliases: ['伙伴', 'partner', 'partners'],
		key: 'partners',
		label: '伙伴',
		order: 70,
		spriteTarget: 'partner',
	},
	{
		aliases: ['货币', 'currency', 'currencies'],
		key: 'currencies',
		label: '货币',
		order: 80,
		spriteTarget: 'currency',
	},
	{
		aliases: ['顾客', '客人', 'customer', 'customers'],
		key: 'customers',
		label: '顾客',
		order: 85,
	},
	{
		aliases: [
			'稀客',
			'稀有顾客',
			'特殊顾客',
			'rare',
			'customer-rare',
			'customer-special',
		],
		key: 'customer-rare',
		label: '稀客',
		order: 90,
		spriteTarget: 'customer_rare',
	},
	{
		aliases: ['普客', '普通顾客', 'normal', 'customer-normal'],
		key: 'customer-normal',
		label: '普客',
		order: 100,
		spriteTarget: 'customer_normal',
	},
	{
		aliases: ['设置', '偏好', 'setting', 'settings', 'preferences'],
		key: 'preferences',
		label: '设置',
		order: 110,
	},
] as const satisfies ReadonlyArray<IGlobalSearchSectionPrefixGroup>;

export const GLOBAL_SEARCH_FIELD_PREFIX_GROUPS = [
	{
		aliases: ['名称', '名字', 'name'],
		key: 'name',
		label: '名称',
		order: 10,
		standalone: true,
	},
	{
		aliases: ['简介', '描述', '说明', 'description', 'desc'],
		key: 'description',
		label: '简介',
		order: 20,
		standalone: true,
	},
	{
		aliases: ['标签', 'tag', 'tags'],
		key: 'tag',
		label: '标签',
		order: 30,
		sections: ['beverages', 'ingredients', 'recipes'],
		standalone: true,
	},
	{
		aliases: ['标签', 'tag', 'tags'],
		key: 'customer-tag',
		label: '标签',
		order: 35,
		sections: ['customer-normal', 'customer-rare', 'customers'],
		standalone: false,
	},
	{
		aliases: [
			'喜好',
			'喜欢',
			'正特性',
			'正面标签',
			'like',
			'positive-tag',
			'positive-tags',
			'positive',
		],
		key: 'positive-tag',
		label: '正特性',
		order: 40,
		sectionAliases: {
			'customer-normal': [
				'喜好',
				'喜欢',
				'like',
				'positive-tag',
				'positive-tags',
				'positive',
			],
			'customer-rare': [
				'喜好',
				'喜欢',
				'like',
				'positive-tag',
				'positive-tags',
				'positive',
			],
			customers: [
				'喜好',
				'喜欢',
				'like',
				'positive-tag',
				'positive-tags',
			],
			recipes: [
				'正特性',
				'正面标签',
				'positive-tag',
				'positive-tags',
				'positive',
			],
		},
		sectionLabels: {
			'customer-normal': '喜好',
			'customer-rare': '喜好',
			customers: '喜好',
			recipes: '正特性',
		},
		sections: ['customer-normal', 'customer-rare', 'customers', 'recipes'],
		standalone: true,
	},
	{
		aliases: [
			'厌恶',
			'讨厌',
			'反特性',
			'负面标签',
			'dislike',
			'hate',
			'negative-tag',
			'negative-tags',
			'negative',
		],
		key: 'negative-tag',
		label: '反特性',
		order: 50,
		sectionAliases: {
			'customer-rare': [
				'厌恶',
				'讨厌',
				'dislike',
				'hate',
				'negative-tag',
				'negative-tags',
				'negative',
			],
			customers: [
				'厌恶',
				'讨厌',
				'dislike',
				'hate',
				'negative-tag',
				'negative-tags',
			],
			recipes: [
				'反特性',
				'负面标签',
				'negative-tag',
				'negative-tags',
				'negative',
			],
		},
		sectionLabels: {
			'customer-rare': '厌恶',
			customers: '厌恶',
			recipes: '反特性',
		},
		sections: ['customer-rare', 'customers', 'recipes'],
		standalone: true,
	},
	{
		aliases: [
			'酒水偏好',
			'饮品偏好',
			'酒水标签',
			'饮品标签',
			'beverage-tag',
			'beverage-tags',
		],
		key: 'beverage-tag',
		label: '酒水标签',
		order: 60,
		sectionAliases: {
			beverages: [
				'酒水标签',
				'饮品标签',
				'beverage-tag',
				'beverage-tags',
			],
			'customer-normal': [
				'酒水偏好',
				'饮品偏好',
				'beverage-tag',
				'beverage-tags',
			],
			'customer-rare': [
				'酒水偏好',
				'饮品偏好',
				'beverage-tag',
				'beverage-tags',
			],
			customers: [
				'酒水偏好',
				'饮品偏好',
				'beverage-tag',
				'beverage-tags',
			],
		},
		sectionLabels: {
			beverages: '酒水标签',
			'customer-normal': '酒水偏好',
			'customer-rare': '酒水偏好',
			customers: '酒水偏好',
		},
		sections: [
			'customer-normal',
			'customer-rare',
			'customers',
			'beverages',
		],
		standalone: true,
	},
	{
		aliases: ['食材', 'ingredient', 'ingredients'],
		key: 'ingredient',
		label: '食材',
		order: 70,
		sections: ['recipes'],
		standalone: false,
	},
	{
		aliases: ['厨具', 'cooker', 'cookers'],
		key: 'cooker',
		label: '厨具',
		order: 80,
		sections: ['recipes'],
		standalone: false,
	},
	{
		aliases: ['地区', '地点', 'place', 'places', 'area'],
		key: 'place',
		label: '地区',
		order: 90,
		sections: [
			'beverages',
			'clothes',
			'cookers',
			'currencies',
			'customers',
			'customer-normal',
			'customer-rare',
			'ingredients',
			'ornaments',
			'partners',
			'recipes',
		],
		standalone: true,
	},
	{
		aliases: ['来源', '获取', '获取方式', 'from', 'source'],
		key: 'from',
		label: '来源',
		order: 100,
		sections: [
			'beverages',
			'clothes',
			'cookers',
			'currencies',
			'ingredients',
			'ornaments',
			'partners',
			'recipes',
		],
		standalone: true,
	},
	{
		aliases: ['类型', 'type'],
		key: 'type',
		label: '类型',
		order: 110,
		sections: ['cookers', 'ingredients'],
		standalone: true,
	},
	{
		aliases: ['类别', 'category'],
		key: 'category',
		label: '类别',
		order: 120,
		sections: ['cookers'],
		standalone: true,
	},
	{
		aliases: ['符卡', 'spell', 'spell-card', 'spellcard'],
		key: 'spell-card',
		label: '符卡',
		order: 130,
		sections: ['customer-rare', 'customers'],
		standalone: true,
	},
	{
		aliases: [
			'奖励符卡',
			'好符卡',
			'正符卡',
			'positive-spell-card',
			'reward-spell-card',
		],
		key: 'positive-spell-card',
		label: '奖励符卡',
		order: 131,
		sections: ['customer-rare', 'customers'],
		standalone: true,
	},
	{
		aliases: [
			'惩罚符卡',
			'坏符卡',
			'负符卡',
			'negative-spell-card',
			'punish-spell-card',
		],
		key: 'negative-spell-card',
		label: '惩罚符卡',
		order: 132,
		sections: ['customer-rare', 'customers'],
		standalone: true,
	},
	{
		aliases: ['奖励', '羁绊', '羁绊奖励', 'reward', 'bond', 'bond-reward'],
		key: 'reward',
		label: '羁绊奖励',
		order: 140,
		sections: ['customer-rare', 'customers'],
		standalone: true,
	},
	{
		aliases: ['评价', '评价对话', '评价台词', 'evaluation'],
		key: 'evaluation',
		label: '评价对话',
		order: 145,
		sections: ['customer-rare', 'customers'],
		standalone: true,
	},
	{
		aliases: ['效果', '能力', 'effect', 'ability'],
		key: 'effect',
		label: '效果',
		order: 150,
		sections: ['cookers', 'ornaments', 'partners'],
		standalone: true,
	},
	{
		aliases: ['速度', 'speed'],
		key: 'speed',
		label: '速度',
		order: 160,
		sections: ['partners'],
		standalone: true,
	},
	{
		aliases: ['移动速度', '行走速度', 'moving-speed', 'move-speed'],
		key: 'moving-speed',
		label: '移动速度',
		order: 161,
		sections: ['partners'],
		standalone: true,
	},
	{
		aliases: ['工作速度', '料理速度', 'working-speed', 'work-speed'],
		key: 'working-speed',
		label: '工作速度',
		order: 162,
		sections: ['partners'],
		standalone: true,
	},
	{
		aliases: ['对话', '台词', 'chat'],
		key: 'chat',
		label: '对话',
		order: 170,
		sections: ['customer-normal', 'customer-rare', 'customers'],
		standalone: true,
	},
	{
		aliases: ['等级', 'level'],
		key: 'level',
		label: '等级',
		order: 180,
		sections: ['beverages', 'ingredients', 'recipes'],
		standalone: true,
	},
	{
		aliases: ['价格', '预算', 'price', 'budget'],
		key: 'price',
		label: '价格',
		order: 190,
		sections: [
			'beverages',
			'customers',
			'customer-rare',
			'ingredients',
			'recipes',
		],
		standalone: true,
	},
	{
		aliases: ['内容归属', '归属', '所属DLC', 'content-dlc'],
		key: 'content-dlc',
		label: '内容归属',
		order: 200,
		sections: [
			'beverages',
			'clothes',
			'cookers',
			'currencies',
			'customers',
			'customer-normal',
			'customer-rare',
			'ingredients',
			'ornaments',
			'partners',
			'recipes',
		],
		standalone: true,
		valueTypeLabel: 'DLC',
	},
	{
		aliases: ['可获取于', 'DLC', '可获取DLC', 'dlc', 'availability-dlc'],
		key: 'availability-dlc',
		label: '可获取于',
		order: 201,
		sections: [
			'beverages',
			'clothes',
			'cookers',
			'currencies',
			'customers',
			'customer-normal',
			'customer-rare',
			'ingredients',
			'ornaments',
			'partners',
			'recipes',
		],
		standalone: true,
		valueTypeLabel: 'DLC',
	},
] as const satisfies ReadonlyArray<IGlobalSearchFieldPrefixGroup>;

export const GLOBAL_SEARCH_EXAMPLE_QUERIES = [
	{
		description: '名称/拼音/首字母',
		previewSection: 'ingredients',
		query: '八目鳗',
	},
	{ description: '料理中包含指定食材', query: '@料理 @食材 海苔' },
	{ description: '按分区和标签查酒水', query: '@酒水 @标签 无酒精' },
	{ description: '按食材类型查找', query: '@食材 @类型 肉类' },
	{ description: '按采集或购买来源查找', query: '@食材 @来源 博丽神社' },
	{ description: '查找普客喜好标签', query: '@普客 @喜好 家常' },
	{ description: '查找稀客符卡文本', query: '@稀客 @符卡 荧光现象' },
	{ description: '查找并定位设置项', query: '@设置 流行趋势' },
] as const satisfies ReadonlyArray<IGlobalSearchExampleQuery>;

export const GLOBAL_SEARCH_SECTION_PATH_MAP = {
	beverages: '/beverages',
	clothes: '/clothes',
	cookers: '/cookers',
	currencies: '/currencies',
	'customer-normal': '/customer-normal',
	'customer-rare': '/customer-rare',
	ingredients: '/ingredients',
	ornaments: '/ornaments',
	partners: '/partners',
	preferences: '/preferences',
	recipes: '/recipes',
} as const satisfies Record<TGlobalSearchIndexSection, string>;

export function getGlobalSearchSectionPath(
	section: TGlobalSearchIndexSection
): string;
export function getGlobalSearchSectionPath(
	section: TGlobalSearchSection
): null | string;
export function getGlobalSearchSectionPath(
	section: TGlobalSearchSection
): null | string {
	return section === 'customers'
		? null
		: GLOBAL_SEARCH_SECTION_PATH_MAP[section];
}

export const GLOBAL_SEARCH_RECENT_STORAGE_KEY =
	'global-spotlight-search-recents';

export const GLOBAL_SEARCH_MAX_RESULTS = 40;
