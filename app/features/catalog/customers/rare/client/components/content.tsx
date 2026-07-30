'use client';

import { Tab, Tabs } from '@heroui/tabs';
import { cn } from '@heroui/theme';
import { useRouter } from 'next/navigation';
import { type Key, useCallback, useEffect, useMemo, useRef } from 'react';
import useBreakpoint from 'use-breakpoint';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import FadeMotionDiv from '@/design/ui/components/fadeMotionDiv';
import Loading from '@/design/ui/components/loading';
import Placeholder from '@/design/ui/components/placeholder';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import type { TCustomerRareName } from '@/domain/data/customers/rare/types';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';
import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';
import CustomerTabSlider from '@/features/catalog/customers/shared/client/components/customerTabSlider';
import { useCustomerRouteData } from '@/features/catalog/customers/shared/client/hooks/useCustomerRouteData';
import { useIngredientRouteData } from '@/features/catalog/customers/shared/client/hooks/useIngredientRouteData';
import type { TTab } from '@/features/catalog/customers/shared/contracts';
import {
	customerTabStyleMap,
	ingredientTabStyleMap,
	tachieBreakPointMap,
} from '@/features/catalog/customers/shared/presentation/tabLayout';
import { getCustomerRareTachiePath } from '@/features/catalog/presentation/tachiePaths';
import SideButtonGroup from '@/features/catalog/shared/client/components/SideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/features/catalog/shared/client/components/SideFilterIconButton';
import SidePinyinSortIconButton from '@/features/catalog/shared/client/components/SidePinyinSortIconButton';
import Tachie from '@/features/catalog/shared/client/components/Tachie';
import { type IPinyinSortConfig } from '@/features/catalog/shared/state/pinyinSort';
import CustomerRarePlanDrawer from '@/features/customerPlans/client/customerRarePlanDrawer/CustomerRarePlanDrawer';
import { customerPlansStore } from '@/features/customerPlans/client/state/store';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkCompatibility } from '@/infrastructure/browser/compatibility/checkCompatibility';

import { useDocumentTitle } from '@/shared/react/useDocumentTitle';
import { useHydrated } from '@/shared/react/useHydrated';
import { SITE_METADATA } from '@/shared/site/metadata';
import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import BeverageTabContent from './beverageTabContent';
import CustomerCard from './customerCard';
import CustomerTabContent from './customerTabContent';
import IngredientTabContent from './ingredientTabContent';
import RecipeTabContent from './recipeTabContent';
import ResultCard from './resultCard';
import SavedMealCard from './savedMealCard';
import SuggestedMealCard from './suggestedMealCard';

const { enName, name: zhName } = SITE_METADATA;

function validateName(name: string | undefined) {
	const instance_customer = customerRareStore.instances.customer.get();

	try {
		const decodedName = decodeURIComponent(name ?? '');
		instance_customer.findIndexByName(decodedName as never);
		return decodedName as TCustomerRareName;
	} catch {
		return null;
	}
}

