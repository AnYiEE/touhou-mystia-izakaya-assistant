import {isObjectLike} from 'lodash';

import {type ICurrentCustomer} from '@/(pages)/customer-rare/types';

import {siteConfig} from '@/configs';
import {CLOTHES_LIST, type TClothes, type TClothesNames} from '@/data';
import {processPinyin} from '@/utils';
import {Item} from '@/utils/item';

const {cdnUrl} = siteConfig;

export class Clothes extends Item<TClothes> {
	private static _instance: Clothes | undefined;

	private static _bondClothesCache = new Map<ICurrentCustomer['name'], TClothesNames | null>();
	private static _tachiePathCache = new Map<TClothesNames, string>();

	public static getInstance() {
		if (Clothes._instance) {
			return Clothes._instance;
		}

		const instance = new Clothes(CLOTHES_LIST);

		Clothes._instance = instance;

		return instance;
	}

	/**
	 * @description Get the clothes for a customer based on their bond level.
	 */
	public getBondClothes(customerData: ICurrentCustomer) {
		if (Clothes._bondClothesCache.has(customerData.name)) {
			return Clothes._bondClothesCache.get(customerData.name);
		}

		let bondClothes: TClothesNames | null = null;

		this._data.forEach(({from, name}) => {
			from.forEach((item) => {
				if (isObjectLike(item) && 'bond' in item && item.bond === customerData.name) {
					bondClothes = name;
				}
			});
		});

		Clothes._bondClothesCache.set(customerData.name, bondClothes);

		return bondClothes;
	}

	/**
	 * @description Get the tachie image path for a clothes.
	 */
	public getTachiePath(name: TClothesNames) {
		const basePath = `${cdnUrl}/assets/tachies/clothes`;

		let path: string;

		if (Clothes._tachiePathCache.has(name)) {
			path = Clothes._tachiePathCache.get(name);
		} else {
			const {gif, pinyin} = this.getPropsByName(name);
			path = `${basePath}/${processPinyin(pinyin).pinyinWithoutTone.join('')}.${gif ? 'gif' : 'png'}`;
			Clothes._tachiePathCache.set(name, path);
		}

		return path;
	}
}
