import { DYNAMIC_FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';

type TTagType = 'beverageTag' | 'foodTag';

export const GUEST_POPULAR_TREND_TAG_TOOLTIP =
	'流行趋势标签不会被顾客点单；如有特殊需要，请在料理表格中筛选';

export function isPopularTrendTag(tag: TFoodTagId) {
	return (
		tag === DYNAMIC_FOOD_TAG_MAP.popularNegative ||
		tag === DYNAMIC_FOOD_TAG_MAP.popularPositive
	);
}

function getTagTypeLabel(type: TTagType) {
	return type === 'beverageTag' ? '酒水' : '料理';
}

export function buildNormalTagTooltip({
	isPopularTrend,
	selectedTags,
	tag,
	type,
}: {
	isPopularTrend: boolean;
	selectedTags: Pick<ReadonlySet<string>, 'has'>;
	tag: string;
	type: TTagType;
}) {
	if (isPopularTrend) {
		return GUEST_POPULAR_TREND_TAG_TOOLTIP;
	}

	const tagType = getTagTypeLabel(type);
	const isTagExisted = selectedTags.has(tag);

	return `点击：${isTagExisted ? `取消筛选${tagType}表格` : `以此标签筛选${tagType}表格`}`;
}

export function buildRareTagTooltip({
	currentOrderTag,
	hasMystiaCooker,
	isDarkMatter,
	isOrderLinkedFilter,
	isPopularTrend,
	tag,
	type,
}: {
	currentOrderTag: string | null;
	hasMystiaCooker: boolean;
	isDarkMatter: boolean;
	isOrderLinkedFilter: boolean;
	isPopularTrend: boolean;
	tag: string;
	type: TTagType;
}) {
	if (isPopularTrend) {
		return GUEST_POPULAR_TREND_TAG_TOOLTIP;
	}

	const tagType = getTagTypeLabel(type);
	const isCurrentTag = currentOrderTag === tag;
	const isNormalMeal = hasMystiaCooker && !isDarkMatter;

	const cookerTip = '已使用“夜雀”系列厨具无视顾客点单需求';
	const orderTip = isNormalMeal
		? isOrderLinkedFilter
			? ''
			: cookerTip
		: `点击：${isCurrentTag ? '不再' : ''}将此标签视为顾客点单需求`;
	const filterTip = isOrderLinkedFilter
		? `${isNormalMeal ? '点击：' : '并'}${
				isCurrentTag
					? `取消筛选${tagType}表格`
					: `以此标签筛选${tagType}表格`
			}${isNormalMeal ? `（${cookerTip}）` : ''}`
		: '';

	return `${orderTip}${filterTip}`;
}
