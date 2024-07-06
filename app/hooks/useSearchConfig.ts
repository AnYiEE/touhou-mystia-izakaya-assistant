import {type Dispatch, type SetStateAction, useMemo} from 'react';

import {type ISearchConfig} from '@/components/sideSearchIconButton';

interface IValueObject {
	value: string;
}

interface IUseSearchConfig<T extends IValueObject[]> {
	label: string;
	searchItems: T;
	searchValue: string;
	setSearchValue: Dispatch<SetStateAction<string>>;
}

export function useSearchConfig<T extends IValueObject[]>({
	label,
	searchItems,
	searchValue,
	setSearchValue,
}: IUseSearchConfig<T>) {
	const searchConfig = useMemo(
		() =>
			({
				label,
				searchItems,
				searchValue,
				setSearchValue,
			}) as const satisfies ISearchConfig,
		[label, searchItems, searchValue, setSearchValue]
	);

	return searchConfig;
}
