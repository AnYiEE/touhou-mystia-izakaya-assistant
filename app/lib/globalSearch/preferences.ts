import type { IGlobalSearchIndexItem } from './types';

interface IGlobalSearchPreferenceIndexOptions {
	includeAccountItems?: boolean;
}

const GLOBAL_SEARCH_BASE_PREFERENCE_ITEMS = [
	{
		description: '显示或隐藏各DLC数据集',
		key: 'global-hidden-dlcs',
		keywords: ['DLC', '资料片', '数据集开关', '隐藏DLC'],
		label: '数据集',
	},
	{
		description: '设置游戏中现时的流行趋势',
		key: 'global-popular-trend',
		keywords: ['流行喜爱', '流行厌恶', '明星店'],
		label: '流行趋势',
	},
	{
		description: '开启或关闭平滑滚动和磨砂效果',
		key: 'appearance-high-appearance',
		label: '平滑滚动和磨砂效果',
	},
	{
		description: '显示或隐藏顾客页面右下角的立绘',
		key: 'appearance-tachie',
		label: '顾客页面右下角的立绘',
	},
	{
		description: '开启或关闭操作震动反馈',
		key: 'experience-vibrate',
		label: '操作震动反馈',
	},
	{
		description: '显示或隐藏顾客卡片中标签的浮动提示',
		key: 'experience-tags-tooltip',
		label: '标签浮动提示',
	},
	{
		description: '显示或隐藏顾客页可用的料理、酒水和食材',
		key: 'customer-hidden-items',
		keywords: [
			'隐藏酒水',
			'隐藏料理',
			'隐藏食材',
			'显示酒水',
			'显示料理',
			'显示食材',
		],
		label: '隐藏料理/酒水/食材',
	},
	{
		action: 'open-customer-rare-plan-drawer',
		description: '打开营业预设抽屉，集中查看可能出现的稀客和套餐',
		key: 'customer-rare-plan-drawer',
		keywords: [
			'稀客开店预设',
			'开店预设',
			'稀客套餐',
			'营业预设',
			'预设管理',
			'抽屉',
		],
		label: '营业预设',
		sectionLabel: '工具',
	},
	{
		description: '设置稀客页面套餐推荐卡片显示和自动推荐参数',
		key: 'customer-suggest-meals',
		keywords: [
			'猜您想要',
			'套餐推荐',
			'推荐卡片',
			'推荐数量',
			'评级上限',
			'加料上限',
			'稀客开店预设',
			'开店预设',
			'营业预设',
			'抽屉',
		],
		label: '“猜您想要”推荐设置',
	},
	{
		description: '选择稀客点单需求标签时同步筛选表格',
		key: 'customer-order-linked-filter',
		label: '选择点单需求的同时筛选表格',
	},
	{
		description: '显示料理标签所对应的关键词',
		key: 'customer-show-tag-description',
		label: '显示料理标签描述',
	},
	{
		description: '导入、导出、备份、还原或重置顾客套餐和营业预设数据',
		key: 'data-manager',
		keywords: [
			'本地导入',
			'本地导出',
			'导入',
			'导出',
			'备份',
			'还原',
			'重置',
			'旧备份码',
			'云端备份',
			'云端还原',
		],
		label: '数据管理',
	},
] as const;

const GLOBAL_SEARCH_ACCOUNT_PREFERENCE_ITEMS = [
	{
		action: 'open-account-modal',
		description: '管理账号、同步状态、登录方式和云端数据',
		key: 'account',
		keywords: [
			'账户',
			'小助手账号',
			'账号同步',
			'同步状态',
			'云端数据',
			'账号安全',
		],
		label: '账号',
	},
	{
		action: 'open-account-modal',
		description: '使用用户名密码或通行密钥登录、注册小助手账号',
		key: 'account-login-register',
		keywords: [
			'登录',
			'注册',
			'创建账号',
			'登录账号',
			'用户名',
			'密码',
			'通行密钥',
			'Passkey',
			'WebAuthn',
		],
		label: '登录/注册',
	},
	{
		action: 'open-account-modal',
		description: '设置或修改登录密码，管理通行密钥和登录设备',
		key: 'account-security',
		keywords: [
			'设置登录密码',
			'修改密码',
			'通行密钥',
			'登录设备',
			'退出登录',
			'删除账号',
		],
		label: '账号安全',
	},
	{
		action: 'open-account-modal',
		description: '查看同步状态，处理同步异常或冲突',
		key: 'account-sync',
		keywords: ['同步状态', '云同步', '同步冲突', '同步异常', '立即同步'],
		label: '账号同步',
	},
] as const;

export const GLOBAL_SEARCH_PREFERENCE_ITEMS = [
	...GLOBAL_SEARCH_BASE_PREFERENCE_ITEMS,
	...GLOBAL_SEARCH_ACCOUNT_PREFERENCE_ITEMS,
] as const;

export type TGlobalSearchPreferenceKey =
	(typeof GLOBAL_SEARCH_PREFERENCE_ITEMS)[number]['key'];

function getGlobalSearchPreferenceItems({
	includeAccountItems = true,
}: IGlobalSearchPreferenceIndexOptions = {}) {
	return includeAccountItems
		? GLOBAL_SEARCH_PREFERENCE_ITEMS
		: GLOBAL_SEARCH_BASE_PREFERENCE_ITEMS;
}

export function buildGlobalSearchPreferenceIndex(
	options: IGlobalSearchPreferenceIndexOptions = {}
): IGlobalSearchIndexItem[] {
	return getGlobalSearchPreferenceItems(options).map((item) => {
		const keywords = 'keywords' in item ? item.keywords.join(' ') : '';

		return {
			...('action' in item ? { action: item.action } : {}),
			description: item.description,
			fields: [
				{
					fieldType: 'name',
					label: '名称',
					text: item.label,
					weight: 5,
				},
				{
					fieldType: 'description',
					label: '说明',
					text: item.description,
					weight: 2,
				},
				...(keywords.length === 0
					? []
					: [
							{
								fieldType: 'description' as const,
								label: '关键词',
								text: keywords,
								weight: 1.4,
							},
						]),
			],
			href: '/preferences',
			id: `preferences:${item.key}`,
			name: item.label,
			section: 'preferences',
			sectionLabel: 'sectionLabel' in item ? item.sectionLabel : '设置',
			targetName: item.key,
		};
	});
}
