import {isNil} from 'lodash';

import {type TBeverageTag, type TRecipeTag} from '@/data';
import {checkEmpty} from '@/utilities';

type TTag = TBeverageTag | TRecipeTag;

export function keepLastTag(
	tagSet: SelectionSet,
	tag: TTag,
	{
		hasMystiaCooker,
		orderTag,
	}: {
		hasMystiaCooker?: boolean;
		orderTag?: TTag | null;
	} = {}
) {
	const hasFilteredTags = !checkEmpty(tagSet);
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
