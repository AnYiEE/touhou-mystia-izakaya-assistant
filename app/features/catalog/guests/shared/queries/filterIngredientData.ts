import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TFoodTagId } from '@/domain/data/tags/types';

interface IFilterableIngredient {
	availabilityDlcs: ReadonlyArray<number>;
	id: TIngredientId;
	level: number;
	tags: ReadonlyArray<TFoodTagId>;
}

export function filterIngredientData<
	TIngredient extends IFilterableIngredient,
>({
	blockedIngredients,
	calculateTagsWithTrend,
	filterAvailabilityDlcs,
	filterLevels,
	filterNoTags,
	filterTags,
	hiddenIngredients,
	ingredientData,
}: {
	blockedIngredients: ReadonlySet<TIngredientId>;
	calculateTagsWithTrend: (
		tags: ReadonlyArray<TFoodTagId>
	) => ReadonlyArray<TFoodTagId>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterLevels: ReadonlyArray<string>;
	filterNoTags: ReadonlyArray<TFoodTagId>;
	filterTags: ReadonlyArray<TFoodTagId>;
	hiddenIngredients: ReadonlySet<TIngredientId>;
	ingredientData: ReadonlyArray<TIngredient>;
}): TIngredient[] {
	const hasAvailabilityDlcFilter = filterAvailabilityDlcs.length > 0;
	const hasLevelFilter = filterLevels.length > 0;
	const hasNoTagFilter = filterNoTags.length > 0;
	const hasTagFilter = filterTags.length > 0;

	return ingredientData.filter(({ availabilityDlcs, id, level, tags }) => {
		if (blockedIngredients.has(id) || hiddenIngredients.has(id)) {
			return false;
		}

		const tagsWithTrend = calculateTagsWithTrend(tags);

		if (
			hasAvailabilityDlcFilter &&
			!filterAvailabilityDlcs.some((selectedDlc) =>
				availabilityDlcs.some((dlc) => selectedDlc === String(dlc))
			)
		) {
			return false;
		}
		if (
			hasTagFilter &&
			!filterTags.every((tag) => tagsWithTrend.includes(tag))
		) {
			return false;
		}
		if (
			hasNoTagFilter &&
			filterNoTags.some((tag) => tagsWithTrend.includes(tag))
		) {
			return false;
		}
		if (hasLevelFilter && !filterLevels.includes(String(level))) {
			return false;
		}

		return true;
	});
}
