import type { TFood } from '@/domain/catalog/food/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';

import { numberSort } from '@/shared/utilities/sort/numberSort';

type TBondFoods = Array<{ id: TFoodId; level: number }>;

const bondFoodsCache = new WeakMap<
	ReadonlyArray<TFood>,
	Map<TSpecialGuestId, TBondFoods>
>();

export function getBondFoods(
	specialGuest: TSpecialGuestId,
	foods: ReadonlyArray<TFood>
) {
	const foodCache = bondFoodsCache.getOrInsertComputed(
		foods,
		() => new Map()
	);

	return foodCache.getOrInsertComputed(specialGuest, () => {
		const bondFoods: TBondFoods = [];

		foods.forEach(({ from, id }) => {
			if ('bond' in from && from.bond.specialGuest === specialGuest) {
				bondFoods.push({ id, level: from.bond.level });
			}
		});

		bondFoods.sort(({ level: a }, { level: b }) => numberSort(a, b));

		return bondFoods;
	});
}
