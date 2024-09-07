import {type Dispatch, type SetStateAction, useMemo} from 'react';

import {type ISearchConfig} from '@/components/sideSearchIconButton';

import type {TSpriteTarget} from '@/utils/sprite/types';

interface IValueObject {
	value: string;
}

interface IUseSearchConfig<T extends IValueObject[]> {
	label: string;
	searchItems: T;
	searchValue: string;
	setSearchValue: Dispatch<SetStateAction<string>>;
	spriteTarget?: TSpriteTarget;
}

export function useSearchConfig<T extends IValueObject[]>({
	label,
	searchItems,
	searchValue,
	setSearchValue,
	spriteTarget,
}: IUseSearchConfig<T>) {
	const searchConfig = useMemo(
		() =>
			({
				label,
				searchItems,
				searchValue,
				setSearchValue,
				spriteTarget: spriteTarget as TSpriteTarget,
			}) as const satisfies ISearchConfig,
		[label, searchItems, searchValue, setSearchValue, spriteTarget]
	);

	return searchConfig;
}
