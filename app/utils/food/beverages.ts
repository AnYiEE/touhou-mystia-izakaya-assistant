import {isEqual} from 'lodash';

import {Food} from './base';
import {type TBeverages, type IBeverage} from '@/data';

export class Beverage extends Food<TBeverages> {
	private static isTagChecked: boolean;

	constructor(data: TBeverages) {
		super(data);

		this._data = data;
	}

	public get sortedTag() {
		const tags = [
			'低酒精',
			'中酒精',
			'高酒精',
			'无酒精',
			'鸡尾酒',
			'利口酒',
			'啤酒',
			'清酒',
			'烧酒',
			'西洋酒',
			'可加冰',
			'可加热',
			'甘',
			'苦',
			'辛',
			'古典',
			'现代',
			'气泡',
			'水果',
			'提神',
			'直饮',
		] as const satisfies IBeverage['tag'];

		if (Beverage.isTagChecked) {
			return tags;
		}

		const _isTagsEqual = isEqual(tags.toSorted(), this.getValuesByProp(this.data, 'tag').sort());
		if (!_isTagsEqual) {
			throw new Error(
				'[components/Beverages]: the given tags is inconsistent with the tags in the original data'
			);
		}

		Beverage.isTagChecked = true;

		return tags;
	}
}
