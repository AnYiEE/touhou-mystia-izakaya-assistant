'use client';

import { type Key, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import useBreakpoint from 'use-breakpoint';
import {
	useFilteredData,
	useMounted,
	usePathname,
	useSearchResult,
	useSortedData,
	useThrottle,
	useVibrate,
} from '@/hooks';

import { Tab, Tabs } from '@heroui/tabs';

import { FadeMotionDiv, cn, useReducedMotion } from '@/design/ui/components';

import BeverageTabContent from '../beverageTabContent';
import CustomerCard from '../customerCard';
import CustomerTabContent from '../customerTabContent';
import IngredientTabContent from '../ingredientTabContent';
import RecipeTabContent from '../recipeTabContent';
import ResultCard from '../resultCard';
import SavedMealCard from '../savedMealCard';
import Loading from '@/loading';
import Placeholder from '@/components/placeholder';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton, {
	type IPinyinSortConfig,
} from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton, {
	type ISearchConfig,
} from '@/components/sideSearchIconButton';
import Tachie from '@/components/tachie';

import {
	customerTabStyleMap,
	ingredientTabStyleMap,
	tachieBreakPointMap,
} from '../constants';
import { siteConfig } from '@/configs';
import { type TCustomerNormalName } from '@/data';
import { customerNormalStore as customerStore, globalStore } from '@/stores';
import {
	checkArrayContainsOf,
	checkArraySubsetOf,
	checkLengthEmpty,
	getPageTitle,
} from '@/utilities';

const { enName, name: zhName } = siteConfig;

function validateName(name: string | undefined) {
	const instance_customer = customerStore.instances.customer.get();

	try {
		const decodedName = decodeURIComponent(name ?? '');
		instance_customer.findIndexByName(decodedName as never);
		return decodedName as TCustomerNormalName;
	} catch {
		return null;
	}
}

export default function Content() {
	const { pathname } = usePathname();
	const router = useRouter();

	useEffect(() => {
		const validName = validateName(pathname.split('/')[2]);

		customerStore.shared.customer.name.set(validName);

		const title = `${validName === null ? '' : `${validName} | `}${getPageTitle('/customer-normal')} | ${zhName} - ${enName}`;
		const observer = new MutationObserver((_, ob) => {
			if (
				location.pathname.startsWith('/customer-normal') &&
				document.title.trim() !== title
			) {
				document.title = title;
				ob.disconnect();
			}
		});

		document.title = title;
		observer.observe(document.head, { childList: true });

		return () => {
			observer.disconnect();
		};
	}, [pathname]);

	const { breakpoint } = useBreakpoint(tachieBreakPointMap, 'noTachie');
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const isShowTachie = globalStore.persistence.tachie.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();

	useEffect(() => {
		if (currentCustomerName === null) {
			router.replace('/customer-normal');
		}
	}, [currentCustomerName, router]);

	const instance_customer = customerStore.instances.customer.get();

	const availableCustomerDlcs = customerStore.availableCustomerDlcs.use();
	const availableCustomerNames = customerStore.availableCustomerNames.use();
	const availableCustomerPlaces = customerStore.availableCustomerPlaces.use();

	const customerPinyinSortState =
		customerStore.persistence.customer.pinyinSortState.use();

	const customerSearchValue =
		customerStore.persistence.customer.searchValue.use();
	const throttledCustomerSearchValue = useThrottle(customerSearchValue);

	const customerSearchResult = useSearchResult(
		instance_customer,
		throttledCustomerSearchValue
	);

	const customerFilterDlcs =
		customerStore.persistence.customer.filters.dlcs.use();
	const customerFilterPlaces =
		customerStore.persistence.customer.filters.places.use();
	const customerFilterNoPlaces =
		customerStore.persistence.customer.filters.noPlaces.use();
	const customerFilterIncludes =
		customerStore.persistence.customer.filters.includes.use();
	const customerFilterExcludes =
		customerStore.persistence.customer.filters.excludes.use();

	const filterCustomerData = useCallback(
		() =>
			customerSearchResult.filter(({ dlc, name, places }) => {
				if (customerFilterIncludes.includes(name)) {
					return true;
				}

				const isNameExcludesMatched =
					checkLengthEmpty(customerFilterExcludes) ||
					!customerFilterExcludes.includes(name);
				const isDlcMatched =
					checkLengthEmpty(customerFilterDlcs) ||
					customerFilterDlcs.includes(dlc.toString());
				const isPlaceMatched =
					checkLengthEmpty(customerFilterPlaces) ||
					checkArrayContainsOf(customerFilterPlaces, places);
				const isNoPlaceMatched =
					checkLengthEmpty(customerFilterNoPlaces) ||
					!checkArrayContainsOf(customerFilterNoPlaces, places);

				return (
					isNameExcludesMatched &&
					isDlcMatched &&
					isPlaceMatched &&
					isNoPlaceMatched
				);
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

	const customerFilteredData = useFilteredData(
		instance_customer,
		filterCustomerData
	);

	const customerSortedData = useSortedData(
		instance_customer,
		customerFilteredData,
		customerPinyinSortState
	);

	const customerPinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState: customerPinyinSortState,
			setPinyinSortState:
				customerStore.persistence.customer.pinyinSortState.set,
		}),
		[customerPinyinSortState]
	);

	const customerSearchConfig = useMemo<ISearchConfig>(
		() => ({
			label: '选择或输入普客名称',
			searchItems: availableCustomerNames,
			searchValue: customerSearchValue,
			setSearchValue: customerStore.persistence.customer.searchValue.set,
			spriteTarget: 'customer_normal',
		}),
		[availableCustomerNames, customerSearchValue]
	);

	const customerSelectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableCustomerDlcs,
				label: 'DLC',
				selectedKeys: customerFilterDlcs,
				setSelectedKeys:
					customerStore.persistence.customer.filters.dlcs.set,
			},
			{
				items: availableCustomerPlaces,
				label: '出没地区（包含）',
				selectedKeys: customerFilterPlaces,
				setSelectedKeys:
					customerStore.persistence.customer.filters.places.set,
			},
			{
				items: availableCustomerPlaces,
				label: '出没地区（排除）',
				selectedKeys: customerFilterNoPlaces,
				setSelectedKeys:
					customerStore.persistence.customer.filters.noPlaces.set,
			},
			{
				items: availableCustomerNames,
				label: '额外包含',
				selectedKeys: customerFilterIncludes,
				setSelectedKeys:
					customerStore.persistence.customer.filters.includes.set,
				spriteTarget: 'customer_normal',
			},
			{
				items: availableCustomerNames,
				label: '额外排除',
				selectedKeys: customerFilterExcludes,
				setSelectedKeys:
					customerStore.persistence.customer.filters.excludes.set,
				spriteTarget: 'customer_normal',
			},
		],
		[
			availableCustomerDlcs,
			availableCustomerNames,
			availableCustomerPlaces,
			customerFilterDlcs,
			customerFilterExcludes,
			customerFilterIncludes,
			customerFilterNoPlaces,
			customerFilterPlaces,
		]
	);

	const customerTabVisibilityState =
		customerStore.persistence.customer.tabVisibility.use();

	const customerTabStyle = customerTabStyleMap[customerTabVisibilityState];

	const isCustomerTabFilterVisible =
		customerStore.shared.customer.filterVisibility.use();

	const currentCustomerPopularTrend =
		customerStore.shared.customer.popularTrend.use();
	const isFamousShop = customerStore.shared.customer.famousShop.use();

	const instance_ingredient = customerStore.instances.ingredient.get();

	const availableIngredientDlcs = customerStore.availableIngredientDlcs.use();
	const availableIngredientLevels =
		customerStore.availableIngredientLevels.use();
	const availableIngredientTags = customerStore.availableIngredientTags.use();

	const ingredientPinyinSortState =
		customerStore.persistence.ingredient.pinyinSortState.use();

	const ingredientFilterDlcs =
		customerStore.persistence.ingredient.filters.dlcs.use();
	const ingredientFilterTags =
		customerStore.persistence.ingredient.filters.tags.use();
	const ingredientFilterNoTags =
		customerStore.persistence.ingredient.filters.noTags.use();
	const ingredientFilterLevels =
		customerStore.persistence.ingredient.filters.levels.use();

	const filterIngredientData = useCallback(
		() =>
			instance_ingredient.data.filter(({ dlc, level, name, tags }) => {
				const tagsWithTrend =
					instance_ingredient.calculateTagsWithTrend(
						tags,
						currentCustomerPopularTrend,
						isFamousShop
					);

				const isDlcMatched =
					checkLengthEmpty(ingredientFilterDlcs) ||
					ingredientFilterDlcs.includes(dlc.toString());
				const isTagMatched =
					checkLengthEmpty(ingredientFilterTags) ||
					checkArraySubsetOf(ingredientFilterTags, tagsWithTrend);
				const isNoTagMatched =
					checkLengthEmpty(ingredientFilterNoTags) ||
					!checkArrayContainsOf(
						ingredientFilterNoTags,
						tagsWithTrend
					);
				const isLevelMatched =
					checkLengthEmpty(ingredientFilterLevels) ||
					ingredientFilterLevels.includes(level.toString());

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

	const ingredientFilteredData = useFilteredData(
		instance_ingredient,
		filterIngredientData
	);

	const ingredientSortedData = useSortedData(
		instance_ingredient,
		ingredientFilteredData,
		ingredientPinyinSortState
	);

	const ingredientPinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState: ingredientPinyinSortState,
			setPinyinSortState:
				customerStore.persistence.ingredient.pinyinSortState.set,
		}),
		[ingredientPinyinSortState]
	);

	const ingredientSelectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableIngredientDlcs,
				label: 'DLC',
				selectedKeys: ingredientFilterDlcs,
				setSelectedKeys:
					customerStore.persistence.ingredient.filters.dlcs.set,
			},
			{
				items: availableIngredientTags,
				label: '食材标签（包含）',
				selectedKeys: ingredientFilterTags,
				setSelectedKeys:
					customerStore.persistence.ingredient.filters.tags.set,
			},
			{
				items: availableIngredientTags,
				label: '食材标签（排除）',
				selectedKeys: ingredientFilterNoTags,
				setSelectedKeys:
					customerStore.persistence.ingredient.filters.noTags.set,
			},
			{
				items: availableIngredientLevels,
				label: '等级',
				selectedKeys: ingredientFilterLevels,
				setSelectedKeys:
					customerStore.persistence.ingredient.filters.levels.set,
			},
		],
		[
			availableIngredientDlcs,
			availableIngredientLevels,
			availableIngredientTags,
			ingredientFilterDlcs,
			ingredientFilterLevels,
			ingredientFilterNoTags,
			ingredientFilterTags,
		]
	);

	const ingredientTabVisibilityState =
		customerStore.persistence.ingredient.tabVisibility.use();

	const ingredientTabStyle =
		ingredientTabStyleMap[ingredientTabVisibilityState];

	const isIngredientTabFilterVisible =
		customerStore.shared.ingredient.filterVisibility.use();

	const selectedTabKey = customerStore.shared.tab.use();

	const onTabSelectionChange = useCallback(
		(key: Key) => {
			vibrate(key !== selectedTabKey);
			customerStore.onTabSelectionChange(key);
		},
		[selectedTabKey, vibrate]
	);

	const instance_clothes = customerStore.instances.clothes.get();

	const isMounted = useMounted();
	if (!isMounted) {
		return <Loading />;
	}

	return (
		<div
			className={cn(
				'flex min-h-main-content-pb-0 flex-col gap-4 overflow-auto scrollbar-hide xl:grid xl:grid-cols-2 xl:justify-items-center',
				{
					'md:flex-col-reverse md:justify-end':
						currentCustomerName !== null,
				}
			)}
		>
			<div className="px-2 xl:w-full xl:px-0 xl:pt-2">
				<Tabs
					fullWidth
					destroyInactiveTabPanel={false}
					disableAnimation={isReducedMotion}
					size="sm"
					selectedKey={selectedTabKey}
					onSelectionChange={onTabSelectionChange}
					classNames={{
						tab: cn(
							'data-[hover=true]:!opacity-100 data-[hover-unselected=true]:brightness-95 data-[pressed=true]:!brightness-90',
							isHighAppearance
								? 'data-[hover-unselected=true]:bg-default-200/40 data-[pressed=true]:!bg-default-200/40'
								: 'data-[hover-unselected=true]:bg-default-200 data-[pressed=true]:!bg-default-200',
							isReducedMotion
								? 'data-[selected=true]:bg-background data-[selected=true]:text-default-foreground dark:data-[selected=true]:bg-default dark:data-[selected=true]:text-foreground'
								: 'transition'
						),
						tabList: cn('grid grid-cols-4 bg-default/40', {
							'backdrop-blur': isHighAppearance,
						}),
					}}
				>
					<Tab
						key="customer"
						title="普客"
						className="relative flex flex-col"
					>
						<CustomerTabContent
							customerTabStyle={customerTabStyle}
							sortedData={customerSortedData}
						/>
					</Tab>
					<Tab
						isDisabled={currentCustomerName === null}
						key="recipe"
						title="料理"
					>
						<RecipeTabContent />
					</Tab>
					<Tab
						isDisabled={currentCustomerName === null}
						key="beverage"
						title="酒水"
					>
						<BeverageTabContent />
					</Tab>
					<Tab
						isDisabled={
							currentCustomerName === null ||
							currentRecipeData === null
						}
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

			<FadeMotionDiv
				target={currentCustomerName ? 'content' : 'placeholder'}
				variant={currentCustomerName ? 'content' : 'placeholder'}
				className={cn(
					'flex flex-col gap-4 p-2 pt-0 md:pb-0 md:pt-2 xl:w-full xl:pb-2',
					{ grow: currentCustomerName === null }
				)}
			>
				{currentCustomerName ? (
					<>
						<CustomerCard />
						<ResultCard />
						<SavedMealCard />
					</>
				) : (
					<Placeholder className="pb-5 md:pb-9 xl:pb-0">
						<span
							aria-hidden
							className="image-rendering-pixelated block h-loading w-loading bg-loading"
						/>
						<p>选择顾客以继续</p>
					</Placeholder>
				)}
			</FadeMotionDiv>

			<SideButtonGroup
				className={cn(
					'xl:left-6',
					customerTabStyle.classNames.sideButtonGroup,
					{ '!hidden': !isCustomerTabFilterVisible }
				)}
			>
				<SideSearchIconButton searchConfig={customerSearchConfig} />
				<SidePinyinSortIconButton
					pinyinSortConfig={customerPinyinSortConfig}
				/>
				<SideFilterIconButton selectConfig={customerSelectConfig} />
			</SideButtonGroup>

			<SideButtonGroup
				className={cn(
					'xl:left-6',
					ingredientTabStyle.classNames.sideButtonGroup,
					{
						'!block':
							selectedTabKey === 'ingredient' &&
							checkLengthEmpty(ingredientFilteredData),
						'!hidden': !isIngredientTabFilterVisible,
					}
				)}
			>
				<SidePinyinSortIconButton
					pinyinSortConfig={ingredientPinyinSortConfig}
				/>
				<SideFilterIconButton selectConfig={ingredientSelectConfig} />
			</SideButtonGroup>

			{isShowTachie &&
				breakpoint === 'tachie' &&
				currentCustomerName !== null && (
					<Tachie
						aria-hidden
						alt="雀酒屋工作装"
						src={instance_clothes.getTachiePath('雀酒屋工作装')}
						width={120}
						className="pointer-events-none fixed bottom-0 right-0 pr-1"
					/>
				)}
		</div>
	);
}
