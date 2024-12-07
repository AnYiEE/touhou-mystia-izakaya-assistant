import {Food} from './base';
import {BEVERAGE_LIST, type TBeverageId, type TBeverageTagId, type TBeverages} from '@/data';
import {checkArrayEqualOf} from '@/utils';

export class Beverage extends Food<TBeverages> {
	private static _instance: Beverage | undefined;

	/** @description Flag to check if the tags are consistent with the original data. */
	private static _isTagsChecked: boolean;

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
		const tags = [
			-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
		] as const satisfies TBeverageTagId[];

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
	public getCustomerSuitability<T extends number>(id: TBeverageId, customerTags: ReadonlyArray<T>) {
		const beverageTags = this.getPropsById(id, 'tags');

		const {commonTags, count} = this.getCommonTags(beverageTags, customerTags);

		return {
			suitability: count,
			tags: commonTags,
		};
	}
}
