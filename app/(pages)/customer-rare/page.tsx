'use client';

import {memo, useCallback, useMemo} from 'react';
import clsx from 'clsx';

import {useMounted, usePinyinSortConfig, useSearchConfig, useSearchResult, useSortedData, useThrottle} from '@/hooks';

import {Tab, Tabs} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faChevronUp} from '@fortawesome/free-solid-svg-icons';

import BeverageTabContent from './beverageTabContent';
import CustomerCard from './customerCard';
import CustomerTabContent from './customerTabContent';
import IngredientsTabContent from './ingredientsTabContent';
import Placeholder from './placeholder';
import RecipeTabContent from './recipeTabContent';
import ResultCard from './resultCard';
import SavedMealCard from './savedMealCard';
import Loading from '@/loading';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import type {ICustomerTabStyleMap, IIngredientsTabStyleMap} from './types';
import {useCustomerRareStore, useGlobalStore} from '@/stores';

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

const ingredientTabStyleMap = {
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
} as const satisfies IIngredientsTabStyleMap;

export default memo(function CustomerRare() {
	const customerStore = useCustomerRareStore();
	const globalStore = useGlobalStore();

	customerStore.shared.customer.data.onChange(() => {
		customerStore.refreshCustomerSelectedItems();
		customerStore.refreshAllSelectedItems();
	});

	const currentGlobalPopular = globalStore.persistence.popular.use();
	customerStore.shared.customer.popular.set(currentGlobalPopular);

	globalStore.persistence.popular.onChange((popular) => {
		customerStore.shared.customer.popular.set(popular);
	});

	const currentCustomer = customerStore.shared.customer.data.use();
	const currentRecipe = customerStore.shared.recipe.data.use();

	const instance_rare = customerStore.instances.customer_rare.get();
	const instance_special = customerStore.instances.customer_special.get();

	const rareNames = customerStore.rareNames.use();
	const specialNames = customerStore.specialNames.use();
	const allCustomerDlcs = customerStore.customer.dlcs.get();
	const allCustomerPlaces = customerStore.customer.places.get();

	const customerPinyinSortState = customerStore.persistence.customer.pinyinSortState.use();

	const customerSearchValue = customerStore.persistence.customer.searchValue.use();
	const throttledCustomerSearchValue = useThrottle(customerSearchValue);

	const rareSearchResult = useSearchResult(instance_rare, throttledCustomerSearchValue);
	const specialSearchResult = useSearchResult(instance_special, throttledCustomerSearchValue);
	type TSearchResult = typeof rareSearchResult | typeof specialSearchResult;

	const customerFilterDlcs = customerStore.persistence.customer.filters.dlcs.use();
	const customerFilterPlaces = customerStore.persistence.customer.filters.places.use();
	const customerFilterNoPlaces = customerStore.persistence.customer.filters.noPlaces.use();

	const customerFilter = useCallback(
		function customerFilter<T extends TSearchResult>(target: T) {
			return target.filter(({dlc, places}) => {
				const isDlcMatch = customerFilterDlcs.length > 0 ? customerFilterDlcs.includes(dlc.toString()) : true;
				const isPlaceMatch =
					customerFilterPlaces.length > 0
						? customerFilterPlaces.some((place) => (places as string[]).includes(place))
						: true;
				const isNoPlaceMatch =
					customerFilterNoPlaces.length > 0
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
		customerStore.persistence.customer.pinyinSortState.set
	);

	const customerSearchConfig = useSearchConfig({
		label: '选择或输入稀客名称',
		searchItems: [...rareNames, ...specialNames],
		searchValue: customerSearchValue,
		setSearchValue: customerStore.persistence.customer.searchValue.set,
	});

	const costomerSelectConfig = useMemo(
		() =>
			[
				{
					items: allCustomerDlcs,
					label: 'DLC',
					selectedKeys: customerFilterDlcs,
					setSelectedKeys: customerStore.persistence.customer.filters.dlcs.set,
				},
				{
					items: allCustomerPlaces,
					label: '出没地点（包含）',
					selectedKeys: customerFilterPlaces,
					setSelectedKeys: customerStore.persistence.customer.filters.places.set,
				},
				{
					items: allCustomerPlaces,
					label: '出没地点（排除）',
					selectedKeys: customerFilterNoPlaces,
					setSelectedKeys: customerStore.persistence.customer.filters.noPlaces.set,
				},
			] as const satisfies TSelectConfig,
		[
			allCustomerDlcs,
			allCustomerPlaces,
			customerFilterDlcs,
			customerFilterNoPlaces,
			customerFilterPlaces,
			customerStore.persistence.customer.filters.dlcs.set,
			customerStore.persistence.customer.filters.noPlaces.set,
			customerStore.persistence.customer.filters.places.set,
		]
	);

	const customerTabVisibilityState = customerStore.persistence.customer.tabVisibility.use();

	const customerTabStyle = useMemo(
		() => customerTabStyleMap[customerTabVisibilityState],
		[customerTabVisibilityState]
	);

	const isCustomerTabFilterVisible = customerStore.shared.customer.filterVisibility.use();

	const instance_ingredient = customerStore.instances.ingredient.get();

	const allIngredientDlcs = customerStore.ingredient.dlcs.get();

	const ingredientsPinyinSortState = customerStore.persistence.ingredient.pinyinSortState.use();

	const ingredientsFilterDlcs = customerStore.persistence.ingredient.filters.dlcs.use();

	const ingredientsFilteredData = useMemo(
		() =>
			instance_ingredient.data.filter(({dlc}) => {
				const isDlcMatch =
					ingredientsFilterDlcs.length > 0 ? ingredientsFilterDlcs.includes(dlc.toString()) : true;

				return isDlcMatch;
			}),
		[ingredientsFilterDlcs, instance_ingredient.data]
	);

	const ingredientsSortedData = useSortedData(
		instance_ingredient,
		ingredientsFilteredData,
		ingredientsPinyinSortState
	);

	const ingredientsPinyinSortConfig = usePinyinSortConfig(
		ingredientsPinyinSortState,
		customerStore.persistence.ingredient.pinyinSortState.set
	);

	const ingredientsSelectConfig = useMemo(
		() =>
			[
				{
					items: allIngredientDlcs,
					label: 'DLC',
					selectedKeys: ingredientsFilterDlcs,
					setSelectedKeys: customerStore.persistence.ingredient.filters.dlcs.set,
				},
			] as const satisfies TSelectConfig,
		[allIngredientDlcs, ingredientsFilterDlcs, customerStore.persistence.ingredient.filters.dlcs.set]
	);

	const ingredientTabVisibilityState = customerStore.persistence.ingredient.tabVisibility.use();

	const ingredientTabStyle = useMemo(
		() => ingredientTabStyleMap[ingredientTabVisibilityState],
		[ingredientTabVisibilityState]
	);

	const isIngredientTabFilterVisible = customerStore.shared.ingredient.filterVisibility.use();

	const selectedTabKey = customerStore.shared.tab.use();

	const isMounted = useMounted();
	if (!isMounted) {
		return <Loading />;
	}

	return (
		<div className="grid h-full grid-cols-1 justify-items-center gap-4 md:flex md:flex-col-reverse md:justify-end xl:grid xl:grid-cols-2">
			<SideButtonGroup
				className={clsx(
					'md:!bottom-6 xl:!bottom-[calc(50%-3.5rem)] xl:left-6',
					customerTabStyle.sideButtonGroupClassName,
					!isCustomerTabFilterVisible && '!hidden'
				)}
			>
				<SideSearchIconButton searchConfig={customerSearchConfig} />
				<SidePinyinSortIconButton pinyinSortConfig={customerPinyinSortConfig} />
				<SideFilterIconButton selectConfig={costomerSelectConfig} />
			</SideButtonGroup>

			<SideButtonGroup
				className={clsx(
					'md:!bottom-6 xl:!bottom-[calc(50%-2rem)] xl:left-6',
					ingredientTabStyle.sideButtonGroupClassName,
					!isIngredientTabFilterVisible && '!hidden'
				)}
			>
				<SidePinyinSortIconButton pinyinSortConfig={ingredientsPinyinSortConfig} />
				<SideFilterIconButton selectConfig={ingredientsSelectConfig} />
			</SideButtonGroup>

			<div className="w-full">
				<Tabs
					fullWidth
					size="sm"
					selectedKey={selectedTabKey}
					onSelectionChange={(key) => {
						customerStore.shared.tab.set(key);
						customerStore.shared.customer.filterVisibility.set(key === 'customer');
						customerStore.shared.ingredient.filterVisibility.set(key === 'ingredient');
					}}
				>
					<Tab key="customer" title="稀客" className="relative">
						<CustomerTabContent customerTabStyle={customerTabStyle} sortedData={customerSortedData} />
					</Tab>
					<Tab isDisabled={!currentCustomer} key="recipe" title="料理">
						<RecipeTabContent />
					</Tab>
					<Tab isDisabled={!currentCustomer} key="beverage" title="酒水">
						<BeverageTabContent />
					</Tab>
					<Tab isDisabled={!(currentCustomer && currentRecipe)} key="ingredient" title="食材">
						<IngredientsTabContent
							ingredientsTabStyle={ingredientTabStyle}
							sortedData={ingredientsSortedData}
						/>
					</Tab>
				</Tabs>
			</div>

			<div className="flex w-full flex-col gap-4 xl:min-h-[calc(100vh-6.75rem)]">
				{currentCustomer ? (
					<>
						<CustomerCard />
						<ResultCard />
						<SavedMealCard />
					</>
				) : (
					<Placeholder className="pb-24 pt-32 md:pb-4 md:pt-0 xl:pb-[6.5rem] xl:pt-0">
						选择角色以继续
					</Placeholder>
				)}
			</div>
		</div>
	);
});
