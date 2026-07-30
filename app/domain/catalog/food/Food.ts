import { Item } from '@/domain/catalog/shared/Item';
import { DYNAMIC_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TTag } from '@/domain/data/tags/types';
import type { IPopularTrend } from '@/domain/trends/types';

import type { IFood } from './types';

export class Food<TTarget extends IFood[]> extends Item<TTarget> {
	/**
	 * @description Calculate the tags based on the original tags, the popular trend data and the famous shop state.
	 */
	protected calculateTagsWithTrend(
		tags: ReadonlyArray<TTag>,
		popularTrend: IPopularTrend,
		isFamousShop: boolean
	) {
		const tagsWithTrend = new Set(tags);
		const { isNegative: isNegativePopularTag, tag: currentPopularTag } =
			popularTrend;

		if (isFamousShop && tags.includes(DYNAMIC_TAG_MAP.signature)) {
			tagsWithTrend.add(DYNAMIC_TAG_MAP.popularPositive);
		}

		if (currentPopularTag !== null && tags.includes(currentPopularTag)) {
			tagsWithTrend.add(
				isNegativePopularTag
					? DYNAMIC_TAG_MAP.popularNegative
					: DYNAMIC_TAG_MAP.popularPositive
			);
		}

		return [...tagsWithTrend];
	}

	/**
	 * @description Obtain the common elements and their counts between two different string arrays.
	 * The type of the returned `commonTags` is changed to that of the second array to avoid type errors.
	 */
	protected getCommonTags<T extends string>(
		arrayA: ReadonlyArray<string>,
		arrayB: ReadonlyArray<T>
	) {
		const commonTags = arrayA.filter((value): value is T =>
			arrayB.includes(value as T)
		);

		return { commonTags, count: commonTags.length };
	}
}
