'use client';

import { memo } from 'react';

import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import type { IGuestOrder } from '@/domain/orders/types';

import TagGroup from '@/features/catalog/guests/shared/client/components/tagGroup';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';
import {
	BEVERAGE_TAG_STYLE,
	FOOD_TAG_STYLE,
} from '@/features/catalog/presentation/tagStyles';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import {
	compareFoodTagLabels,
	getBeverageTagLabel,
	getFoodTagLabel,
} from '@/features/catalog/shared/client/localization/tagLabels';

import { useI18n } from '@/shared/i18n/useI18n';
import { numberSort } from '@/shared/utilities/sort/numberSort';

interface IProps {
	hasMystiaCooker?: boolean;
	isDarkMatter?: boolean;
	matchedBeverageTags: ReadonlyArray<TBeverageTagId>;
	matchedFoodTags: ReadonlyArray<TFoodTagId>;
	order?: IGuestOrder;
	rating: string;
}

export function shouldShowSavedMealPreferenceMatches({
	hasMystiaCooker,
	isDarkMatter,
}: {
	hasMystiaCooker: boolean;
	isDarkMatter: boolean;
}) {
	return !hasMystiaCooker || isDarkMatter;
}

export default memo<IProps>(function SavedMealRatingContent({
	hasMystiaCooker = false,
	isDarkMatter = false,
	matchedBeverageTags,
	matchedFoodTags,
	order,
	rating,
}) {
	useCatalogLocalizationRevision();
	const { t } = useI18n(catalogGuestsMessages);

	if (
		!shouldShowSavedMealPreferenceMatches({ hasMystiaCooker, isDarkMatter })
	) {
		return rating;
	}

	const foodPreferenceLabels = matchedFoodTags
		.toSorted(compareFoodTagLabels)
		.map((tag) => getFoodTagLabel(tag));
	const beveragePreferenceLabels = matchedBeverageTags
		.toSorted(numberSort)
		.map((tag) => getBeverageTagLabel(tag));
	const hasMatchedPreference =
		foodPreferenceLabels.length > 0 || beveragePreferenceLabels.length > 0;
	const hasCurrentOrder =
		order !== undefined &&
		(order.foodTag !== null || order.beverageTag !== null);

	return (
		<div className="min-w-36 space-y-2 text-tiny">
			{hasCurrentOrder && (
				<div className="space-y-1">
					<p className="font-semibold">
						{t('guests.savedMeal.currentOrder')}
					</p>
					<TagGroup className="gap-1">
						{order.foodTag !== null && (
							<Tags.Tag
								tag={getFoodTagLabel(order.foodTag)}
								tagStyle={FOOD_TAG_STYLE.positive}
								tagType="positive"
							/>
						)}
						{order.beverageTag !== null && (
							<Tags.Tag
								tag={getBeverageTagLabel(order.beverageTag)}
								tagStyle={BEVERAGE_TAG_STYLE.positive}
								tagType="positive"
							/>
						)}
					</TagGroup>
				</div>
			)}
			<p className="font-semibold">
				{t('guests.savedMeal.satisfiedPreferences')}
			</p>
			{hasMatchedPreference ? (
				<>
					{foodPreferenceLabels.length > 0 && (
						<div className="space-y-1">
							<p>{t('guests.savedMeal.foodPreferences')}</p>
							<TagGroup className="gap-1">
								<Tags
									tags={foodPreferenceLabels}
									tagStyle={FOOD_TAG_STYLE.positive}
									tagType="positive"
								/>
							</TagGroup>
						</div>
					)}
					{beveragePreferenceLabels.length > 0 && (
						<div className="space-y-1">
							<p>{t('guests.savedMeal.beveragePreferences')}</p>
							<TagGroup className="gap-1">
								<Tags
									tags={beveragePreferenceLabels}
									tagStyle={BEVERAGE_TAG_STYLE.positive}
									tagType="positive"
								/>
							</TagGroup>
						</div>
					)}
				</>
			) : (
				<p>{t('guests.savedMeal.noMatchedPreferences')}</p>
			)}
		</div>
	);
});
