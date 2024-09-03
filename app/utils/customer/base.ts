import type {ICurrentCustomer} from '@/(pages)/customer-rare/types';

import type {ICustomer} from './types';
import {Item} from '@/utils/item';
import {processPinyin} from '@/utils';

export class Customer<Target extends ICustomer[]> extends Item<Target> {
	protected constructor(data: Target) {
		super(data);

		this._data = data;
	}

	public getTachiePath({name, target}: ICurrentCustomer) {
		return `/assets/tachies/${target}/${processPinyin(this.getPropsByName(name).pinyin).pinyinWithoutTone.join(
			''
		)}.png` as const;
	}
}
