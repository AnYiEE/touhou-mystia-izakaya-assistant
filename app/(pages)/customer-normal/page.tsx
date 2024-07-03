'use client';

import {memo, useMemo} from 'react';
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
import {useCustomerNormalStore} from '@/stores';

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

export default memo(function CustomerNormal() {
	const store = useCustomerNormalStore();

	store.shared.customer.name.onChange(() => {
		store.refreshCustomerSelectedItems();
		store.refreshAllSelectedItems();
	});

	const currentCustomerName = store.shared.customer.name.use();
	const currentRecipe = store.shared.recipe.data.use();

	const instance_customer = store.instances.customer.get();

	const allCustomerNames = store.names.use();
	const allCustomerDlcs = store.customer.dlcs.get();
	const allCustomerPlaces = store.customer.places.get();

	const customerPinyinSortState = store.persistence.customer.pinyinSortState.use();

	const customerSearchValue = store.persistence.customer.searchValue.use();
	const throttledCustomerSearchValue = useThrottle(customerSearchValue);

	const customerSearchResult = useSearchResult(instance_customer, throttledCustomerSearchValue);

	const customerFilterDlcs = store.persistence.customer.filters.dlcs.use();
	const customerFilterPlaces = store.persistence.customer.filters.places.use();
	const customerFilterNoPlaces = store.persistence.customer.filters.noPlaces.use();

	const customerFilteredData = useMemo(
		() =>
			customerSearchResult.filter(({dlc, places}) => {
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
			}),
		[customerFilterDlcs, customerFilterNoPlaces, customerFilterPlaces, customerSearchResult]
	);

	const customerSortedData = useSortedData(instance_customer, customerFilteredData, customerPinyinSortState);

	const customerPinyinSortConfig = usePinyinSortConfig(
		customerPinyinSortState,
		store.persistence.customer.pinyinSortState.set
	);

	const customerSearchConfig = useSearchConfig({
		label: '选择或输入普客名称',
		searchItems: allCustomerNames,
		searchValue: customerSearchValue,
		setSearchValue: store.persistence.customer.searchValue.set,
	});

	const costomerSelectConfig = useMemo(
		() =>
			[
				{
					items: allCustomerDlcs,
					label: 'DLC',
					selectedKeys: customerFilterDlcs,
					setSelectedKeys: store.persistence.customer.filters.dlcs.set,
				},
				{
					items: allCustomerPlaces,
					label: '出没地点（包含）',
					selectedKeys: customerFilterPlaces,
					setSelectedKeys: store.persistence.customer.filters.places.set,
				},
				{
					items: allCustomerPlaces,
					label: '出没地点（排除）',
					selectedKeys: customerFilterNoPlaces,
					setSelectedKeys: store.persistence.customer.filters.noPlaces.set,
				},
			] as const satisfies TSelectConfig,
		[
			allCustomerDlcs,
			allCustomerPlaces,
			customerFilterDlcs,
			customerFilterNoPlaces,
			customerFilterPlaces,
			store.persistence.customer.filters.dlcs.set,
			store.persistence.customer.filters.noPlaces.set,
			store.persistence.customer.filters.places.set,
		]
	);

	const customerTabVisibilityState = store.persistence.customer.tabVisibility.use();

	const customerTabStyle = useMemo(
		() => customerTabStyleMap[customerTabVisibilityState],
		[customerTabVisibilityState]
	);

	const isCustomerTabFilterVisible = store.shared.customer.filterVisibility.use();

	const instance_ingredient = store.instances.ingredient.get();

	const allIngredientDlcs = store.ingredient.dlcs.get();

	const ingredientsPinyinSortState = store.persistence.ingredient.pinyinSortState.use();

	const ingredientsFilterDlcs = store.persistence.ingredient.filters.dlcs.use();

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
		store.persistence.ingredient.pinyinSortState.set
	);

	const ingredientsSelectConfig = useMemo(
		() =>
			[
				{
					items: allIngredientDlcs,
					label: 'DLC',
					selectedKeys: ingredientsFilterDlcs,
					setSelectedKeys: store.persistence.ingredient.filters.dlcs.set,
				},
			] as const satisfies TSelectConfig,
		[allIngredientDlcs, ingredientsFilterDlcs, store.persistence.ingredient.filters.dlcs.set]
	);

	const ingredientTabVisibilityState = store.persistence.ingredient.tabVisibility.use();

	const ingredientTabStyle = useMemo(
		() => ingredientTabStyleMap[ingredientTabVisibilityState],
		[ingredientTabVisibilityState]
	);

	const isIngredientTabFilterVisible = store.shared.ingredient.filterVisibility.use();

	const selectedTabKey = store.shared.tab.use();

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
						store.shared.tab.set(key);
						store.shared.customer.filterVisibility.set(key === 'customer');
						store.shared.ingredient.filterVisibility.set(key === 'ingredient');
					}}
				>
					<Tab key="customer" title="普客" className="relative">
						<CustomerTabContent customerTabStyle={customerTabStyle} sortedData={customerSortedData} />
					</Tab>
					<Tab isDisabled={!currentCustomerName} key="recipe" title="料理">
						<RecipeTabContent />
					</Tab>
					<Tab isDisabled={!currentCustomerName} key="beverage" title="酒水">
						<BeverageTabContent />
					</Tab>
					<Tab isDisabled={!(currentCustomerName && currentRecipe)} key="ingredient" title="食材">
						<IngredientsTabContent
							ingredientsTabStyle={ingredientTabStyle}
							sortedData={ingredientsSortedData}
						/>
					</Tab>
				</Tabs>
			</div>

			<div className="flex w-full flex-col gap-4 xl:min-h-[calc(100vh-6.75rem)]">
				{currentCustomerName ? (
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
