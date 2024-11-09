import {isNil} from 'lodash';

import type {TBeverageTag, TRecipeTag} from '@/data/types';

type TTags = TBeverageTag | TRecipeTag;

export function keepLastTag(
	tagSet: SelectionSet,
	tag: TTags,
	{
		hasMystiaCooker,
		orderTag,
	}: {
		hasMystiaCooker?: boolean;
		orderTag?: TTags | null;
	} = {}
) {
	const hasFilteredTags = tagSet.size > 0;
	const hasOrderTag = !isNil(orderTag);
	const isTagExisted = tagSet.has(tag);

	if (hasMystiaCooker === false && ((isTagExisted && hasOrderTag) || !hasOrderTag)) {
		if (hasFilteredTags && !hasOrderTag) {
			tagSet.clear();
		}
		return;
	}

	if (!hasFilteredTags) {
		tagSet.add(tag);
		return;
	}

	tagSet.clear();

	if (!isTagExisted) {
		tagSet.add(tag);
	}
}
