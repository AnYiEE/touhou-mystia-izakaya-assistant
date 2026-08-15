import { RecordCatalog } from './RecordCatalog';
import type {
	IItem,
	TAvailabilityItemWithPinyin,
	TItemWithPinyin,
} from './types';

export abstract class TaggedRecordCatalog<
	TItems extends IItem[],
	TTagId extends number,
	TItem extends TItemWithPinyin<TItems[number]> = TAvailabilityItemWithPinyin<
		TItems[number]
	>,
> extends RecordCatalog<TItems, TItem> {
	protected getCommonTags<T extends TTagId>(
		tags: ReadonlyArray<TTagId>,
		candidateTags: ReadonlyArray<T>
	) {
		const commonTags = tags.filter((tag): tag is T =>
			candidateTags.includes(tag as T)
		);

		return { commonTags, count: commonTags.length };
	}
}
