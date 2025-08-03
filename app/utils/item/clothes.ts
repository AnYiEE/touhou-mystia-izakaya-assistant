import { isObject } from 'lodash';

import { Item } from './base';
import {
	CLOTHES_LIST,
	type TClothes,
	type TClothesName,
	type TCustomerRareName,
} from '@/data';

import { siteConfig } from '@/configs';
import { processPinyin } from '@/utilities';

const { cdnUrl } = siteConfig;

export class Clothes extends Item<TClothes> {
	private static _instance: Clothes | undefined;

	private static _bondClothesCache = new Map<
		TCustomerRareName,
		TClothesName | null
	>();
	private static _tachiePathCache = new Map<TClothesName, string>();

	public static getInstance() {
		if (Clothes._instance !== undefined) {
			return Clothes._instance;
		}

		const instance = new Clothes(CLOTHES_LIST);

		Clothes._instance = instance;

		return instance;
	}

	/**
	 * @description Get the clothes for a customer based on their bond level.
	 */
	public getBondClothes(
		customerName: TCustomerRareName
	): TClothesName | null {
		if (Clothes._bondClothesCache.has(customerName)) {
			return Clothes._bondClothesCache.get(customerName);
		}

		let bondClothes = null;

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

		Clothes._bondClothesCache.set(customerName, bondClothes);

		return bondClothes;
	}

	/**
	 * @description Get the tachie image path for a clothes.
	 */
	public getTachiePath(name: TClothesName) {
		const basePath = `${cdnUrl}/assets/tachies/clothes`;

		let path: string;

		if (Clothes._tachiePathCache.has(name)) {
			path = Clothes._tachiePathCache.get(name);
		} else {
			const { gif, pinyin } = this.getPropsByName(name);
			path = `${basePath}/${processPinyin(pinyin).pinyinWithoutTone.join('')}.${gif ? 'gif' : 'png'}`;
			Clothes._tachiePathCache.set(name, path);
		}

		return path;
	}
}
