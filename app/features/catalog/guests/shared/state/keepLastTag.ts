import isNil from 'lodash/isNil.js';

import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

type TTagId = TBeverageTagId | TFoodTagId;

export function keepLastTag(
	tagSet: SelectionSet,
	tag: TTagId,
	{
		hasMystiaCooker,
		orderTag,
	}: { hasMystiaCooker?: boolean; orderTag?: TTagId | null } = {}
) {
	const hasFilteredTags = !checkLengthEmpty(tagSet);
	const hasOrderTag = !isNil(orderTag);
	const isTagExisted = tagSet.has(tag);

	if (
		hasMystiaCooker === false &&
		((isTagExisted && hasOrderTag) || !hasOrderTag)
	) {
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
