export const PINYIN_SORT_STATE_MAP = {
	ascending: 1,
	descending: 2,
	none: 0,
} as const;

export type TPinyinSortState =
	(typeof PINYIN_SORT_STATE_MAP)[keyof typeof PINYIN_SORT_STATE_MAP];

type TPinyinSortStateUpdate =
	| TPinyinSortState
	| ((previousState: TPinyinSortState) => TPinyinSortState);

export interface IPinyinSortConfig {
	pinyinSortState: TPinyinSortState;
	setPinyinSortState: (update: TPinyinSortStateUpdate) => void;
}
