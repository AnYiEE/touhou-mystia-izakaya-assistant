'use client';

import {memo, useCallback, useMemo} from 'react';
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
import {customerRareStore as customerStore, globalStore} from '@/stores';

export default memo(function CustomerRare() {
	customerStore.shared.customer.data.onChange(() => {
		customerStore.refreshCustomerSelectedItems();
		customerStore.refreshAllSelectedItems();
	});

	customerStore.shared.recipe.data.onChange((data) => {
		if (data) {
			if (data.extraIngredients.length > 0) {
				customerStore.shared.customer.isDarkMatter.set(
					customerStore.instances.recipe.get().checkDarkMatter(data).isDarkMatter
				);
			} else {
				customerStore.shared.customer.isDarkMatter.set(false);
			}
		}
	});

	customerStore.shared.customer.hasMystiaCooker.onChange(customerStore.evaluateMealResult);
	customerStore.shared.customer.isDarkMatter.onChange(customerStore.evaluateMealResult);
	customerStore.shared.customer.order.onChange(customerStore.evaluateMealResult);
	customerStore.shared.customer.popular.onChange(customerStore.evaluateMealResult);
	customerStore.shared.beverage.name.onChange(customerStore.evaluateMealResult);
	customerStore.shared.recipe.tagsWithPopular.onChange(customerStore.evaluateMealResult);

	globalStore.persistence.popular.onChange((popularData) => {
		customerStore.shared.customer.popular.assign(popularData);
	});

	const {breakpoint} = useBreakpoint(tachieBreakPoint, 'noTachie');

	const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();
	const isShowTachie = globalStore.persistence.tachie.use();

	const currentCustomerData = customerStore.shared.customer.data.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();

	const instance_rare = customerStore.instances.customer_rare.get();
	const instance_special = customerStore.instances.customer_special.get();

	const rareNames = customerStore.rareNames.use();
	const specialNames = customerStore.specialNames.use();
	const allCustomerNames = useMemo(() => [...rareNames, ...specialNames], [rareNames, specialNames]);
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
	const customerFilterIncludes = customerStore.persistence.customer.filters.includes.use();
	const customerFilterExcludes = customerStore.persistence.customer.filters.excludes.use();

	const customerFilter = useCallback(
		function customerFilter<T extends TSearchResult>(target: T) {
			return target.filter(({name, dlc, places}) => {
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
			}) as T;
		},
		[
			customerFilterDlcs,
			customerFilterExcludes,
			customerFilterIncludes,
			customerFilterNoPlaces,
			customerFilterPlaces,
		]
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
		searchItems: allCustomerNames,
		searchValue: customerSearchValue,
		setSearchValue: customerStore.persistence.customer.searchValue.set,
		spriteTarget: 'customer_rare',
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
					label: '出没地区（包含）',
					selectedKeys: customerFilterPlaces,
					setSelectedKeys: customerStore.persistence.customer.filters.places.set,
				},
				{
					items: allCustomerPlaces,
					label: '出没地区（排除）',
					selectedKeys: customerFilterNoPlaces,
					setSelectedKeys: customerStore.persistence.customer.filters.noPlaces.set,
				},
				{
					items: allCustomerNames,
					label: '额外包含',
					selectedKeys: customerFilterIncludes,
					setSelectedKeys: customerStore.persistence.customer.filters.includes.set,
					spriteTarget: 'customer_rare',
				},
				{
					items: allCustomerNames,
					label: '额外排除',
					selectedKeys: customerFilterExcludes,
					setSelectedKeys: customerStore.persistence.customer.filters.excludes.set,
					spriteTarget: 'customer_rare',
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

	const instance_ingredient = customerStore.instances.ingredient.get();

	const allIngredientDlcs = customerStore.ingredient.dlcs.get();
	const allIngredientLevels = customerStore.ingredient.levels.get();

	const ingredientPinyinSortState = customerStore.persistence.ingredient.pinyinSortState.use();

	const ingredientFilterDlcs = customerStore.persistence.ingredient.filters.dlcs.use();
	const ingredientFilterLevels = customerStore.persistence.ingredient.filters.levels.use();

	const ingredientFilteredData = useMemo(
		() =>
			instance_ingredient.data.filter(({dlc, level}) => {
				const isDlcMatched =
					ingredientFilterDlcs.length > 0 ? ingredientFilterDlcs.includes(dlc.toString()) : true;
				const isLevelMatched =
					ingredientFilterLevels.length > 0 ? ingredientFilterLevels.includes(level.toString()) : true;

				return isDlcMatched && isLevelMatched;
			}),
		[ingredientFilterDlcs, ingredientFilterLevels, instance_ingredient.data]
	);

	const ingredientSortedData = useSortedData(instance_ingredient, ingredientFilteredData, ingredientPinyinSortState);

	const ingredientPinyinSortConfig = usePinyinSortConfig(
		ingredientPinyinSortState,
		customerStore.persistence.ingredient.pinyinSortState.set
	);

	const ingredientSelectConfig = useMemo(
		() =>
			[
				{
					items: allIngredientDlcs,
					label: 'DLC',
					selectedKeys: ingredientFilterDlcs,
					setSelectedKeys: customerStore.persistence.ingredient.filters.dlcs.set,
				},
				{
					items: allIngredientLevels,
					label: '等级',
					selectedKeys: ingredientFilterLevels,
					setSelectedKeys: customerStore.persistence.ingredient.filters.levels.set,
				},
			] as const satisfies TSelectConfig,
		[allIngredientDlcs, allIngredientLevels, ingredientFilterDlcs, ingredientFilterLevels]
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
				currentCustomerData && 'md:flex-col-reverse'
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
					<Tab key="customer" title="稀客" className="relative flex flex-col">
						<CustomerTabContent customerTabStyle={customerTabStyle} sortedData={customerSortedData} />
					</Tab>
					<Tab isDisabled={!currentCustomerData} key="recipe" title="料理">
						<RecipeTabContent />
					</Tab>
					<Tab isDisabled={!currentCustomerData} key="beverage" title="酒水">
						<BeverageTabContent />
					</Tab>
					<Tab
						isDisabled={!(currentCustomerData && currentRecipeData)}
						key="ingredient"
						title="食材"
						className="px-0"
					>
						<IngredientTabContent
							ingredientTabStyle={ingredientTabStyle}
							sortedData={ingredientSortedData}
						/>
					</Tab>
				</Tabs>
			</div>

			<div className={twJoin('flex flex-grow flex-col gap-4 xl:w-full', currentCustomerData && 'xl:mb-4')}>
				{currentCustomerData ? (
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
				<SidePinyinSortIconButton pinyinSortConfig={ingredientPinyinSortConfig} />
				<SideFilterIconButton selectConfig={ingredientSelectConfig} />
			</SideButtonGroup>

			{isShowTachie && breakpoint === 'tachie' && (
				<Image
					aria-hidden
					removeWrapper
					draggable={false}
					alt=""
					src={(currentCustomerData?.target === 'customer_special'
						? instance_special
						: instance_rare
					).getTachiePath('customer', currentCustomerData)}
					width={currentCustomerData?.target === 'customer_special' ? 60 : 120}
					className="pointer-events-none fixed bottom-0 right-0 select-none pr-2"
				/>
			)}
		</div>
	);
});
