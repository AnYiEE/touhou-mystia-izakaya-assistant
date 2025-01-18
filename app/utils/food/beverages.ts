import {Food} from './base';
import {BEVERAGE_LIST, type TBeverageName, type TBeverageTag, type TBeverages} from '@/data';

import {checkArrayEqualOf} from '@/utilities';

export class Beverage extends Food<TBeverages> {
	private static _instance: Beverage | undefined;

	/** @description Flag to check if the tags are consistent with the original data. */
	private static _isTagsChecked: boolean;
	private static _sortedTags = [
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

	public static getInstance() {
		if (Beverage._instance !== undefined) {
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
		if (Beverage._isTagsChecked) {
			return Beverage._sortedTags;
		}

		const isTagsEqual = checkArrayEqualOf(Beverage._sortedTags, this.getValuesByProp('tags'));
		if (!isTagsEqual) {
			throw new Error('[utils/food/Beverage]: the given tags is inconsistent with the tags in the original data');
		}

		Beverage._isTagsChecked = true;

		return Beverage._sortedTags;
	}

	/**
	 * @description Get the suitability of a beverage for a customer based on their tags.
	 * @returns An object containing the suitability of the beverage and the tags that are common to both the beverage and the customer.
	 */
	public getCustomerSuitability<T extends string>(name: TBeverageName, customerTags: ReadonlyArray<T>) {
		const beverageTags = this.getPropsByName(name, 'tags');

		const {commonTags, count} = this.getCommonTags(beverageTags, customerTags);

		return {
			suitability: count,
			tags: commonTags,
		};
	}
}
