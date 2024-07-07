import {isEqual} from 'lodash';

import {Food} from './base';
import {type IBeverage, type TBeverages} from '@/data';

export class Beverage<
	TItem extends TBeverages[number] = TBeverages[number],
	TName extends TItem['name'] = TItem['name'],
> extends Food<TBeverages> {
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
		] as const satisfies IBeverage['tags'];

		if (Beverage.isTagChecked) {
			return tags;
		}

		const isTagsEqual = isEqual([...tags].sort(), this.getValuesByProp(this.data, 'tags').sort());
		if (!isTagsEqual) {
			throw new Error(
				'[components/Beverages]: the given tags is inconsistent with the tags in the original data'
			);
		}

		Beverage.isTagChecked = true;

		return tags;
	}

	public getCustomerSuitability<T extends TName, U extends string>(name: T, customerTags: U[]) {
		const beverage = this.getPropsByName(name);

		const {tags} = beverage;
		const {commonTags, count} = this.getCommonTags(tags, customerTags);

		return {
			suitability: count,
			tags: commonTags,
		};
	}
}
