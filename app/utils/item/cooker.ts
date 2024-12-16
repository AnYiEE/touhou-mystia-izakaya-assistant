import {isObjectLike} from 'lodash';

import {COOKER_LIST, type TCookerCategoryId, type TCookerId, type TCookers, type TCustomerRareId} from '@/data';
import {checkArrayEqualOf} from '@/utils';
import {Item} from '@/utils/item';

export class Cooker extends Item<TCookers> {
	private static _instance: Cooker | undefined;

	/** @description Flag to check if the categories are consistent with the original data. */
	private static _isCategoriesChecked: boolean;

	private static _bondCookerCache = new Map<TCustomerRareId, TCookerId | null>();

	public static getInstance() {
		if (Cooker._instance !== undefined) {
			return Cooker._instance;
		}

		const instance = new Cooker(COOKER_LIST);

		Cooker._instance = instance;

		return instance;
	}

	/**
	 * @description Categories sorted in the suggested order. Used for selecting cooker types.
	 */
	public get sortedCategories() {
		const categories = [0, 1, 2, 3, 4, 5, 6, -1] as const satisfies TCookerCategoryId[];

		if (Cooker._isCategoriesChecked) {
			return categories;
		}

		const isCategoriesEqual = checkArrayEqualOf(categories, this.getValuesByProp(this.data, 'category'));
		if (!isCategoriesEqual) {
			throw new Error(
				'[utils/item/Cooker]: the given categories is inconsistent with the types in the original data'
			);
		}

		Cooker._isCategoriesChecked = true;

		return categories;
	}

	/**
	 * @description Get the cooker for a customer based on their bond level.
	 */
	public getBondCooker(customerId: TCustomerRareId) {
		if (Cooker._bondCookerCache.has(customerId)) {
			return Cooker._bondCookerCache.get(customerId);
		}

		let bondCooker: TCookerId | null = null;

		this._data.some(({from, id}) =>
			from.some((item) => {
				if (isObjectLike(item) && 'bond' in item && item.bond === customerId) {
					bondCooker = id;
					return true;
				}
				return false;
			})
		);

		Cooker._bondCookerCache.set(customerId, bondCooker);

		return bondCooker;
	}
}
