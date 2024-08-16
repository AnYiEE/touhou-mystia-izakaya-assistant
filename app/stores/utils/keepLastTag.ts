import {type TTags} from '@/data';

export function keepLastTag(tagSet: SelectionSet, tag: TTags) {
	const hasTags = tagSet.size > 0;

	if (!hasTags) {
		tagSet.add(tag);
		return;
	}

	const isTagExisted = tagSet.has(tag);

	tagSet.clear();

	if (!isTagExisted) {
		tagSet.add(tag);
	}
}
