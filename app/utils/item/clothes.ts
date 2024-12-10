import {isObjectLike} from 'lodash';

import {siteConfig} from '@/configs';
import {CLOTHES_LIST, type TClothes, type TClothesId, type TCustomerRareId} from '@/data';
import {processPinyin} from '@/utils';
import {Item} from '@/utils/item';

const {cdnUrl} = siteConfig;

export class Clothes extends Item<TClothes> {
	private static _instance: Clothes | undefined;

	private static _bondClothesCache = new Map<TCustomerRareId, TClothesId | null>();
	private static _tachiePathCache = new Map<TClothesId, string>();

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
	public getBondClothes(customerId: TCustomerRareId) {
		if (Clothes._bondClothesCache.has(customerId)) {
			return Clothes._bondClothesCache.get(customerId);
		}

		let bondClothes: TClothesId | null = null;

		this._data.some(({from, id}) =>
			from.some((item) => {
				if (isObjectLike(item) && 'bond' in item && item.bond === customerId) {
					bondClothes = id;
					return true;
				}
				return false;
			})
		);

		Clothes._bondClothesCache.set(customerId, bondClothes);

		return bondClothes;
	}

	/**
	 * @description Get the tachie image path for a clothes.
	 */
	public getTachiePath(id: TClothesId) {
		const basePath = `${cdnUrl}/assets/tachies/clothes`;

		let path: string;

		if (Clothes._tachiePathCache.has(id)) {
			path = Clothes._tachiePathCache.get(id);
		} else {
			const {gif, pinyin} = this.getPropsById(id);
			path = `${basePath}/${processPinyin(pinyin).pinyinWithoutTone.join('')}.${gif ? 'gif' : 'png'}`;
			Clothes._tachiePathCache.set(id, path);
		}

		return path;
	}
}
