import {Food} from './base';
import {BEVERAGE_LIST, type TBeverageNames, type TBeverages} from '@/data';
import type {TBeverageTag} from '@/data/types';
import {checkArrayEqualOf} from '@/utils';

export class Beverage extends Food<TBeverages> {
	private static _instance: Beverage | undefined;

	/** @description Flag to check if the tags are consistent with the original data. */
	private static _isTagsChecked: boolean;

	public static getInstance() {
		if (Beverage._instance) {
			return Beverage._instance;
		}

		const instance = new Beverage(BEVERAGE_LIST);

		Beverage._instance = instance;

		return instance;
	}

	/**
	 * @description Tags sorted in the suggested order. Used for selecting beverage tags.
	 */
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

		if (Beverage._isTagsChecked) {
			return tags;
		}

		const isTagsEqual = checkArrayEqualOf(tags, this.getValuesByProp(this.data, 'tags'));
		if (!isTagsEqual) {
			throw new Error('[utils/food/Beverage]: the given tags is inconsistent with the tags in the original data');
		}

		Beverage._isTagsChecked = true;

		return tags;
	}

	/**
	 * @description Get the suitability of a beverage for a customer based on their tags.
	 * @returns An object containing the suitability of the beverage and the tags that are common to both the beverage and the customer.
	 */
	public getCustomerSuitability<T extends string>(name: TBeverageNames, customerTags: ReadonlyArray<T>) {
		const beverageTags = this.getPropsByName(name, 'tags');

		const {commonTags, count} = this.getCommonTags(beverageTags, customerTags);

		return {
			suitability: count,
			tags: commonTags,
		};
	}
}
