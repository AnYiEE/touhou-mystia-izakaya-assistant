import { type Dispatch, type SetStateAction, useMemo } from 'react';

import {
	type IPinyinSortConfig,
	type TPinyinSortState,
} from '@/components/sidePinyinSortIconButton';

export function usePinyinSortConfig(
	pinyinSortState: TPinyinSortState,
	setPinyinSortState: Dispatch<SetStateAction<TPinyinSortState>>
) {
	const pinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({ pinyinSortState, setPinyinSortState }),
		[pinyinSortState, setPinyinSortState]
	);

	return pinyinSortConfig;
}