export default function Content() {
	const { pathname } = usePathname();
	const router = useRouter();

	const [, , routeCustomerName] = pathname.split('/');
	const validName = validateName(routeCustomerName);
	const hasCustomerPath =
		routeCustomerName !== undefined && routeCustomerName !== '';
	const isPlanDrawerOpen = customerPlansStore.shared.drawer.isOpen.use();
	const title = `${isPlanDrawerOpen ? '营业预设 | ' : ''}${validName === null ? '' : `${validName} | `}${getPageTitle('/customer-rare')} | ${zhName} - ${enName}`;

	useDocumentTitle(title, '/customer-rare');

	useEffect(() => {
		customerRareStore.shared.customer.name.set(validName);
	}, [validName]);

	const { breakpoint } = useBreakpoint(tachieBreakPointMap, 'noTachie');
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const { isHighAppearance } = useDesignPreferences();
	const isShowTachie = globalStore.persistence.tachie.use();

	const currentCustomerName = customerRareStore.shared.customer.name.use();
	const currentRecipeData = customerRareStore.shared.recipe.data.use();

	const isFirstRendering = useRef(true);
	useEffect(() => {
		if (hasCustomerPath && validName === null) {
			router.replace('/customer-rare');
			return;
		}
		if (isFirstRendering.current) {
			isFirstRendering.current = false;
			return;
		}
		if (currentCustomerName === null) {
			router.replace('/customer-rare');
		}
	}, [currentCustomerName, hasCustomerPath, router, validName]);

	const instance_customer = customerRareStore.instances.customer.get();

	const { customerSortedData } = useCustomerRouteData(
		instance_customer,
		customerRareStore
	);

	const availableCustomerAvailabilityDlcs =
		customerRareStore.availableCustomerAvailabilityDlcs.use();
	const availableCustomerNames =
		customerRareStore.availableCustomerNames.use();
	const availableCustomerPlaces =
		customerRareStore.availableCustomerPlaces.use();

	const customerPinyinSortState =
		customerRareStore.persistence.customer.pinyinSortState.use();

	const customerFilterAvailabilityDlcs =
		customerRareStore.persistence.customer.filters.availabilityDlcs.use();
	const customerFilterPlaces =
		customerRareStore.persistence.customer.filters.places.use();
	const customerFilterNoPlaces =
		customerRareStore.persistence.customer.filters.noPlaces.use();
	const customerFilterIncludes =
		customerRareStore.persistence.customer.filters.includes.use();
	const customerFilterExcludes =
		customerRareStore.persistence.customer.filters.excludes.use();

	const customerPinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState: customerPinyinSortState,
			setPinyinSortState:
				customerRareStore.persistence.customer.pinyinSortState.set,
		}),
		[customerPinyinSortState]
	);

	const customerSelectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableCustomerAvailabilityDlcs,
				label: '可出现于',
				selectedKeys: customerFilterAvailabilityDlcs,
				setSelectedKeys:
					customerRareStore.persistence.customer.filters
						.availabilityDlcs.set,
				valueType: 'dlc',
			},
			{
				items: availableCustomerPlaces,
				label: '出没地区（包含）',
				selectedKeys: customerFilterPlaces,
				setSelectedKeys:
					customerRareStore.persistence.customer.filters.places.set,
			},
			{
				items: availableCustomerPlaces,
				label: '出没地区（排除）',
				selectedKeys: customerFilterNoPlaces,
				setSelectedKeys:
					customerRareStore.persistence.customer.filters.noPlaces.set,
			},
			{
				items: availableCustomerNames,
				label: '额外包含',
				selectedKeys: customerFilterIncludes,
				setSelectedKeys:
					customerRareStore.persistence.customer.filters.includes.set,
				spriteTarget: 'customer_rare',
			},
			{
				items: availableCustomerNames,
				label: '额外排除',
				selectedKeys: customerFilterExcludes,
				setSelectedKeys:
					customerRareStore.persistence.customer.filters.excludes.set,
				spriteTarget: 'customer_rare',
			},
		],
		[
			availableCustomerAvailabilityDlcs,
			availableCustomerNames,
			availableCustomerPlaces,
			customerFilterAvailabilityDlcs,
			customerFilterExcludes,
			customerFilterIncludes,
			customerFilterNoPlaces,
			customerFilterPlaces,
		]
	);

	const customerTabVisibilityState =
		customerRareStore.persistence.customer.tabVisibility.use();

	const customerTabStyle = customerTabStyleMap[customerTabVisibilityState];

	const isCustomerTabFilterVisible =
		customerRareStore.shared.customer.filterVisibility.use();

	const { ingredientFilteredData, ingredientSortedData } =
		useIngredientRouteData(customerRareStore);

	const availableIngredientAvailabilityDlcs =
		customerRareStore.availableIngredientAvailabilityDlcs.use();
	const availableIngredientLevels =
		customerRareStore.availableIngredientLevels.use();
	const availableIngredientTags =
		customerRareStore.availableIngredientTags.use();

	const ingredientPinyinSortState =
		customerRareStore.persistence.ingredient.pinyinSortState.use();

	const ingredientFilterAvailabilityDlcs =
		customerRareStore.persistence.ingredient.filters.availabilityDlcs.use();
	const ingredientFilterTags =
		customerRareStore.persistence.ingredient.filters.tags.use();
	const ingredientFilterNoTags =
		customerRareStore.persistence.ingredient.filters.noTags.use();
	const ingredientFilterLevels =
		customerRareStore.persistence.ingredient.filters.levels.use();

	const ingredientPinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState: ingredientPinyinSortState,
			setPinyinSortState:
				customerRareStore.persistence.ingredient.pinyinSortState.set,
		}),
		[ingredientPinyinSortState]
	);

	const ingredientSelectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableIngredientAvailabilityDlcs,
				label: '可获取于',
				selectedKeys: ingredientFilterAvailabilityDlcs,
				setSelectedKeys:
					customerRareStore.persistence.ingredient.filters
						.availabilityDlcs.set,
				valueType: 'dlc',
			},
			{
				items: availableIngredientTags,
				label: '食材标签（包含）',
				selectedKeys: ingredientFilterTags,
				setSelectedKeys:
					customerRareStore.persistence.ingredient.filters.tags.set,
			},
			{
				items: availableIngredientTags,
				label: '食材标签（排除）',
				selectedKeys: ingredientFilterNoTags,
				setSelectedKeys:
					customerRareStore.persistence.ingredient.filters.noTags.set,
			},
			{
				items: availableIngredientLevels,
				label: '等级',
				selectedKeys: ingredientFilterLevels,
				setSelectedKeys:
					customerRareStore.persistence.ingredient.filters.levels.set,
			},
		],
		[
			availableIngredientAvailabilityDlcs,
			availableIngredientLevels,
			availableIngredientTags,
			ingredientFilterAvailabilityDlcs,
			ingredientFilterLevels,
			ingredientFilterNoTags,
			ingredientFilterTags,
		]
	);

	const ingredientTabVisibilityState =
		customerRareStore.persistence.ingredient.tabVisibility.use();

	const ingredientTabStyle =
		ingredientTabStyleMap[ingredientTabVisibilityState];

	const isIngredientTabFilterVisible =
		customerRareStore.shared.ingredient.filterVisibility.use();

	const selectedTabKey = customerRareStore.shared.tab.use();

	const onTabSelectionChange = useCallback(
		(key: Key) => {
			const nextTabKey = key as TTab;
			vibrate(key !== selectedTabKey);
			customerRareStore.onTabSelectionChange(nextTabKey);
		},
		[selectedTabKey, vibrate]
	);

	const isMounted = useHydrated();
	if (!isMounted) {
		return <Loading />;
	}

	const disableTabAnimation =
		isReducedMotion || !checkCompatibility().largeSlidingPanelAnimation;

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
			<CustomerRarePlanDrawer />
			<div className="px-2 xl:w-full xl:px-0 xl:pt-2">
				<Tabs
					fullWidth
					destroyInactiveTabPanel
					disableAnimation={disableTabAnimation}
					size="sm"
					selectedKey={selectedTabKey}
					onSelectionChange={onTabSelectionChange}
					classNames={{
						tab: cn(
							'data-[hover=true]:!opacity-100 data-[hover-unselected=true]:brightness-95 data-[pressed=true]:!brightness-90',
							isHighAppearance
								? 'data-[hover-unselected=true]:bg-default-200/40 data-[pressed=true]:!bg-default-200/40'
								: 'data-[hover-unselected=true]:bg-default-200 data-[pressed=true]:!bg-default-200',
							disableTabAnimation
								? 'data-[selected=true]:bg-background data-[selected=true]:text-default-foreground dark:data-[selected=true]:bg-default dark:data-[selected=true]:text-foreground'
								: 'transition'
						),
						tabList: cn('grid grid-cols-4 bg-default/40', {
							'backdrop-blur': isHighAppearance,
						}),
					}}
				>
					<Tab key="customer" title="稀客" />
					<Tab
						isDisabled={currentCustomerName === null}
						key="recipe"
						title="料理"
					/>
					<Tab
						isDisabled={currentCustomerName === null}
						key="beverage"
						title="酒水"
					/>
					<Tab
						isDisabled={
							currentCustomerName === null ||
							currentRecipeData === null
						}
						key="ingredient"
						title="食材"
					/>
				</Tabs>
				<CustomerTabSlider
					heightKey={`${customerTabVisibilityState}:${ingredientTabVisibilityState}`}
					selectedTabKey={selectedTabKey}
				>
					<div className="relative flex flex-col px-1 py-3">
						<CustomerTabContent
							customerTabStyle={customerTabStyle}
							isVisible={selectedTabKey === 'customer'}
							sortedData={customerSortedData}
						/>
					</div>
					<div className="px-1 py-3">
						<RecipeTabContent />
					</div>
					<div className="px-1 py-3">
						<BeverageTabContent />
					</div>
					<div className="px-0 py-3">
						<IngredientTabContent
							ingredientTabStyle={ingredientTabStyle}
							sortedData={ingredientSortedData}
						/>
					</div>
				</CustomerTabSlider>
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
						<SuggestedMealCard />
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
						alt={currentCustomerName}
						src={getCustomerRareTachiePath(currentCustomerName)}
						width={
							currentCustomerName === '蹦蹦跳跳的三妖精' ||
							currentCustomerName === '萌澄果'
								? 60
								: 120
						}
						className="pointer-events-none fixed bottom-0 right-0 pr-1"
					/>
				)}
		</div>
	);
}
