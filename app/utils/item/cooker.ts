import {isObjectLike} from 'lodash';

import {type ICurrentCustomer} from '@/(pages)/customer-rare/types';

import {COOKER_LIST, type TCookerCategories, type TCookerNames, type TCookers} from '@/data';
import {checkArrayEqualOf} from '@/utils';
import {Item} from '@/utils/item';

export class Cooker extends Item<TCookers> {
	private static _instance: Cooker | undefined;

	/** @description Flag to check if the categories are consistent with the original data. */
	private static _isCategoriesChecked: boolean;

	private static _bondCookerCache = new Map<ICurrentCustomer['name'], TCookerNames | null>();

	public static getInstance() {
		if (Cooker._instance) {
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
		const categories = [
			'初始',
			'夜雀',
			'超',
			'极',
			'核能',
			'可疑',
			'月见',
			'DLC',
		] as const satisfies TCookerCategories[];

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
	public getBondCooker(customerData: ICurrentCustomer) {
		if (Cooker._bondCookerCache.has(customerData.name)) {
			return Cooker._bondCookerCache.get(customerData.name);
		}

		let bondCooker: TCookerNames | null = null;

		this._data.forEach(({from, name}) => {
			if (isObjectLike(from) && 'bond' in from && from.bond === customerData.name) {
				bondCooker = name;
			}
		});

		Cooker._bondCookerCache.set(customerData.name, bondCooker);

		return bondCooker;
	}
}
