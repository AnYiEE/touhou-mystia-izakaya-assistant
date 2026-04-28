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
	const currentMeal = nextMeals[currentDataIndex];
	const targetMeal = nextMeals[nextDataIndex];

	if (currentMeal === undefined || targetMeal === undefined) {
		return null;
	}

	[nextMeals[currentDataIndex], nextMeals[nextDataIndex]] = [
		targetMeal,
		currentMeal,
	];

	return nextMeals;
}
