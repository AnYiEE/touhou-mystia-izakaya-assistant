interface IIndexedSavedMeal {
	dataIndex: number;
}

interface ISwapSavedMealsArgs<TMeal, TSavedMeal extends IIndexedSavedMeal> {
	currentMeals: ReadonlyArray<TMeal>;
	nextVisibleIndex: number;
	savedMeals: ReadonlyArray<TSavedMeal>;
	visibleIndex: number;
}

export function swapSavedMeals<TMeal, TSavedMeal extends IIndexedSavedMeal>({
	currentMeals,
	nextVisibleIndex,
	savedMeals,
	visibleIndex,
}: ISwapSavedMealsArgs<TMeal, TSavedMeal>) {
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
