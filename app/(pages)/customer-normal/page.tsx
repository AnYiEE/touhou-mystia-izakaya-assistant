'use client';

import {memo, useMemo} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import useBreakpoint from 'use-breakpoint';
import {useMounted, usePinyinSortConfig, useSearchConfig, useSearchResult, useSortedData, useThrottle} from '@/hooks';

import {Image, Tab, Tabs} from '@nextui-org/react';

import BeverageTabContent from './beverageTabContent';
import CustomerCard from './customerCard';
import CustomerTabContent from './customerTabContent';
import IngredientTabContent from './ingredientTabContent';
import Placeholder from './placeholder';
import RecipeTabContent from './recipeTabContent';
import ResultCard from './resultCard';
import SavedMealCard from './savedMealCard';
import Loading from '@/loading';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {customerTabStyleMap, ingredientTabStyleMap, tachieBreakPoint} from './constants';
import {customerNormalStore as customerStore, globalStore} from '@/stores';

export default memo(function CustomerNormal() {
	customerStore.shared.customer.name.onChange(() => {
		customerStore.refreshCustomerSelectedItems();
		customerStore.refreshAllSelectedItems();
	});
	customerStore.shared.customer.popular.isNegative.onChange(customerStore.evaluateMealResult);
	customerStore.shared.customer.popular.tag.onChange(customerStore.evaluateMealResult);
	customerStore.shared.beverage.name.onChange(customerStore.evaluateMealResult);
	customerStore.shared.recipe.tagsWithPopular.onChange(customerStore.evaluateMealResult);

	globalStore.persistence.popular.isNegative.onChange((isNegative) => {
		customerStore.shared.customer.popular.isNegative.set(isNegative);
	});
	globalStore.persistence.popular.tag.onChange((popular) => {
		customerStore.shared.customer.popular.tag.set(popular);
	});

	const {breakpoint} = useBreakpoint(tachieBreakPoint, 'noTachie');

	const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();
	const isShowTachie = globalStore.persistence.tachie.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();

	const instance_customer = customerStore.instances.customer.get();
	const instance_ingredient = customerStore.instances.ingredient.get();

	const allCustomerNames = customerStore.names.use();
	const allCustomerDlcs = customerStore.customer.dlcs.get();
	const allCustomerPlaces = customerStore.customer.places.get();

	const customerPinyinSortState = customerStore.persistence.customer.pinyinSortState.use();

	const customerSearchValue = customerStore.persistence.customer.searchValue.use();
	const throttledCustomerSearchValue = useThrottle(customerSearchValue);

	const customerSearchResult = useSearchResult(instance_customer, throttledCustomerSearchValue);

	const customerFilterDlcs = customerStore.persistence.customer.filters.dlcs.use();
	const customerFilterPlaces = customerStore.persistence.customer.filters.places.use();
	const customerFilterNoPlaces = customerStore.persistence.customer.filters.noPlaces.use();
	const customerFilterIncludes = customerStore.persistence.customer.filters.includes.use();
	const customerFilterExcludes = customerStore.persistence.customer.filters.excludes.use();

	const customerFilteredData = useMemo(
		() =>
			customerSearchResult.filter(({name, dlc, places}) => {
				if (customerFilterIncludes.length > 0) {
					const result = customerFilterIncludes.includes(name);
					if (result) {
						return true;
					}
				}

				const isNameExcludesMatched =
					customerFilterExcludes.length > 0 ? !customerFilterExcludes.includes(name) : true;
				const isDlcMatched = customerFilterDlcs.length > 0 ? customerFilterDlcs.includes(dlc.toString()) : true;
				const isPlaceMatched =
					customerFilterPlaces.length > 0
						? customerFilterPlaces.some((place) => (places as string[]).includes(place))
						: true;
				const isNoPlaceMatched =
					customerFilterNoPlaces.length > 0
						? !customerFilterNoPlaces.some((place) => (places as string[]).includes(place))
						: true;

				return isNameExcludesMatched && isDlcMatched && isPlaceMatched && isNoPlaceMatched;
			}),
		[
			customerFilterDlcs,
			customerFilterExcludes,
			customerFilterIncludes,
			customerFilterNoPlaces,
			customerFilterPlaces,
			customerSearchResult,
		]
	);

	const customerSortedData = useSortedData(instance_customer, customerFilteredData, customerPinyinSortState);

	const customerPinyinSortConfig = usePinyinSortConfig(
		customerPinyinSortState,
		customerStore.persistence.customer.pinyinSortState.set
	);

	const customerSearchConfig = useSearchConfig({
		label: '选择或输入普客名称',
		searchItems: allCustomerNames,
		searchValue: customerSearchValue,
		setSearchValue: customerStore.persistence.customer.searchValue.set,
	});

	const customerSelectConfig = useMemo(
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
				{
					items: allCustomerNames,
					label: '额外包含',
					selectedKeys: customerFilterIncludes,
					setSelectedKeys: customerStore.persistence.customer.filters.includes.set,
				},
				{
					items: allCustomerNames,
					label: '额外排除',
					selectedKeys: customerFilterExcludes,
					setSelectedKeys: customerStore.persistence.customer.filters.excludes.set,
				},
			] as const satisfies TSelectConfig,
		[
			allCustomerDlcs,
			allCustomerNames,
			allCustomerPlaces,
			customerFilterDlcs,
			customerFilterExcludes,
			customerFilterIncludes,
			customerFilterNoPlaces,
			customerFilterPlaces,
		]
	);

	const customerTabVisibilityState = customerStore.persistence.customer.tabVisibility.use();

	const customerTabStyle = useMemo(
		() => customerTabStyleMap[customerTabVisibilityState],
		[customerTabVisibilityState]
	);

	const isCustomerTabFilterVisible = customerStore.shared.customer.filterVisibility.use();

	const allIngredientDlcs = customerStore.ingredient.dlcs.get();
	const allIngredientLevels = customerStore.ingredient.levels.get();

	const ingredientsPinyinSortState = customerStore.persistence.ingredient.pinyinSortState.use();

	const ingredientsFilterDlcs = customerStore.persistence.ingredient.filters.dlcs.use();
	const ingredientsFilterLevels = customerStore.persistence.ingredient.filters.levels.use();

	const ingredientsFilteredData = useMemo(
		() =>
			instance_ingredient.data.filter(({dlc, level}) => {
				const isDlcMatched =
					ingredientsFilterDlcs.length > 0 ? ingredientsFilterDlcs.includes(dlc.toString()) : true;
				const isLevelMatched =
					ingredientsFilterLevels.length > 0 ? ingredientsFilterLevels.includes(level.toString()) : true;

				return isDlcMatched && isLevelMatched;
			}),
		[ingredientsFilterDlcs, ingredientsFilterLevels, instance_ingredient.data]
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
				{
					items: allIngredientLevels,
					label: '等级',
					selectedKeys: ingredientsFilterLevels,
					setSelectedKeys: customerStore.persistence.ingredient.filters.levels.set,
				},
			] as const satisfies TSelectConfig,
		[allIngredientDlcs, allIngredientLevels, ingredientsFilterDlcs, ingredientsFilterLevels]
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
		<div
			className={twJoin(
				'flex flex-col gap-4 overflow-auto scrollbar-hide xl:grid xl:grid-cols-2 xl:justify-items-center',
				currentCustomerName && 'md:flex-col-reverse'
			)}
		>
			<div className="xl:w-full">
				<Tabs
					fullWidth
					destroyInactiveTabPanel={false}
					size="sm"
					selectedKey={selectedTabKey}
					onSelectionChange={customerStore.onTabSelectionChange}
					classNames={{
						tabList: twJoin('bg-default/40', isShowBackgroundImage && 'backdrop-blur'),
					}}
				>
					<Tab key="customer" title="普客" className="relative flex flex-col">
						<CustomerTabContent customerTabStyle={customerTabStyle} sortedData={customerSortedData} />
					</Tab>
					<Tab isDisabled={!currentCustomerName} key="recipe" title="料理">
						<RecipeTabContent />
					</Tab>
					<Tab isDisabled={!currentCustomerName} key="beverage" title="酒水">
						<BeverageTabContent />
					</Tab>
					<Tab isDisabled={!(currentCustomerName && currentRecipeData)} key="ingredient" title="食材">
						<IngredientTabContent
							ingredientTabStyle={ingredientTabStyle}
							sortedData={ingredientsSortedData}
						/>
					</Tab>
				</Tabs>
			</div>

			<div className={twJoin('flex flex-grow flex-col gap-4 xl:w-full', currentCustomerName && 'xl:mb-4')}>
				{currentCustomerName ? (
					<>
						<CustomerCard />
						<ResultCard />
						<SavedMealCard />
					</>
				) : (
					<Placeholder className="pt-4 xl:pb-[calc(7.25rem+env(titlebar-area-height,0rem))] xl:pt-0">
						<div className="inline-grid space-y-1">
							<span
								role="img"
								aria-hidden
								className="inline-block h-loading w-loading bg-loading xl:inline-block"
							/>
							<p>选择顾客以继续</p>
						</div>
					</Placeholder>
				)}
			</div>

			<SideButtonGroup
				className={twMerge(
					'md:top-[unset] md:translate-y-0 xl:left-6 xl:top-1/2 xl:-translate-y-1/2',
					customerTabStyle.classNames.sideButtonGroup,
					!isCustomerTabFilterVisible && '!hidden'
				)}
			>
				<SideSearchIconButton searchConfig={customerSearchConfig} />
				<SidePinyinSortIconButton pinyinSortConfig={customerPinyinSortConfig} />
				<SideFilterIconButton selectConfig={customerSelectConfig} />
			</SideButtonGroup>

			<SideButtonGroup
				className={twMerge(
					'md:top-[unset] md:translate-y-0 xl:left-6 xl:top-1/2 xl:-translate-y-1/2',
					ingredientTabStyle.classNames.sideButtonGroup,
					!isIngredientTabFilterVisible && '!hidden'
				)}
			>
				<SidePinyinSortIconButton pinyinSortConfig={ingredientsPinyinSortConfig} />
				<SideFilterIconButton selectConfig={ingredientsSelectConfig} />
			</SideButtonGroup>

			{isShowTachie && breakpoint === 'tachie' && (
				<Image
					aria-hidden
					removeWrapper
					draggable={false}
					alt=""
					// cSpell:ignore quejiuwugongzuozhuang
					src="/assets/tachies/clothes/quejiuwugongzuozhuang.png"
					width={120}
					className="pointer-events-none fixed bottom-0 right-0 pr-2"
				/>
			)}
		</div>
	);
});
