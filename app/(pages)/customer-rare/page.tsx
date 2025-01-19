'use client';

import {type Key, useCallback, useMemo} from 'react';

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

import {Tab, Tabs} from '@heroui/tabs';

import {cn} from '@/design/ui/components';

import BeverageTabContent from './beverageTabContent';
import CustomerCard from './customerCard';
import CustomerTabContent from './customerTabContent';
import IngredientTabContent from './ingredientTabContent';
import RecipeTabContent from './recipeTabContent';
import ResultCard from './resultCard';
import SavedMealCard from './savedMealCard';
import Loading from '@/loading';
import Placeholder from '@/components/placeholder';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';
import Tachie from '@/components/tachie';

import {customerTabStyleMap, ingredientTabStyleMap, tachieBreakPoint} from './constants';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {checkArrayContainsOf, checkArraySubsetOf} from '@/utilities';

export default function CustomerRare() {
	const {breakpoint} = useBreakpoint(tachieBreakPoint, 'noTachie');
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const isShowTachie = globalStore.persistence.tachie.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();

	const instance_customer = customerStore.instances.customer.get();

	const allCustomerNames = customerStore.customerNames.use();
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
			customerSearchResult.filter(({dlc, name, places}) => {
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

	const currentCustomerPopularTrend = customerStore.shared.customer.popularTrend.use();
	const isFamousShop = customerStore.shared.customer.famousShop.use();

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
				const tagsWithTrend = instance_ingredient.calculateTagsWithTrend(
					tags,
					currentCustomerPopularTrend,
					isFamousShop
				);

				const isDlcMatched =
					ingredientFilterDlcs.length > 0 ? ingredientFilterDlcs.includes(dlc.toString()) : true;
				const isTagMatched =
					ingredientFilterTags.length > 0 ? checkArraySubsetOf(ingredientFilterTags, tagsWithTrend) : true;
				const isNoTagMatched =
					ingredientFilterNoTags.length > 0
						? !checkArrayContainsOf(ingredientFilterNoTags, tagsWithTrend)
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
			currentCustomerPopularTrend,
			ingredientFilterDlcs,
			ingredientFilterLevels,
			ingredientFilterNoTags,
			ingredientFilterTags,
			instance_ingredient,
			isFamousShop,
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
			vibrate(key !== selectedTabKey);
			customerStore.onTabSelectionChange(key);
		},
		[selectedTabKey, vibrate]
	);

	const isMounted = useMounted();
	if (!isMounted) {
		return <Loading />;
	}

	return (
		<div
			className={cn(
				'flex min-h-main-content-pb-0 flex-col gap-4 overflow-auto scrollbar-hide xl:grid xl:grid-cols-2 xl:justify-items-center',
				{
					'md:flex-col-reverse md:justify-end': currentCustomerName !== null,
				}
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
						tab: cn(
							'transition data-[hover=true]:!opacity-100 data-[hover-unselected=true]:brightness-95 data-[pressed=true]:!brightness-90 motion-reduce:transition-none',
							isHighAppearance
								? 'data-[hover-unselected=true]:bg-default-200/40 data-[pressed=true]:!bg-default-200/40'
								: 'data-[hover-unselected=true]:bg-default-200 data-[pressed=true]:!bg-default-200'
						),
						tabList: cn('grid grid-cols-4 bg-default/40', {
							'backdrop-blur': isHighAppearance,
						}),
					}}
				>
					<Tab key="customer" title="稀客" className="relative flex flex-col">
						<CustomerTabContent customerTabStyle={customerTabStyle} sortedData={customerSortedData} />
					</Tab>
					<Tab isDisabled={currentCustomerName === null} key="recipe" title="料理">
						<RecipeTabContent />
					</Tab>
					<Tab isDisabled={currentCustomerName === null} key="beverage" title="酒水">
						<BeverageTabContent />
					</Tab>
					<Tab
						isDisabled={currentCustomerName === null || currentRecipeData === null}
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

			<div
				className={cn('flex flex-col gap-4 p-2 pt-0 md:pb-0 md:pt-2 xl:w-full xl:pb-2', {
					'flex-grow': currentCustomerName === null,
				})}
			>
				{currentCustomerName ? (
					<>
						<CustomerCard />
						<ResultCard />
						<SavedMealCard />
					</>
				) : (
					<Placeholder className="pb-5 md:pb-9 xl:pb-0">
						<span aria-hidden className="block h-loading w-loading bg-loading" />
						<p>选择顾客以继续</p>
					</Placeholder>
				)}
			</div>

			<SideButtonGroup
				className={cn('xl:left-6', customerTabStyle.classNames.sideButtonGroup, {
					'!hidden': !isCustomerTabFilterVisible,
				})}
			>
				<SideSearchIconButton searchConfig={customerSearchConfig} />
				<SidePinyinSortIconButton pinyinSortConfig={customerPinyinSortConfig} />
				<SideFilterIconButton selectConfig={customerSelectConfig} />
			</SideButtonGroup>

			<SideButtonGroup
				className={cn('xl:left-6', ingredientTabStyle.classNames.sideButtonGroup, {
					'!block': selectedTabKey === 'ingredient' && ingredientFilteredData.length === 0,
					'!hidden': !isIngredientTabFilterVisible,
				})}
			>
				<SidePinyinSortIconButton pinyinSortConfig={ingredientPinyinSortConfig} />
				<SideFilterIconButton selectConfig={ingredientSelectConfig} />
			</SideButtonGroup>

			{isShowTachie && breakpoint === 'tachie' && currentCustomerName !== null && (
				<Tachie
					aria-hidden
					alt={currentCustomerName}
					src={instance_customer.getTachiePath(currentCustomerName)}
					width={currentCustomerName === '蹦蹦跳跳的三妖精' || currentCustomerName === '萌澄果' ? 60 : 120}
					className="pointer-events-none fixed bottom-0 right-0 pr-1"
				/>
			)}
		</div>
	);
}
