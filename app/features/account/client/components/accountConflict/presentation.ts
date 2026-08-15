import isNil from 'lodash/isNil.js';

import { type TSyncNamespace } from '@/domain/account/contracts';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';

import { type TAccountSyncConflictResolution as TSyncConflictResolution } from '@/features/account/client/sync/conflictResolutionJournal';
import { createSnapshotHash } from '@/features/account/client/sync/dirtyQueue/snapshotHash';

import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

export const SYNC_NAMESPACE_LABEL_MAP = {
	'customer_normal.meals': '已保存套餐（普客）',
	'customer_rare.meals': '已保存套餐（稀客）',
	'customer_rare.plans': '营业预设（稀客）',
	'customer_rare.settings': '偏好设置（稀客）',
	'global.preferences': '偏好设置（全局）',
	theme: '主题设置',
	'tutorial.customer_rare': '稀客教程进度',
} as const satisfies Record<TSyncNamespace, string>;

const CONFLICT_FIELD_LABEL_MAP: Record<string, string> = {
	activeId: '当前使用的营业预设',
	columns: '表格显示列',
	completed: '稀客教程进度',
	darkPalette: '深色主题配色',
	dlcs: '已关闭的数据集',
	enabled: '启用状态',
	famousShop: '“明星店”效果',
	guestCardTagsTooltip: '顾客卡片中标签的浮动提示',
	hiddenItems: '启用或禁用的酒水、料理和食材',
	highAppearance: '平滑滚动和磨砂效果',
	items: '保存的营业预设',
	lightPalette: '浅色主题配色',
	maxExtraIngredients: '加料上限',
	maxRating: '评级上限',
	maxResults: '推荐结果上限',
	mode: '颜色模式',
	orderLinkedFilter: '选择点单需求的同时筛选表格',
	popularTrend: '流行趋势',
	'popularTrend.isNegative': '流行趋势方向',
	'popularTrend.tag': '流行趋势标签',
	row: '表格显示行数',
	showTagDescription: '显示料理标签所对应的关键词',
	suggestMeals: '“猜您想要”推荐',
	'suggestMeals.maxExtraIngredients': '“猜您想要”的加料上限',
	'suggestMeals.maxRating': '“猜您想要”的评级上限',
	'suggestMeals.maxResults': '“猜您想要”的推荐结果上限',
	table: '表格设置',
	'table.columns.beverage': '酒水表格显示列',
	'table.columns.recipe': '料理表格显示列',
	'table.hiddenItems.beverages': '表格中隐藏的酒水',
	'table.hiddenItems.ingredients': '表格中隐藏的食材',
	'table.hiddenItems.recipes': '表格中隐藏的料理',
	tachie: '顾客页面右下角的立绘',
	theme: '颜色模式',
	vibrate: '震动反馈',
};

const CONFLICT_BOOLEAN_VALUE_LABEL_MAP: Record<
	string,
	readonly [string, string]
> = {
	completed: ['未完成', '已完成'],
	'popularTrend.isNegative': ['流行喜爱', '流行厌恶'],
};

const CONFLICT_VALUE_LABEL_MAP: Record<string, string> = {
	action: '操作',
	beverage: '酒水',
	black: '深邃黑',
	cooker: '厨具',
	cookerType: '厨具',
	dark: '深色',
	green: '清新绿',
	ingredient: '食材',
	izakaya: '雀食堂',
	light: '浅色',
	pink: '少女粉',
	price: '售价',
	recipe: '料理',
	suitability: '匹配度',
	system: '跟随系统',
	time: '烹饪时间',
	white: '简约白',
};

const MAX_VISIBLE_DIFFERENCES = 6;

export interface IConflictDifference {
	cloud: unknown;
	label: string;
	local: unknown;
	merged: unknown;
	path: string;
}

export interface IConflictDifferenceResult {
	hasMore: boolean;
	items: IConflictDifference[];
}

function getConflictFieldLabel(path: string[]) {
	const fullPath = path.join('.');
	const fieldName = path.at(-1) ?? '';

	return (
		(CONFLICT_FIELD_LABEL_MAP[fullPath] ??
			CONFLICT_FIELD_LABEL_MAP[fieldName] ??
			fieldName) ||
		'设置内容'
	);
}

export function getConflictDifferences(
	cloud: unknown,
	local: unknown,
	merged: unknown
): IConflictDifferenceResult {
	const items: IConflictDifference[] = [];
	let hasMore = false;

	const visit = (
		cloudValue: unknown,
		localValue: unknown,
		mergedValue: unknown,
		path: string[]
	) => {
		if (createSnapshotHash(cloudValue) === createSnapshotHash(localValue)) {
			return;
		}

		if (items.length >= MAX_VISIBLE_DIFFERENCES) {
			hasMore = true;
			return;
		}

		if (checkIsRecord(cloudValue) && checkIsRecord(localValue)) {
			const mergedRecord = checkIsRecord(mergedValue)
				? mergedValue
				: undefined;
			const keys = new Set([
				...Object.keys(cloudValue),
				...Object.keys(localValue),
			]);

			for (const key of keys) {
				visit(cloudValue[key], localValue[key], mergedRecord?.[key], [
					...path,
					key,
				]);
				if (hasMore) {
					break;
				}
			}
			return;
		}

		items.push({
			cloud: cloudValue,
			label: getConflictFieldLabel(path),
			local: localValue,
			merged: mergedValue,
			path: path.join('.'),
		});
	};

	visit(cloud, local, merged, []);

	return { hasMore, items };
}

export function formatFriendlyConflictValue(
	value: unknown,
	path?: string
): string {
	if (typeof value === 'boolean') {
		const labels =
			path === undefined
				? undefined
				: CONFLICT_BOOLEAN_VALUE_LABEL_MAP[path];
		if (labels !== undefined) {
			return labels[value ? 1 : 0];
		}

		return value ? '开启' : '关闭';
	}
	if (typeof value === 'number') {
		return String(value);
	}
	if (typeof value === 'string') {
		return CONFLICT_VALUE_LABEL_MAP[value] ?? value;
	}
	if (isNil(value)) {
		return '未设置';
	}
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return '无';
		}

		const preview: string = value
			.slice(0, 3)
			.map((item) => {
				if (path === 'hiddenItems.dlcs' && typeof item === 'string') {
					const dlc = Number(item) as keyof typeof DLC_LABEL_MAP;
					if (Object.hasOwn(DLC_LABEL_MAP, dlc)) {
						return DLC_LABEL_MAP[dlc].label;
					}
				}

				return formatFriendlyConflictValue(item);
			})
			.join('、');

		return value.length > 3 ? `${preview}等${value.length}项` : preview;
	}
	if (checkIsRecord(value)) {
		return `包含${Object.keys(value).length}项设置`;
	}

	return '无法显示';
}

export function formatConflictData(data: unknown) {
	try {
		return JSON.stringify(data, null, 2);
	} catch {
		return String(data);
	}
}

const CONFLICT_RESOLUTION_TRACK_NAME_MAP = {
	cloud: 'Use Cloud',
	local: 'Use Local',
	merged: 'Use Merged',
} as const;

export function getConflictResolutionTrackName(
	resolution: TSyncConflictResolution
) {
	return resolution.startsWith('collision:')
		? 'Use Local Collision Candidate'
		: CONFLICT_RESOLUTION_TRACK_NAME_MAP[
				resolution as 'cloud' | 'local' | 'merged'
			];
}
