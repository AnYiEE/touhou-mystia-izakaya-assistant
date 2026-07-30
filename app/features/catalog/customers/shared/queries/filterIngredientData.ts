interface IFilterableIngredient {
	availabilityDlcs: ReadonlyArray<number>;
	level: number;
	name: string;
	tags: ReadonlyArray<string>;
}

export function filterIngredientData<
	TIngredient extends IFilterableIngredient,
>({
	blockedIngredientNames,
	calculateTagsWithTrend,
	filterAvailabilityDlcs,
	filterLevels,
	filterNoTags,
	filterTags,
	hiddenIngredientNames,
	ingredientData,
}: {
	blockedIngredientNames: ReadonlySet<string>;
	calculateTagsWithTrend: (
		tags: ReadonlyArray<string>
	) => ReadonlyArray<string>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterLevels: ReadonlyArray<string>;
	filterNoTags: ReadonlyArray<string>;
	filterTags: ReadonlyArray<string>;
	hiddenIngredientNames: ReadonlySet<string>;
	ingredientData: ReadonlyArray<TIngredient>;
}): TIngredient[] {
	const hasAvailabilityDlcFilter = filterAvailabilityDlcs.length > 0;
	const hasLevelFilter = filterLevels.length > 0;
	const hasNoTagFilter = filterNoTags.length > 0;
	const hasTagFilter = filterTags.length > 0;

	return ingredientData.filter(({ availabilityDlcs, level, name, tags }) => {
		if (
			blockedIngredientNames.has(name) ||
			hiddenIngredientNames.has(name)
		) {
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
