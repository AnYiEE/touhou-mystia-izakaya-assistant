import { getSourceEntries } from '@/domain/data/shared/sourceEntries';

import { memoize } from '@/shared/utilities/cache/memoize';

import type { IDecoration } from './schema';

type TDecorationFrom = IDecoration['from'];
type TDecorationSource =
	| {
			bond: NonNullable<TDecorationFrom['bond']>;
			task?: NonNullable<TDecorationFrom['task']>;
	  }
	| { collaboration: NonNullable<TDecorationFrom['collaboration']> }
	| { completion: NonNullable<TDecorationFrom['completion']> };

function getDecorationSourcesUncached(from: IDecoration['from']) {
	const sources: TDecorationSource[] = [];
	for (const source of getSourceEntries<IDecoration['from']>(from)) {
		/** `task` is an additional condition of the bond source, not a sibling source. */
		if ('task' in source) {
			continue;
		}
		if ('bond' in source) {
			sources.push({
				bond: source.bond,
				...(from.task === undefined ? {} : { task: from.task }),
			});
		} else if ('collaboration' in source) {
			sources.push({ collaboration: source.collaboration });
		} else if ('completion' in source) {
			sources.push({ completion: source.completion });
		}
	}
	return sources;
}

export const getDecorationSources = memoize(
	getDecorationSourcesUncached,
	'WeakMap'
);
