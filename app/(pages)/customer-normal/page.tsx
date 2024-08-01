'use client';

import {memo, useCallback, useEffect, useMemo} from 'react';
import {twMerge} from 'tailwind-merge';

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

import {evaluateMeal} from './evaluateMeal';
import type {ICustomerTabStyleMap, IIngredientsTabStyleMap, TRecipe} from './types';
import {type TIngredientNames} from '@/data';
import {type TPopularTag, useCustomerNormalStore, useGlobalStore} from '@/stores';

const customerTabStyleMap = {
	collapse: {
		ariaLabel: '展开',
		buttonNode: <FontAwesomeIcon icon={faChevronDown} size="sm" />,
		contentClassName: 'h-[calc(50vh-9.25rem)] min-h-[20vw]',
		sideButtonGroupClassName: 'hidden xl:block',
	},
	expand: {
		ariaLabel: '收起',
		buttonNode: <FontAwesomeIcon icon={faChevronUp} size="sm" />,
		contentClassName: 'h-[50vmax]',
		sideButtonGroupClassName: '',
	},
} as const satisfies ICustomerTabStyleMap;

const ingredientTabStyleMap = {
	collapse: {
		ariaLabel: '展开',
		buttonNode: <FontAwesomeIcon icon={faChevronDown} size="sm" />,
		contentClassName: 'h-[calc(50vh-9.25rem)] min-h-[20vw]',
		sideButtonGroupClassName: 'hidden xl:block',
	},
	expand: {
		ariaLabel: '收起',
		buttonNode: <FontAwesomeIcon icon={faChevronUp} size="sm" />,
		contentClassName: 'h-[50vmax]',
		sideButtonGroupClassName: '',
	},
} as const satisfies IIngredientsTabStyleMap;

export default memo(function CustomerNormal() {
	const customerStore = useCustomerNormalStore();
	const globalStore = useGlobalStore();

	useEffect(() => {
		customerStore.shared.customer.popular.set(globalStore.persistence.popular.get());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	customerStore.shared.customer.name.onChange(() => {
		customerStore.shared.customer.popular.set(globalStore.persistence.popular.get());
		customerStore.refreshCustomerSelectedItems();
		customerStore.refreshAllSelectedItems();
	});

	globalStore.persistence.popular.isNegative.onChange((isNegative) => {
		customerStore.shared.customer.popular.isNegative.set(isNegative);
	});
	globalStore.persistence.popular.tag.onChange((popular) => {
		customerStore.shared.customer.popular.tag.set(popular);
	});

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentRecipe = customerStore.shared.recipe.data.use();

	const instance_customer = customerStore.instances.customer.get();
	const instance_ingredient = customerStore.instances.ingredient.get();
	const instance_recipe = customerStore.instances.recipe.get();

	const evaluateMealHelper = useCallback(() => {
		if (!currentCustomerName) {
			return;
		}

		const currentBeverageName = customerStore.shared.beverage.name.get();
		const currentCustomerPopularData = customerStore.shared.customer.popular.get();
		const {positiveTags: currentCustomerPositiveTags} = instance_customer.getPropsByName(currentCustomerName);

		let currentExtraIngredients: TIngredientNames[] = [];
		const currentRecipeData = customerStore.shared.recipe.data.get();
		if (currentRecipeData) {
			currentExtraIngredients = currentRecipeData.extraIngredients;
		}

		const currentExtraTags: TPopularTag[] = [];
		currentExtraIngredients.forEach((ingredient) => {
			currentExtraTags.push(...instance_ingredient.getPropsByName(ingredient).tags);
		});

		let recipe: TRecipe | null = null;
		if (currentRecipeData) {
			recipe = instance_recipe.getPropsByName(currentRecipeData.name);
		}

		const rating = evaluateMeal({
			currentBeverageName,
			currentCustomerPopularData,
			currentCustomerPositiveTags,
			currentExtraIngredientsLength: currentExtraIngredients.length,
			currentExtraTags,
			currentRecipe: recipe,
		});

		customerStore.shared.customer.rating.set(rating);
	}, [
		currentCustomerName,
		customerStore.shared.beverage.name,
		customerStore.shared.customer.popular,
		customerStore.shared.customer.rating,
		customerStore.shared.recipe.data,
		instance_customer,
		instance_ingredient,
		instance_recipe,
	]);

	customerStore.shared.customer.popular.isNegative.onChange(evaluateMealHelper);
	customerStore.shared.customer.popular.tag.onChange(evaluateMealHelper);
	customerStore.shared.beverage.name.onChange(evaluateMealHelper);
	customerStore.shared.recipe.tagsWithPopular.onChange(evaluateMealHelper);

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

	const customerFilteredData = useMemo(
		() =>
			customerSearchResult.filter(({dlc, places}) => {
				const isDlcMatched = customerFilterDlcs.length > 0 ? customerFilterDlcs.includes(dlc.toString()) : true;
				const isPlaceMatched =
					customerFilterPlaces.length > 0
						? customerFilterPlaces.some((place) => (places as string[]).includes(place))
						: true;
				const isNoPlaceMatched =
					customerFilterNoPlaces.length > 0
						? !customerFilterNoPlaces.some((place) => (places as string[]).includes(place))
						: true;

				return isDlcMatched && isPlaceMatched && isNoPlaceMatched;
			}),
		[customerFilterDlcs, customerFilterNoPlaces, customerFilterPlaces, customerSearchResult]
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
		[
			allIngredientDlcs,
			ingredientsFilterDlcs,
			customerStore.persistence.ingredient.filters.dlcs.set,
			customerStore.persistence.ingredient.filters.levels.set,
			allIngredientLevels,
			ingredientsFilterLevels,
		]
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
					<Placeholder className="pb-24 pt-16 md:pb-8 md:pt-0 xl:pb-[6.25rem] xl:pt-0">
						选择角色以继续
					</Placeholder>
				)}
			</div>

			<SideButtonGroup
				className={twMerge(
					'md:!bottom-6 xl:!bottom-[calc(50%-3.75rem-env(titlebar-area-height,0rem)/2)] xl:left-6',
					customerTabStyle.sideButtonGroupClassName,
					!isCustomerTabFilterVisible && '!hidden'
				)}
			>
				<SideSearchIconButton searchConfig={customerSearchConfig} />
				<SidePinyinSortIconButton pinyinSortConfig={customerPinyinSortConfig} />
				<SideFilterIconButton selectConfig={customerSelectConfig} />
			</SideButtonGroup>

			<SideButtonGroup
				className={twMerge(
					'md:!bottom-6 xl:!bottom-[calc(50%-2.25rem-env(titlebar-area-height,0rem)/2)] xl:left-6',
					ingredientTabStyle.sideButtonGroupClassName,
					!isIngredientTabFilterVisible && '!hidden'
				)}
			>
				<SidePinyinSortIconButton pinyinSortConfig={ingredientsPinyinSortConfig} />
				<SideFilterIconButton selectConfig={ingredientsSelectConfig} />
			</SideButtonGroup>
		</div>
	);
});
