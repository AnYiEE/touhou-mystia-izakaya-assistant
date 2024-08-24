import {isEqual} from 'lodash';

import {Food} from './base';
import {type TBeverageNames, type TBeverages} from '@/data';
import type {TBeverageTag} from '@/data/types';

export class Beverage extends Food<TBeverages> {
	private static isTagsChecked: boolean;

	constructor(data: TBeverages) {
		super(data);

		this._data = data;
	}

	public get sortedTags() {
		const tags = [
			'无酒精',
			'低酒精',
			'中酒精',
			'高酒精',
			'可加冰',
			'可加热',
			'烧酒',
			'清酒',
			'鸡尾酒',
			'西洋酒',
			'利口酒',
			'啤酒',
			'直饮',
			'水果',
			'甘',
			'辛',
			'苦',
			'气泡',
			'古典',
			'现代',
			'提神',
		] as const satisfies TBeverageTag[];

		if (Beverage.isTagsChecked) {
			return tags;
		}

		const isTagsEqual = isEqual([...tags].sort(), this.getValuesByProp(this.data, 'tags').sort());
		if (!isTagsEqual) {
			throw new Error(
				'[components/Beverages]: the given tags is inconsistent with the tags in the original data'
			);
		}

		Beverage.isTagsChecked = true;

		return tags;
	}

	public getCustomerSuitability<T extends string>(name: TBeverageNames, customerTags: T[]) {
		const beverage = this.getPropsByName(name);

		const {tags} = beverage;
		const {commonTags, count} = this.getCommonTags(tags, customerTags);

		return {
			suitability: count,
			tags: commonTags,
		};
	}
}
