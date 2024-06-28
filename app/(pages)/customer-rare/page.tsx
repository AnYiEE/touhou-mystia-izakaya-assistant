'use client';

import {memo, useCallback, useMemo, useState} from 'react';
import clsx from 'clsx';

import {useMounted, usePinyinSortConfig, useSearchConfig, useSearchResult, useSortedData, useThrottle} from '@/hooks';

import {Tab, Tabs} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faChevronUp} from '@fortawesome/free-solid-svg-icons';

import BeverageTabContent from './beverageTabContent';
import CustomerCard from './customerCard';
import CustomerTabContent from './customerTabContent';
import Placeholder from './placeholder';
import RecipeTabContent from './recipeTabContent';
import Loading from '@/loading';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import type {ICustomerTabStyleMap} from './types';
import {useCustomerRareStore} from '@/stores';

const customerTabStyleMap = {
	collapse: {
		buttonNode: <FontAwesomeIcon icon={faChevronDown} size="sm" />,
		contentClassName: 'h-[calc(50vh-9.25rem)] min-h-[20vw]',
		sideButtonGroupClassName: 'hidden xl:block',
	},
	expand: {
		buttonNode: <FontAwesomeIcon icon={faChevronUp} size="sm" />,
		contentClassName: 'h-[50vmax]',
		sideButtonGroupClassName: '',
	},
} as const satisfies ICustomerTabStyleMap;

