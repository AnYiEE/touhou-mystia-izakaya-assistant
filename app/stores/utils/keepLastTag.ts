import {isNil} from 'lodash';

import {type TTags} from '@/data';

export function keepLastTag(
	tagSet: SelectionSet,
	tag: TTags,
	{
		orderTag,
		hasMystiaCooker,
	}: {
		orderTag?: TTags | null;
		hasMystiaCooker?: boolean;
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
