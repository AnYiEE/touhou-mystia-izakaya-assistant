import { type TDlc } from '@/data';
import { checkLengthEmpty } from '@/utilities';

export interface IVisibleSavedMealEntry<TMeal> {
	dataIndex: number;
	meal: TMeal;
	visibleIndex: number;
}

export interface IVisibleSavedMealDlcRefs {
	beverageDlc: TDlc;
	ingredientDlcs: ReadonlyArray<TDlc>;
	recipeDlc: TDlc;
}

export interface IGetVisibleSavedMealsArgs<TMeal> {
	hiddenDlcs: ReadonlySet<TDlc>;
	meals: ReadonlyArray<TMeal> | null | undefined;
	resolveDlcRefs: (meal: TMeal) => IVisibleSavedMealDlcRefs | null;
}

/**
 * 按当前隐藏 DLC 设置过滤保存套餐，并显式保留原数组索引与可见索引的映射关系。
 */
export function getVisibleSavedMeals<TMeal>({
	hiddenDlcs,
	meals,
	resolveDlcRefs,
}: IGetVisibleSavedMealsArgs<TMeal>): Array<IVisibleSavedMealEntry<TMeal>> {
	if (meals === undefined || meals === null || checkLengthEmpty(meals)) {
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
