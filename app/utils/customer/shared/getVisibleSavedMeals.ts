import { isNil } from 'lodash';

import { type TDlc } from '@/data';
import { checkLengthEmpty } from '@/utilities';

export interface IVisibleSavedMealEntry<TMeal> {
	dataIndex: number;
	meal: TMeal;
	visibleIndex: number;
}

export function getVisibleSavedMeals<TMeal>({
	hiddenDlcs,
	meals,
	resolveDlcRefs,
}: {
	hiddenDlcs: ReadonlySet<TDlc>;
	meals: ReadonlyArray<TMeal> | null | undefined;
	resolveDlcRefs: (
		meal: TMeal
	) => {
		beverageDlc: TDlc;
		ingredientDlcs: ReadonlyArray<TDlc>;
		recipeDlc: TDlc;
	} | null;
}): Array<IVisibleSavedMealEntry<TMeal>> {
	if (isNil(meals) || checkLengthEmpty(meals)) {
		return [];
	}

	const visibleMeals: Array<IVisibleSavedMealEntry<TMeal>> = [];

	meals.forEach((meal, dataIndex) => {
		const dlcRefs = resolveDlcRefs(meal);
		if (dlcRefs === null) {
			return;
		}

		const hasHiddenIngredientDlc = dlcRefs.ingredientDlcs.some((dlc) =>
			hiddenDlcs.has(dlc)
		);
		if (
			hasHiddenIngredientDlc ||
			hiddenDlcs.has(dlcRefs.beverageDlc) ||
			hiddenDlcs.has(dlcRefs.recipeDlc)
		) {
			return;
		}

		visibleMeals.push({
			dataIndex,
			meal,
			visibleIndex: visibleMeals.length,
		});
	});

	return visibleMeals;
}
