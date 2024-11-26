'use client';

import {twJoin} from 'tailwind-merge';

import {
	useMounted,
	usePinyinSortConfig,
	useSearchConfig,
	useSearchResult,
	useSkipProcessItemData,
	useSortedData,
	useThrottle,
} from '@/hooks';

import Content from '@/(pages)/currencies/content';
import Loading from '@/loading';
import FakeNameContent from '@/components/fakeNameContent';
import Placeholder from '@/components/placeholder';
import SideButtonGroup from '@/components/sideButtonGroup';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {currenciesStore as store} from '@/stores';

export default function Currencies() {
	const shouldSkipProcessData = useSkipProcessItemData();

	const instance = store.instance.get();

	const allNames = store.names.use();

	const pinyinSortState = store.persistence.pinyinSortState.use();
	const searchValue = store.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const sortedData = useSortedData(instance, searchResult, pinyinSortState);

	const pinyinSortConfig = usePinyinSortConfig(pinyinSortState, store.persistence.pinyinSortState.set);

	const searchConfig = useSearchConfig({
		label: '选择或输入货币名称',
		searchItems: allNames,
		searchValue,
		setSearchValue: store.persistence.searchValue.set,
		spriteTarget: 'currency',
	});

	const isMounted = useMounted();
	if (!isMounted) {
		return (
			<>
				<Loading />
				<FakeNameContent instance={instance} />
			</>
		);
	}

	const isEmpty = sortedData.length === 0;

	return (
		<div
			className={twJoin(
				'min-h-main-content',
				isEmpty
					? 'flex justify-center'
					: 'grid h-min grid-cols-2 content-start justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
			)}
		>
			{!shouldSkipProcessData && (
				<SideButtonGroup>
					<SideSearchIconButton searchConfig={searchConfig} />
					<SidePinyinSortIconButton pinyinSortConfig={pinyinSortConfig} />
				</SideButtonGroup>
			)}
			{isEmpty ? <Placeholder>数据为空</Placeholder> : <Content data={sortedData} />}
		</div>
	);
}
