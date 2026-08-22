export const SUGGESTED_MEAL_STATUS_MESSAGE_MAP = {
	failed: '推荐计算失败，请调整条件后重试',
	loading: '正在计算推荐套餐…',
	noMatch: '未找到匹配的推荐套餐',
	refreshFailed: '推荐更新失败，仍显示上次结果',
	refreshing: '正在更新推荐结果…',
} as const;

export const SUGGESTED_MEAL_ALTERNATIVE_STATUS_LABEL_MAP = {
	empty: '无可用替换',
	failed: '加载失败',
	loading: '正在查找…',
	ready: '可替换为',
} as const;
