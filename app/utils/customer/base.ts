import type {ICurrentCustomer} from '@/(pages)/customer-rare/types';

import type {ICustomer} from './types';
import {Clothes, pinyinPro, processPinyin} from '@/utils';
import {Item} from '@/utils/item';

export class Customer<Target extends ICustomer[]> extends Item<Target> {
	private static _tachiePathCache = new Map<string, string>();
	private static _tachiePinyinCache = new Map<string, string>();

	public getTachiePath(type: 'customer', data: ICurrentCustomer | null): string;
	public getTachiePath(type: 'partners', data: string): string;
	public getTachiePath(type: 'customer' | 'partners', data: string | ICurrentCustomer | null) {
		if (data === null) {
			return Clothes.getInstance().getTachiePath('夜雀服');
		}

		const basePath = '/assets/tachies';

		// The `type` is partners.
		if (typeof data === 'string') {
			let pinyin: string;

			if (Customer._tachiePinyinCache.has(data)) {
				pinyin = Customer._tachiePinyinCache.get(data);
			} else {
				pinyin = pinyinPro(data, {
					toneType: 'none',
					type: 'array',
					v: true,
				}).join('');
				Customer._tachiePinyinCache.set(data, pinyin);
			}

			return `${basePath}/${type}/${pinyin}.png`;
		}

		// The `type` is customer.
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
