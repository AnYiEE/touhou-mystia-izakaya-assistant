import {type Dispatch, type SetStateAction, useMemo} from 'react';

import {type IPinyinSortConfig, PinyinSortState} from '@/components/sidePinyinSortIconButton';

export function usePinyinSortConfig(
	pinyinSortState: PinyinSortState,
	setPinyinSortState: Dispatch<SetStateAction<PinyinSortState>>
) {
	const pinyinSortConfig = useMemo(
		() =>
			({
				pinyinSortState,
				setPinyinSortState,
			}) as const satisfies IPinyinSortConfig,
		[pinyinSortState, setPinyinSortState]
	);

	return pinyinSortConfig;
}
