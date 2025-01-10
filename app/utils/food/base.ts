import type {IFood} from './types';
import {Item} from '@/utils/item/base';

import {TAG_POPULAR_NEGATIVE, TAG_POPULAR_POSITIVE, TAG_SIGNATURE, type TTag} from '@/data';
import {intersection} from '@/utilities';
import type {IPopularTrend} from '@/types';

export class Food<TTarget extends IFood[]> extends Item<TTarget> {
	/**
	 * @description Calculate the tags based on the original tags, the popular trend data and the famous shop state.
	 */
	protected calculateTagsWithTrend(tags: ReadonlyArray<TTag>, popularTrend: IPopularTrend, isFamousShop: boolean) {
		const tagsWithTrend = new Set(tags);
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popularTrend;

		if (isFamousShop && tags.includes(TAG_SIGNATURE)) {
			tagsWithTrend.add(TAG_POPULAR_POSITIVE);
		}

		if (currentPopularTag !== null && tags.includes(currentPopularTag)) {
			tagsWithTrend.add(isNegativePopularTag ? TAG_POPULAR_NEGATIVE : TAG_POPULAR_POSITIVE);
		}

		return [...tagsWithTrend];
	}

	/**
	 * @description Obtain the common elements and their counts between two different string arrays.
	 * The type of the returned `commonTags` is changed to that of the second array to avoid type errors.
	 */
	protected getCommonTags<T extends string, U extends string>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<U>) {
		const intersectionArray = intersection(arrayA as unknown as U[], arrayB);

		return {
			commonTags: intersectionArray,
			count: intersectionArray.length,
		};
	}
}