export default memo(function CustomerRare() {
	const store = useCustomerRareStore();

	const currentCustomer = store.share.customer.data.use();
	const currentRecipe = store.share.recipe.data.use();

	store.share.customer.data.onChange(() => {
		store.refreshCustomerSelectedItems();
		store.refreshAllSelectedItems();
	});

	const instance_rare = store.instances.customer_rare.get();
	const instance_special = store.instances.customer_special.get();

	const rareNames = store.rareNames.use();
	const specialNames = store.specialNames.use();
	const allDlcs = store.customer.dlcs.get();
	const allPlaces = store.customer.places.get();

	const customerPinyinSortState = store.page.customer.pinyinSortState.use();

	const customerSearchValue = store.page.customer.searchValue.use();
	const throttledCustomerSearchValue = useThrottle(customerSearchValue);

	const rareSearchResult = useSearchResult(instance_rare, throttledCustomerSearchValue);
	const specialSearchResult = useSearchResult(instance_special, throttledCustomerSearchValue);
	type TSearchResult = typeof rareSearchResult | typeof specialSearchResult;

	const customerFilterDlcs = store.page.customer.filters.dlcs.use();
	const customerFilterPlaces = store.page.customer.filters.places.use();
	const customerFilterNoPlaces = store.page.customer.filters.noPlaces.use();

	const customerFilter = useCallback(
		function customerFilter<T extends TSearchResult>(target: T) {
			return target.filter(({dlc, places}) => {
				const isDlcMatch = customerFilterDlcs.length ? customerFilterDlcs.includes(dlc.toString()) : true;
				const isPlaceMatch = customerFilterPlaces.length
					? customerFilterPlaces.some((place) => (places as string[]).includes(place))
					: true;
				const isNoPlaceMatch = customerFilterNoPlaces.length
					? !customerFilterNoPlaces.some((place) => (places as string[]).includes(place))
					: true;

				return isDlcMatch && isPlaceMatch && isNoPlaceMatch;
			}) as T;
		},
		[customerFilterDlcs, customerFilterPlaces, customerFilterNoPlaces]
	);

	const rareFilteredData = useMemo(() => customerFilter(rareSearchResult), [customerFilter, rareSearchResult]);
	const specialFilteredData = useMemo(
		() => customerFilter(specialSearchResult),
		[customerFilter, specialSearchResult]
	);

	const rareSortedData = useSortedData(instance_rare, rareFilteredData, customerPinyinSortState);
	const specialSortedData = useSortedData(instance_special, specialFilteredData, customerPinyinSortState);
	const customerSortedData = useMemo(
		() =>
			({
				customer_rare: rareSortedData,
				customer_special: specialSortedData,
			}) as const,
		[rareSortedData, specialSortedData]
	);

	const customerPinyinSortConfig = usePinyinSortConfig(
		customerPinyinSortState,
		store.page.customer.pinyinSortState.set
	);

	const customerSearchConfig = useSearchConfig({
		label: '选择或输入稀客名称',
		searchItems: [...rareNames, ...specialNames],
		searchValue: customerSearchValue,
		setSearchValue: store.page.customer.searchValue.set,
	});

	const costomerSelectConfig = useMemo(
		() =>
			[
				{
					label: 'DLC',
					items: allDlcs,
					selectedKeys: customerFilterDlcs,
					setSelectedKeys: store.page.customer.filters.dlcs.set,
				},
				{
					label: '出没地点（包含）',
					items: allPlaces,
					selectedKeys: customerFilterPlaces,
					setSelectedKeys: store.page.customer.filters.places.set,
				},
				{
					label: '出没地点（排除）',
					items: allPlaces,
					selectedKeys: customerFilterNoPlaces,
					setSelectedKeys: store.page.customer.filters.noPlaces.set,
				},
			] as const satisfies TSelectConfig,
		[
			allDlcs,
			allPlaces,
			customerFilterDlcs,
			customerFilterNoPlaces,
			customerFilterPlaces,
			store.page.customer.filters.dlcs.set,
			store.page.customer.filters.noPlaces.set,
			store.page.customer.filters.places.set,
		]
	);

	const customerTabVisibilityState = store.page.customer.tabVisibility.use();

	const customerTabStyle = useMemo(
		() => customerTabStyleMap[customerTabVisibilityState],
		[customerTabVisibilityState]
	);

	const [isCustomerTabFilterHidden, setIsCustomerTabFilterHidden] = useState(false);

	const isMounted = useMounted();
	if (!isMounted) {
		return <Loading />;
	}

	return (
		<div className="grid grid-cols-1 justify-items-center gap-4 xl:grid-cols-2">
			<SideButtonGroup
				className={clsx(
					'md:bottom-6 xl:bottom-[calc(50%-4rem)] xl:left-6',
					customerTabStyle.sideButtonGroupClassName,
					isCustomerTabFilterHidden && '!hidden'
				)}
			>
				<SideSearchIconButton searchConfig={customerSearchConfig} />
				<SidePinyinSortIconButton pinyinSortConfig={customerPinyinSortConfig} />
				<SideFilterIconButton selectConfig={costomerSelectConfig} />
			</SideButtonGroup>

			<div className="w-full">
				<Tabs
					fullWidth
					size="sm"
					onSelectionChange={(key) => {
						setIsCustomerTabFilterHidden(key !== 'customer_rare');
					}}
				>
					<Tab key="customer_rare" title="稀客" className="relative">
						<CustomerTabContent customerTabStyle={customerTabStyle} sortedData={customerSortedData} />
					</Tab>
					<Tab isDisabled={!currentCustomer} key="recipe" title="料理">
						<RecipeTabContent />
					</Tab>
					<Tab isDisabled={!currentCustomer} key="beverage" title="酒水">
						<BeverageTabContent />
					</Tab>
					<Tab isDisabled={!(currentCustomer && currentRecipe)} key="ingredient" title="食材">
						<div className="h-[calc(50vh-9rem)] break-all xl:h-[calc(100vh-9rem)]">
							<Placeholder>emptyemptyemptyemptyemptyemptyempty</Placeholder>
						</div>
					</Tab>
				</Tabs>
			</div>

			<div className="flex w-full flex-col xl:min-h-[calc(100vh-6.75rem)]">
				{currentCustomer ? (
					<>
						<CustomerCard />
						{currentRecipe ? (
							<Placeholder className="pb-8 pt-16">{currentRecipe.name}</Placeholder>
						) : (
							<Placeholder className="pb-8 pt-16">选择一种料理或酒水以继续</Placeholder>
						)}
					</>
				) : (
					<Placeholder className="pb-4 pt-8">选择角色以继续</Placeholder>
				)}
			</div>
		</div>
	);
});
