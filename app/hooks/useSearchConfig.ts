import {useMemo, type Dispatch, type SetStateAction} from 'react';

import {type SearchConfig} from '@/components/sideSearchIconButton';

interface ValueObeject {
	value: string;
}

interface UseSearchConfig<T extends ValueObeject[]> {
	label: string;
	searchItems: T;
	searchValue: string;
	setSearchValue: Dispatch<SetStateAction<string>>;
}

export function useSearchConfig<T extends ValueObeject[]>({
	label,
	searchItems,
	searchValue,
	setSearchValue,
}: UseSearchConfig<T>) {
	const searchConfig = useMemo(
		() =>
			({
				label,
				searchItems: searchItems,
				searchValue: searchValue,
				setSearchValue: setSearchValue,
			}) as const satisfies SearchConfig,
		[label, searchItems, searchValue, setSearchValue]
	);

	return searchConfig;
}
