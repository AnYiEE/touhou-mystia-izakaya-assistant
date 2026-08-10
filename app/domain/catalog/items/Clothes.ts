import { isObject } from 'lodash';

import { Item } from '@/domain/catalog/shared/Item';
import { CLOTHES_LIST } from '@/domain/data/clothes/records';
import type { TClothes, TClothesName } from '@/domain/data/clothes/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';

export class Clothes extends Item<TClothes> {
	private static _instance: Clothes | undefined;

	private static _bondClothesCache = new Map<
		TCustomerRareName,
		TClothesName | null
	>();
	public static getInstance() {
		if (Clothes._instance !== undefined) {
			return Clothes._instance;
		}

		const instance = new Clothes(CLOTHES_LIST, 'clothes');

		Clothes._instance = instance;

		return instance;
	}

	/**
	 * @description Get the clothes for a customer based on their bond level.
	 */
	public getBondClothes(
		customerName: TCustomerRareName
	): TClothesName | null {
		return Clothes._bondClothesCache.getOrInsertComputed(
			customerName,
			() => {
				let bondClothes: TClothesName | null = null;

				this._data.some(({ from, name }) =>
					from.some((item) => {
						if (
							isObject(item) &&
							'bond' in item &&
							item.bond === customerName
						) {
							bondClothes = name;
							return true;
						}
						return false;
					})
				);

				return bondClothes;
			}
		);
	}
}
