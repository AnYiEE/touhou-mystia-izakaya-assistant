import {useMemo, type Dispatch, type SetStateAction} from 'react';

import {type PinyinSortConfig, PinyinSortState} from '@/components/sidePinyinSortIconButton';

export function usePinyinSortConfig(
	pinyinSortState: PinyinSortState,
	setPinyinSortState: Dispatch<SetStateAction<PinyinSortState>>
) {
	const pinyinSortConfig = useMemo(
		() =>
			({
				pinyinSortState,
				setPinyinSortState,
			}) as const satisfies PinyinSortConfig,
		[pinyinSortState, setPinyinSortState]
	);

	return pinyinSortConfig;
}
