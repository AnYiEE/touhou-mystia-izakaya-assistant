import { DYNAMIC_FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';

import { type TCatalogGuestsTranslate } from '@/features/catalog/guests/shared/messages';

type TTagType = 'beverageTag' | 'foodTag';

export function isPopularTrendTag(tag: TFoodTagId) {
	return (
		tag === DYNAMIC_FOOD_TAG_MAP.popularNegative ||
		tag === DYNAMIC_FOOD_TAG_MAP.popularPositive
	);
}

function getTagTypeLabel(type: TTagType, t: TCatalogGuestsTranslate) {
	return type === 'beverageTag'
		? t('guests.tagType.beverage')
		: t('guests.tagType.food');
}

export function buildNormalTagTooltip(
	{
		isPopularTrend,
		selectedTags,
		tag,
		type,
	}: {
		isPopularTrend: boolean;
		selectedTags: Pick<ReadonlySet<string>, 'has'>;
		tag: string;
		type: TTagType;
	},
	t: TCatalogGuestsTranslate
) {
	if (isPopularTrend) {
		return t('guests.tagTooltip.popularTrend');
	}

	const tagType = getTagTypeLabel(type, t);
	const isTagExisted = selectedTags.has(tag);

	return isTagExisted
		? t('guests.tagTooltip.filterOff', { type: tagType })
		: t('guests.tagTooltip.filterOn', { type: tagType });
}

export function buildRareTagTooltip(
	{
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
	},
	t: TCatalogGuestsTranslate
) {
	if (isPopularTrend) {
		return t('guests.tagTooltip.popularTrend');
	}

	const tagType = getTagTypeLabel(type, t);
	const isCurrentTag = currentOrderTag === tag;
	const isNormalMeal = hasMystiaCooker && !isDarkMatter;

	const cookerTip = t('guests.tagTooltip.cookerIgnores');
	const orderTip = isNormalMeal
		? isOrderLinkedFilter
			? ''
			: cookerTip
		: t(
				isCurrentTag
					? 'guests.tagTooltip.orderOff'
					: 'guests.tagTooltip.orderOn'
			);
	const filter = isCurrentTag
		? t('guests.tagTooltip.filterOff', { type: tagType })
		: t('guests.tagTooltip.filterOn', { type: tagType });
	const filterTip = isOrderLinkedFilter
		? isNormalMeal
			? t('guests.tagTooltip.filterNormal', { cookerTip, filter })
			: t('guests.tagTooltip.filterAnd', { filter })
		: '';

	return `${orderTip}${filterTip}`;
}
