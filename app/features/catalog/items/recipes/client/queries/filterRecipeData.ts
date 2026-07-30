interface IFilterableRecipe {
	availabilityDlcs: ReadonlyArray<number>;
	cooker: string;
	dlc: number;
	ingredients: ReadonlyArray<string>;
	level: number;
	negativeTags: ReadonlyArray<string>;
	places: ReadonlyArray<string>;
	positiveTags: ReadonlyArray<string>;
}

export function filterRecipeData<TRecipe extends IFilterableRecipe>({
	data,
	filterAvailabilityDlcs,
	filterContentDlcs,
	filterCookers,
	filterIngredients,
	filterLevels,
	filterNegativeTags,
	filterNoIngredients,
	filterNoNegativeTags,
	filterNoPlaces,
	filterNoPositiveTags,
	filterPlaces,
	filterPositiveTags,
}: {
	data: ReadonlyArray<TRecipe>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
	filterCookers: ReadonlyArray<string>;
	filterIngredients: ReadonlyArray<string>;
	filterLevels: ReadonlyArray<string>;
	filterNegativeTags: ReadonlyArray<string>;
	filterNoIngredients: ReadonlyArray<string>;
	filterNoNegativeTags: ReadonlyArray<string>;
	filterNoPlaces: ReadonlyArray<string>;
	filterNoPositiveTags: ReadonlyArray<string>;
	filterPlaces: ReadonlyArray<string>;
	filterPositiveTags: ReadonlyArray<string>;
}): TRecipe[] {
	const hasAvailabilityDlcFilter = filterAvailabilityDlcs.length > 0;
	const hasContentDlcFilter = filterContentDlcs.length > 0;
	const hasCookerFilter = filterCookers.length > 0;
	const hasIngredientFilter = filterIngredients.length > 0;
	const hasLevelFilter = filterLevels.length > 0;
	const hasNegativeTagFilter = filterNegativeTags.length > 0;
	const hasNoIngredientFilter = filterNoIngredients.length > 0;
	const hasNoNegativeTagFilter = filterNoNegativeTags.length > 0;
	const hasNoPlaceFilter = filterNoPlaces.length > 0;
	const hasNoPositiveTagFilter = filterNoPositiveTags.length > 0;
	const hasPlaceFilter = filterPlaces.length > 0;
	const hasPositiveTagFilter = filterPositiveTags.length > 0;

	return data.filter(
		({
			availabilityDlcs,
			cooker,
			dlc,
			ingredients,
			level,
			negativeTags,
			places,
			positiveTags,
		}) => {
			if (
				hasAvailabilityDlcFilter &&
				!filterAvailabilityDlcs.some((selectedDlc) =>
					availabilityDlcs.some(
						(availabilityDlc) =>
							selectedDlc === String(availabilityDlc)
					)
				)
			) {
				return false;
			}
			if (
				hasContentDlcFilter &&
				!filterContentDlcs.includes(String(dlc))
			) {
				return false;
			}
			if (hasLevelFilter && !filterLevels.includes(String(level))) {
				return false;
			}
			if (hasCookerFilter && !filterCookers.includes(cooker)) {
				return false;
			}
			if (
				hasIngredientFilter &&
				!filterIngredients.every((ingredient) =>
					ingredients.includes(ingredient)
				)
			) {
				return false;
			}
			if (
				hasNoIngredientFilter &&
				filterNoIngredients.some((ingredient) =>
					ingredients.includes(ingredient)
				)
			) {
				return false;
			}
			if (
				hasNegativeTagFilter &&
				!filterNegativeTags.every((tag) => negativeTags.includes(tag))
			) {
				return false;
			}
			if (
				hasNoNegativeTagFilter &&
				filterNoNegativeTags.some((tag) => negativeTags.includes(tag))
			) {
				return false;
			}
			if (
				hasPositiveTagFilter &&
				!filterPositiveTags.every((tag) => positiveTags.includes(tag))
			) {
				return false;
			}
			if (
				hasNoPositiveTagFilter &&
				filterNoPositiveTags.some((tag) => positiveTags.includes(tag))
			) {
				return false;
			}
			if (
				hasPlaceFilter &&
				!filterPlaces.some((place) => places.includes(place))
			) {
				return false;
			}
			if (
				hasNoPlaceFilter &&
				filterNoPlaces.some((place) => places.includes(place))
			) {
				return false;
			}

			return true;
		}
	);
}
