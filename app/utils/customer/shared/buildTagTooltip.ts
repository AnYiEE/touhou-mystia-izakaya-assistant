type TTagType = 'beverageTag' | 'recipeTag';

export interface IBuildRareTagTooltipArgs {
	currentOrderTag: string | null;
	hasMystiaCooker: boolean;
	isDarkMatter: boolean;
	isOrderLinkedFilter: boolean;
	tag: string;
	type: TTagType;
}

export interface IBuildNormalTagTooltipArgs {
	selectedTags: ReadonlySet<string>;
	tag: string;
	type: TTagType;
}

function getTagTypeLabel(type: TTagType) {
	return type === 'beverageTag' ? '酒水' : '料理';
}

/**
 * 构建稀客页标签提示文案，保留点单需求、联动筛表与夜雀厨具的现有语义。
 */
export function buildRareTagTooltip({
	currentOrderTag,
	hasMystiaCooker,
	isDarkMatter,
	isOrderLinkedFilter,
	tag,
	type,
}: IBuildRareTagTooltipArgs) {
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

/**
 * 构建普客页标签提示文案，保留当前标签筛选的简单切换语义。
 */
export function buildNormalTagTooltip({
	selectedTags,
	tag,
	type,
}: IBuildNormalTagTooltipArgs) {
	const tagType = getTagTypeLabel(type);
	const isTagExisted = selectedTags.has(tag);

	return `点击：${isTagExisted ? `取消筛选${tagType}表格` : `以此标签筛选${tagType}表格`}`;
}
