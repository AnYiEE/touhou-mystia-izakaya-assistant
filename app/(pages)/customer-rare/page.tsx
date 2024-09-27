'use client';

import {type Key, useCallback, useMemo} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import useBreakpoint from 'use-breakpoint';
import {
	useMounted,
	usePinyinSortConfig,
	useSearchConfig,
	useSearchResult,
	useSortedData,
	useThrottle,
	useVibrate,
} from '@/hooks';

import {Tab, Tabs} from '@nextui-org/react';

import BeverageTabContent from './beverageTabContent';
import CustomerCard from './customerCard';
import CustomerTabContent from './customerTabContent';
import IngredientTabContent from './ingredientTabContent';
import RecipeTabContent from './recipeTabContent';
import ResultCard from './resultCard';
import SavedMealCard from './savedMealCard';
import Loading from '@/loading';
import FakeNameContent from '@/components/fakeNameContent';
import Placeholder from '@/components/placeholder';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';
import Tachie from '@/components/tachie';

import {customerTabStyleMap, ingredientTabStyleMap, tachieBreakPoint} from './constants';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {checkArrayContainsOf, checkArraySubsetOf} from '@/utils';

export default function CustomerRare() {
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
	const vibrate = useVibrate();

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
					customerFilterPlaces.length > 0 ? checkArrayContainsOf(customerFilterPlaces, places) : true;
				const isNoPlaceMatched =
					customerFilterNoPlaces.length > 0 ? !checkArrayContainsOf(customerFilterNoPlaces, places) : true;

				return isNameExcludesMatched && isDlcMatched && isPlaceMatched && isNoPlaceMatched;
			}) as unknown as T;
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

	const customerTabStyle = customerTabStyleMap[customerTabVisibilityState];

	const isCustomerTabFilterVisible = customerStore.shared.customer.filterVisibility.use();

	const currentCustomerPopular = customerStore.shared.customer.popular.use();

	const instance_ingredient = customerStore.instances.ingredient.get();

	const allIngredientDlcs = customerStore.ingredient.dlcs.get();
	const allIngredientLevels = customerStore.ingredient.levels.get();
	const allIngredientTags = customerStore.ingredient.tags.get();

	const ingredientPinyinSortState = customerStore.persistence.ingredient.pinyinSortState.use();

	const ingredientFilterDlcs = customerStore.persistence.ingredient.filters.dlcs.use();
	const ingredientFilterTags = customerStore.persistence.ingredient.filters.tags.use();
	const ingredientFilterNoTags = customerStore.persistence.ingredient.filters.noTags.use();
	const ingredientFilterLevels = customerStore.persistence.ingredient.filters.levels.use();

	const ingredientFilteredData = useMemo(
		() =>
			instance_ingredient.data.filter(({dlc, level, name, tags}) => {
				const tagsWithPopular = instance_ingredient.calculateTagsWithPopular(tags, currentCustomerPopular);

				const isDlcMatched =
					ingredientFilterDlcs.length > 0 ? ingredientFilterDlcs.includes(dlc.toString()) : true;
				const isTagMatched =
					ingredientFilterTags.length > 0 ? checkArraySubsetOf(ingredientFilterTags, tagsWithPopular) : true;
				const isNoTagMatched =
					ingredientFilterNoTags.length > 0
						? !checkArrayContainsOf(ingredientFilterNoTags, tagsWithPopular)
						: true;
				const isLevelMatched =
					ingredientFilterLevels.length > 0 ? ingredientFilterLevels.includes(level.toString()) : true;

				return (
					isDlcMatched &&
					isTagMatched &&
					isNoTagMatched &&
					isLevelMatched &&
					!instance_ingredient.blockedIngredients.has(name)
				);
			}),
		[
			currentCustomerPopular,
			ingredientFilterDlcs,
			ingredientFilterLevels,
			ingredientFilterNoTags,
			ingredientFilterTags,
			instance_ingredient,
		]
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
					items: allIngredientTags,
					label: '食材标签（包含）',
					selectedKeys: ingredientFilterTags,
					setSelectedKeys: customerStore.persistence.ingredient.filters.tags.set,
				},
				{
					items: allIngredientTags,
					label: '食材标签（排除）',
					selectedKeys: ingredientFilterNoTags,
					setSelectedKeys: customerStore.persistence.ingredient.filters.noTags.set,
				},
				{
					items: allIngredientLevels,
					label: '等级',
					selectedKeys: ingredientFilterLevels,
					setSelectedKeys: customerStore.persistence.ingredient.filters.levels.set,
				},
			] as const satisfies TSelectConfig,
		[
			allIngredientDlcs,
			allIngredientLevels,
			allIngredientTags,
			ingredientFilterDlcs,
			ingredientFilterLevels,
			ingredientFilterNoTags,
			ingredientFilterTags,
		]
	);

	const ingredientTabVisibilityState = customerStore.persistence.ingredient.tabVisibility.use();

	const ingredientTabStyle = ingredientTabStyleMap[ingredientTabVisibilityState];

	const isIngredientTabFilterVisible = customerStore.shared.ingredient.filterVisibility.use();

	const selectedTabKey = customerStore.shared.tab.use();

	const onTabSelectionChange = useCallback(
		(key: Key) => {
			vibrate();
			customerStore.onTabSelectionChange(key);
		},
		[vibrate]
	);

	const isMounted = useMounted();
	if (!isMounted) {
		return (
			<>
				<Loading />
				<FakeNameContent instance={instance_rare} />
			</>
		);
	}

	return (
		<div
			className={twJoin(
				'flex flex-col gap-4 overflow-auto scrollbar-hide xl:grid xl:grid-cols-2 xl:justify-items-center',
				currentCustomerData && 'md:flex-col-reverse'
			)}
		>
			<div className="px-2 xl:w-full xl:px-0 xl:pt-2">
				<Tabs
					fullWidth
					destroyInactiveTabPanel={false}
					size="sm"
					selectedKey={selectedTabKey}
					onSelectionChange={onTabSelectionChange}
					classNames={{
						tabList: twJoin('grid grid-cols-4 bg-default/40', isShowBackgroundImage && 'backdrop-blur'),
					}}
				>
					<Tab key="customer" title="稀客" className="relative flex flex-col">
						<CustomerTabContent customerTabStyle={customerTabStyle} sortedData={customerSortedData} />
					</Tab>
					<Tab isDisabled={currentCustomerData === null} key="recipe" title="料理">
						<RecipeTabContent />
					</Tab>
					<Tab isDisabled={currentCustomerData === null} key="beverage" title="酒水">
						<BeverageTabContent />
					</Tab>
					<Tab
						isDisabled={currentCustomerData === null || currentRecipeData === null}
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

			<div className="flex flex-grow flex-col gap-4 p-2 pt-0 md:pb-0 md:pt-2 xl:w-full xl:pb-2">
				{currentCustomerData ? (
					<>
						<CustomerCard />
						<ResultCard />
						<SavedMealCard />
					</>
				) : (
					<Placeholder className="pt-4 xl:pt-0">
						<div className="inline-grid space-y-1">
							<span aria-hidden className="inline-block h-loading w-loading bg-loading" />
							<p>选择顾客以继续</p>
						</div>
					</Placeholder>
				)}
			</div>

			<SideButtonGroup
				className={twMerge(
					'xl:left-6',
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
					'xl:left-6',
					ingredientTabStyle.classNames.sideButtonGroup,
					!isIngredientTabFilterVisible && '!hidden',
					selectedTabKey === 'ingredient' && ingredientFilteredData.length === 0 && '!block'
				)}
			>
				<SidePinyinSortIconButton pinyinSortConfig={ingredientPinyinSortConfig} />
				<SideFilterIconButton selectConfig={ingredientSelectConfig} />
			</SideButtonGroup>

			{isShowTachie && breakpoint === 'tachie' && (
				<Tachie
					aria-hidden
					src={(currentCustomerData?.target === 'customer_special'
						? instance_special
						: instance_rare
					).getTachiePath('customer', currentCustomerData)}
					width={currentCustomerData?.target === 'customer_special' ? 60 : 120}
					className="pointer-events-none fixed bottom-0 right-0 pr-2"
				/>
			)}
		</div>
	);
}
