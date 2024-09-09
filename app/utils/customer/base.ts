import type {ICurrentCustomer} from '@/(pages)/customer-rare/types';

import type {ICustomer} from './types';
import {Item} from '@/utils/item';
import {pinyinPro, processPinyin} from '@/utils';

export class Customer<Target extends ICustomer[]> extends Item<Target> {
	private static tachiePathCache = new Map<string, string>();
	private static tachiePinyinCache = new Map<string, string>();

	public getTachiePath(type: 'customer', data: ICurrentCustomer | null): string;
	public getTachiePath(type: 'clothes' | 'partners', data: string, isGif?: boolean): string;
	public getTachiePath(
		type: 'customer' | 'clothes' | 'partners',
		data: string | ICurrentCustomer | null,
		isGif?: boolean
	) {
		const basePath = '/assets/tachies';

		// The `type` is clothes or partners.
		if (typeof data === 'string') {
			let pinyin: string;
			if (Customer.tachiePinyinCache.has(data)) {
				pinyin = Customer.tachiePinyinCache.get(data);
			} else {
				pinyin = pinyinPro(data, {
					toneType: 'none',
					type: 'array',
					v: true,
				}).join('');
				Customer.tachiePinyinCache.set(data, pinyin);
			}

			return `${basePath}/${type}/${pinyin}.${isGif ? 'gif' : 'png'}`;
		}

		if (!data) {
			// cSpell:ignore yequefu
			return `${basePath}/clothes/yequefu.png`;
		}

		const {target, name} = data;

		let path: string;
		if (Customer.tachiePathCache.has(name)) {
			path = Customer.tachiePathCache.get(name);
		} else {
			path = `${basePath}/${target}/${processPinyin(this.getPropsByName(name, 'pinyin')).pinyinWithoutTone.join(
				''
			)}.png`;
			Customer.tachiePathCache.set(name, path);
		}

		return path;
	}
}
