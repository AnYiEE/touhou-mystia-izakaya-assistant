import { isObject } from 'lodash';

import { Item } from './base';
import {
	COOKER_LIST,
	type TCookerCategory,
	type TCookerName,
	type TCookers,
	type TCustomerRareName,
} from '@/data';

import { checkArrayEqualOf } from '@/utilities';

export class Cooker extends Item<TCookers> {
	private static _instance: Cooker | undefined;

	/** @description Flag to check if the categories are consistent with the original data. */
	private static _isCategoriesChecked: boolean;
	private static _sortedCategories = [
		'初始',
		'夜雀',
		'超',
		'极',
		'核能',
		'可疑',
		'月见',
		'DLC',
	] as const satisfies TCookerCategory[];

	private static _bondCookerCache = new Map<
		TCustomerRareName,
		TCookerName | null
	>();

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
		if (Cooker._isCategoriesChecked) {
			return Cooker._sortedCategories;
		}

		const isCategoriesEqual = checkArrayEqualOf(
			Cooker._sortedCategories,
			this.getValuesByProp('category')
		);
		if (!isCategoriesEqual) {
			throw new Error(
				'[utils/item/Cooker]: the given categories is inconsistent with the types in the original data'
			);
		}

		Cooker._isCategoriesChecked = true;

		return Cooker._sortedCategories;
	}

	/**
	 * @description Get the cooker for a customer based on their bond level.
	 */
	public getBondCooker(customerName: TCustomerRareName): TCookerName | null {
		if (Cooker._bondCookerCache.has(customerName)) {
			return Cooker._bondCookerCache.get(customerName);
		}

		let bondCooker: TCookerName | null = null;

		this._data.some(({ from, name }) =>
			from.some((item) => {
				if (
					isObject(item) &&
					'bond' in item &&
					item.bond === customerName
				) {
					bondCooker = name;
					return true;
				}
				return false;
			})
		);

		Cooker._bondCookerCache.set(customerName, bondCooker);

		return bondCooker;
	}
}
