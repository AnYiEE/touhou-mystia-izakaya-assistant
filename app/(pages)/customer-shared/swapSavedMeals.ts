export function swapSavedMeals<TMeal>({
	currentMeals,
	nextVisibleIndex,
	savedMeals,
	visibleIndex,
}: {
	currentMeals: ReadonlyArray<TMeal>;
	nextVisibleIndex: number;
	savedMeals: ReadonlyArray<{ dataIndex: number }>;
	visibleIndex: number;
}) {
	if (nextVisibleIndex < 0 || nextVisibleIndex >= savedMeals.length) {
		return null;
	}

	const currentEntry = savedMeals[visibleIndex];
	const nextEntry = savedMeals[nextVisibleIndex];

	if (currentEntry === undefined || nextEntry === undefined) {
		return null;
	}

	const { dataIndex: currentDataIndex } = currentEntry;
	const { dataIndex: nextDataIndex } = nextEntry;
	const nextMeals = [...currentMeals];

	if (
		currentDataIndex < 0 ||
		currentDataIndex >= nextMeals.length ||
		nextDataIndex < 0 ||
		nextDataIndex >= nextMeals.length
	) {
		return null;
	}

	const currentMeal = nextMeals[currentDataIndex] as TMeal;
	const targetMeal = nextMeals[nextDataIndex] as TMeal;

	[nextMeals[currentDataIndex], nextMeals[nextDataIndex]] = [
		targetMeal,
		currentMeal,
	];

	return nextMeals;
}
