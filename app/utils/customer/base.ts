import type {ICurrentCustomer} from '@/(pages)/customer-rare/types';

import type {ICustomer} from './types';
import {siteConfig} from '@/configs';
import {Clothes, processPinyin} from '@/utils';
import {Item} from '@/utils/item';

const {cdnUrl} = siteConfig;

export class Customer<Target extends ICustomer[]> extends Item<Target> {
	private static _tachiePathCache = new Map<string, string>();

	public getTachiePath(data: ICurrentCustomer | null) {
		if (data === null) {
			return Clothes.getInstance().getTachiePath('夜雀服');
		}

		const basePath = `${cdnUrl}/assets/tachies`;

		let path: string;
		const {target, name} = data;

		if (Customer._tachiePathCache.has(name)) {
			path = Customer._tachiePathCache.get(name);
		} else {
			path = `${basePath}/${target}/${processPinyin(this.getPropsByName(name, 'pinyin')).pinyinWithoutTone.join(
				''
			)}.png`;
			Customer._tachiePathCache.set(name, path);
		}

		return path;
	}
}
