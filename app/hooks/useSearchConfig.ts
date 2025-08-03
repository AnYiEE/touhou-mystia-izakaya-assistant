import { type Dispatch, type SetStateAction, useMemo } from 'react';

import { type ISearchConfig } from '@/components/sideSearchIconButton';

import type { TSpriteTarget } from '@/utils/sprite/types';

interface IUseSearchConfig<T extends ValueCollection[]> {
	label: string;
	searchItems: T;
	searchValue: string;
	setSearchValue: Dispatch<SetStateAction<string>>;
	spriteTarget?: TSpriteTarget;
}

export function useSearchConfig<T extends ValueCollection[]>({
	label,
	searchItems,
	searchValue,
	setSearchValue,
	spriteTarget,
}: IUseSearchConfig<T>) {
	const searchConfig = useMemo<ISearchConfig>(
		() => ({
			label,
			searchItems,
			searchValue,
			setSearchValue,
			spriteTarget: spriteTarget as TSpriteTarget,
		}),
		[label, searchItems, searchValue, setSearchValue, spriteTarget]
	);

	return searchConfig;
}
