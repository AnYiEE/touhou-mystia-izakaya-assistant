type TTagType = 'beverageTag' | 'recipeTag';

function getTagTypeLabel(type: TTagType) {
	return type === 'beverageTag' ? '酒水' : '料理';
}

export function buildNormalTagTooltip({
	selectedTags,
	tag,
	type,
}: {
	selectedTags: Pick<ReadonlySet<string>, 'has'>;
	tag: string;
	type: TTagType;
}) {
	const tagType = getTagTypeLabel(type);
	const isTagExisted = selectedTags.has(tag);

	return `点击：${isTagExisted ? `取消筛选${tagType}表格` : `以此标签筛选${tagType}表格`}`;
}

export function buildRareTagTooltip({
	currentOrderTag,
	hasMystiaCooker,
	isDarkMatter,
	isOrderLinkedFilter,
	tag,
	type,
}: {
	currentOrderTag: string | null;
	hasMystiaCooker: boolean;
	isDarkMatter: boolean;
	isOrderLinkedFilter: boolean;
	tag: string;
	type: TTagType;
}) {
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
