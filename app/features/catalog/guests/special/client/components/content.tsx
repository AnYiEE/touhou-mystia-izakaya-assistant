'use client';

import { Tab, Tabs } from '@heroui/tabs';
import { cn } from '@heroui/theme';
import { useRouter } from 'next/navigation';
import { type Key, memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import FadeMotionDiv from '@/design/ui/components/fadeMotionDiv';
import Loading from '@/design/ui/components/loading';
import Placeholder from '@/design/ui/components/placeholder';
import { useBreakpoint } from '@/design/ui/hooks/useBreakpoint';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { compareMapCanonicalOrder } from '@/domain/places/mapOrdering';

import { appShellMessages } from '@/features/appShell/client/messages';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import GuestTabSlider from '@/features/catalog/guests/shared/client/components/guestTabSlider';
import { useGuestRouteData } from '@/features/catalog/guests/shared/client/hooks/useGuestRouteData';
import { useIngredientRouteData } from '@/features/catalog/guests/shared/client/hooks/useIngredientRouteData';
import type { TTab } from '@/features/catalog/guests/shared/contracts';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';
import {
	guestTabStyleMap,
	ingredientTabStyleMap,
	tachieBreakPointMap,
} from '@/features/catalog/guests/shared/presentation/tabLayout';
import { resolveGuestRouteSegment } from '@/features/catalog/guests/shared/queries/resolveGuestRouteSegment';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { getSpecialGuestTachiePath } from '@/features/catalog/presentation/tachiePaths';
import SideButtonGroup from '@/features/catalog/shared/client/components/SideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/features/catalog/shared/client/components/SideFilterIconButton';
import SidePinyinSortIconButton from '@/features/catalog/shared/client/components/SidePinyinSortIconButton';
import Tachie from '@/features/catalog/shared/client/components/Tachie';
import { type IPinyinSortConfig } from '@/features/catalog/shared/state/pinyinSort';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import SpecialGuestPlanDrawer from '@/features/specialGuestPlans/client/specialGuestPlanDrawer/SpecialGuestPlanDrawer';
import { specialGuestPlansStore } from '@/features/specialGuestPlans/client/state/store';

import { checkCompatibility } from '@/infrastructure/browser/compatibility/checkCompatibility';

import { useI18n } from '@/shared/i18n/useI18n';
import { useDocumentTitle } from '@/shared/react/useDocumentTitle';
import { useHydrated } from '@/shared/react/useHydrated';
import { siteMessages } from '@/shared/site/messages';
import { SITE_METADATA } from '@/shared/site/metadata';
import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import BeverageTabContent from './beverageTabContent';
import FoodTabContent from './foodTabContent';
import GuestCard from './guestCard';
import GuestTabContent from './guestTabContent';
import IngredientTabContent from './ingredientTabContent';
import ResultCard from './resultCard';
import SavedMealCard from './savedMealCard';
import SuggestedMealCard from './suggestedMealCard';

const { enName } = SITE_METADATA;
const GUEST_TAB_BY_KEY: ReadonlyMap<Key, TTab> = new Map([
	['beverage', 'beverage'],
	['food', 'food'],
	['guest', 'guest'],
	['ingredient', 'ingredient'],
]);

interface ISpecialGuestTabsProps {
	isGuestSelected: boolean;
	isHighAppearance: boolean;
	isMealSelected: boolean;
	isReducedMotion: boolean;
	onSelectionChange: (key: Key) => void;
	selectedKey: TTab;
}

const SpecialGuestTabs = memo<ISpecialGuestTabsProps>(
	function SpecialGuestTabs({
		isGuestSelected,
		isHighAppearance,
		isMealSelected,
		isReducedMotion,
		onSelectionChange,
		selectedKey,
	}) {
		const { t: tAppShell } = useI18n(appShellMessages);
		const disableAnimation =
			isReducedMotion || !checkCompatibility().largeSlidingPanelAnimation;
		const classNames = useMemo(
			() => ({
				tab: cn(
					'data-[hover=true]:!opacity-100 data-[hover-unselected=true]:brightness-95 data-[pressed=true]:!brightness-90',
					isHighAppearance
						? 'data-[hover-unselected=true]:bg-default-200/40 data-[pressed=true]:!bg-default-200/40'
						: 'data-[hover-unselected=true]:bg-default-200 data-[pressed=true]:!bg-default-200',
					disableAnimation
						? 'data-[selected=true]:bg-background data-[selected=true]:text-default-foreground dark:data-[selected=true]:bg-default dark:data-[selected=true]:text-foreground'
						: 'transition'
				),
				tabList: cn('grid grid-cols-4 bg-default/40', {
					'backdrop-blur': isHighAppearance,
				}),
			}),
			[disableAnimation, isHighAppearance]
		);

		return (
			<Tabs
				fullWidth
				destroyInactiveTabPanel
				disableAnimation={disableAnimation}
				size="sm"
				selectedKey={selectedKey}
				onSelectionChange={onSelectionChange}
				classNames={classNames}
			>
				<Tab
					key="guest"
					title={tAppShell('appShell.nav.specialGuests')}
				/>
				<Tab
					isDisabled={!isGuestSelected}
					key="food"
					title={tAppShell('appShell.nav.foods')}
				/>
				<Tab
					isDisabled={!isGuestSelected}
					key="beverage"
					title={tAppShell('appShell.nav.beverages')}
				/>
				<Tab
					isDisabled={!isMealSelected}
					key="ingredient"
					title={tAppShell('appShell.nav.ingredients')}
				/>
			</Tabs>
		);
	}
);

export default function Content() {
	const { pathname } = usePathname();
	const router = useRouter();
	const { t } = useI18n(catalogGuestsMessages);
	const { t: tAppShell } = useI18n(appShellMessages);
	const { t: tSite } = useI18n(siteMessages);

	const [, , routeGuestSegment] = pathname.split('/');
	const routeGuest = resolveGuestRouteSegment({
		catalog: specialGuestStore.instances.guest.get(),
		value: routeGuestSegment,
	});
	const resolvedRouteGuest = routeGuest?.id ?? null;
	const routeGuestName = routeGuest?.name ?? null;
	const hasGuestPath =
		routeGuestSegment !== undefined && routeGuestSegment !== '';
	const isPlanDrawerOpen = specialGuestPlansStore.shared.drawer.isOpen.use();
	const siteName = tSite('site.name');
	const siteTitle =
		siteName === enName ? siteName : `${siteName} - ${enName}`;
	const title = `${
		isPlanDrawerOpen ? t('guests.documentTitle.planPrefix') : ''
	}${
		routeGuestName === null ? '' : `${routeGuestName} | `
	}${tAppShell('appShell.nav.specialGuests')} | ${siteTitle}`;

	useDocumentTitle(title, '/special-guests');

	useEffect(() => {
		specialGuestStore.shared.guest.id.set(resolvedRouteGuest);
	}, [resolvedRouteGuest]);

	const { breakpoint } = useBreakpoint(tachieBreakPointMap, 'noTachie');
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const isShowTachie = globalStore.persistence.tachie.use();

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();
	const currentGuestName = specialGuestStore.currentGuestName.use();
	const currentMealFood = specialGuestStore.shared.recipe.data.use();

	const isFirstRendering = useRef(true);
	useEffect(() => {
		if (hasGuestPath && resolvedRouteGuest === null) {
			router.replace('/special-guests');
			return;
		}
		if (isFirstRendering.current) {
			isFirstRendering.current = false;
			return;
		}
		if (currentSpecialGuest === null) {
			router.replace('/special-guests');
		}
	}, [currentSpecialGuest, hasGuestPath, resolvedRouteGuest, router]);

	const specialGuestCatalog = specialGuestStore.instances.guest.get();

	const { guestSortedData } = useGuestRouteData(
		specialGuestCatalog,
		specialGuestStore
	);

	const availableGuestAvailabilityDlcs =
		specialGuestStore.availableGuestAvailabilityDlcs.use();
	const availableGuestMaps = specialGuestStore.availableGuestMaps.use();
	const availableSpecialGuests =
		specialGuestStore.availableSpecialGuests.use();

	const canonicalAvailableGuestMaps = useMemo(
		() =>
			[...availableGuestMaps].sort((left, right) =>
				compareMapCanonicalOrder(left.value, right.value)
			),
		[availableGuestMaps]
	);

	const guestPinyinSortState =
		specialGuestStore.persistence.guest.pinyinSortState.use();

	const guestFilterAvailabilityDlcs =
		specialGuestStore.persistence.guest.filters.availabilityDlcs.use();
	const guestFilterMaps =
		specialGuestStore.persistence.guest.filters.places.use();
	const guestFilterNoMaps =
		specialGuestStore.persistence.guest.filters.noPlaces.use();
	const guestFilterIncludes =
		specialGuestStore.persistence.guest.filters.includes.use();
	const guestFilterExcludes =
		specialGuestStore.persistence.guest.filters.excludes.use();

	const guestPinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState: guestPinyinSortState,
			setPinyinSortState:
				specialGuestStore.persistence.guest.pinyinSortState.set,
		}),
		[guestPinyinSortState]
	);

	const guestSelectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableGuestAvailabilityDlcs,
				label: t('guests.filter.guestAvailability'),
				selectedKeys: guestFilterAvailabilityDlcs,
				setSelectedKeys:
					specialGuestStore.persistence.guest.filters.availabilityDlcs
						.set,
				valueType: 'dlc',
			},
			{
				items: canonicalAvailableGuestMaps,
				label: t('guests.filter.guestPlacesInclude'),
				selectedKeys: guestFilterMaps,
				setSelectedKeys:
					specialGuestStore.persistence.guest.filters.places.set,
				valueType: 'map',
			},
			{
				items: canonicalAvailableGuestMaps,
				label: t('guests.filter.guestPlacesExclude'),
				selectedKeys: guestFilterNoMaps,
				setSelectedKeys:
					specialGuestStore.persistence.guest.filters.noPlaces.set,
				valueType: 'map',
			},
			{
				items: availableSpecialGuests.map(({ id, name }) => ({
					name,
					recordId: id,
					value: id,
				})),
				label: t('guests.filter.guestIncludes'),
				selectedKeys: guestFilterIncludes,
				setSelectedKeys:
					specialGuestStore.persistence.guest.filters.includes.set,
				spriteTarget: 'special_guest',
			},
			{
				items: availableSpecialGuests.map(({ id, name }) => ({
					name,
					recordId: id,
					value: id,
				})),
				label: t('guests.filter.guestExcludes'),
				selectedKeys: guestFilterExcludes,
				setSelectedKeys:
					specialGuestStore.persistence.guest.filters.excludes.set,
				spriteTarget: 'special_guest',
			},
		],
		[
			availableGuestAvailabilityDlcs,
			availableSpecialGuests,
			canonicalAvailableGuestMaps,
			guestFilterAvailabilityDlcs,
			guestFilterExcludes,
			guestFilterIncludes,
			guestFilterMaps,
			guestFilterNoMaps,
			t,
		]
	);

	const guestTabVisibilityState =
		specialGuestStore.persistence.guest.tabVisibility.use();

	const guestTabStyle = guestTabStyleMap[guestTabVisibilityState];

	const isGuestTabFilterVisible =
		specialGuestStore.shared.guest.filterVisibility.use();

	const { ingredientFilteredData, ingredientSortedData } =
		useIngredientRouteData(specialGuestStore);

	const availableIngredientAvailabilityDlcs =
		specialGuestStore.availableIngredientAvailabilityDlcs.use();
	const availableIngredientLevels =
		specialGuestStore.availableIngredientLevels.use();
	const availableIngredientTags =
		specialGuestStore.availableIngredientTags.use();

	const ingredientPinyinSortState =
		specialGuestStore.persistence.ingredient.pinyinSortState.use();

	const ingredientFilterAvailabilityDlcs =
		specialGuestStore.persistence.ingredient.filters.availabilityDlcs.use();
	const ingredientFilterTags =
		specialGuestStore.persistence.ingredient.filters.tags.use();
	const ingredientFilterNoTags =
		specialGuestStore.persistence.ingredient.filters.noTags.use();
	const ingredientFilterLevels =
		specialGuestStore.persistence.ingredient.filters.levels.use();

	const ingredientPinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState: ingredientPinyinSortState,
			setPinyinSortState:
				specialGuestStore.persistence.ingredient.pinyinSortState.set,
		}),
		[ingredientPinyinSortState]
	);

	const ingredientSelectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableIngredientAvailabilityDlcs,
				label: t('guests.filter.acquirableAt'),
				selectedKeys: ingredientFilterAvailabilityDlcs,
				setSelectedKeys:
					specialGuestStore.persistence.ingredient.filters
						.availabilityDlcs.set,
				valueType: 'dlc',
			},
			{
				items: availableIngredientTags,
				label: t('guests.filter.ingredientTagsInclude'),
				selectedKeys: ingredientFilterTags,
				setSelectedKeys:
					specialGuestStore.persistence.ingredient.filters.tags.set,
				valueType: 'foodTag',
			},
			{
				items: availableIngredientTags,
				label: t('guests.filter.ingredientTagsExclude'),
				selectedKeys: ingredientFilterNoTags,
				setSelectedKeys:
					specialGuestStore.persistence.ingredient.filters.noTags.set,
				valueType: 'foodTag',
			},
			{
				items: availableIngredientLevels,
				label: t('guests.filter.level'),
				selectedKeys: ingredientFilterLevels,
				setSelectedKeys:
					specialGuestStore.persistence.ingredient.filters.levels.set,
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
			t,
		]
	);

	const ingredientTabVisibilityState =
		specialGuestStore.persistence.ingredient.tabVisibility.use();

	const ingredientTabStyle =
		ingredientTabStyleMap[ingredientTabVisibilityState];

	const isIngredientTabFilterVisible =
		specialGuestStore.shared.ingredient.filterVisibility.use();

	const selectedTabKey = specialGuestStore.shared.tab.use();

	const onTabSelectionChange = useCallback(
		(key: Key) => {
			const nextTabKey = GUEST_TAB_BY_KEY.get(key);
			if (nextTabKey === undefined) {
				return;
			}
			vibrate(nextTabKey !== selectedTabKey);
			specialGuestStore.onTabSelectionChange(nextTabKey);
		},
		[selectedTabKey, vibrate]
	);

	const isMounted = useHydrated();
	if (!isMounted) {
		return <Loading />;
	}

	return (
		<div
			className={cn(
				'flex min-h-main-content-pb-0 flex-col gap-4 overflow-auto scrollbar-hide xl:grid xl:grid-cols-2 xl:justify-items-center',
				{
					'md:flex-col-reverse md:justify-end':
						currentSpecialGuest !== null,
				}
			)}
		>
			<SpecialGuestPlanDrawer />
			<div className="px-2 xl:w-full xl:px-0 xl:pt-2">
				<SpecialGuestTabs
					isGuestSelected={currentSpecialGuest !== null}
					isHighAppearance={isHighAppearance}
					isMealSelected={
						currentSpecialGuest !== null && currentMealFood !== null
					}
					isReducedMotion={isReducedMotion}
					onSelectionChange={onTabSelectionChange}
					selectedKey={selectedTabKey}
				/>
				<GuestTabSlider
					heightKey={`${guestTabVisibilityState}:${ingredientTabVisibilityState}`}
					selectedTabKey={selectedTabKey}
				>
					<div className="relative flex flex-col px-1 py-3">
						<GuestTabContent
							guestTabStyle={guestTabStyle}
							isVisible={selectedTabKey === 'guest'}
							sortedData={guestSortedData}
						/>
					</div>
					<div className="px-1 py-3">
						<FoodTabContent />
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
				</GuestTabSlider>
			</div>

			<FadeMotionDiv
				target={
					currentSpecialGuest === null ? 'placeholder' : 'content'
				}
				variant={
					currentSpecialGuest === null ? 'placeholder' : 'content'
				}
				className={cn(
					'flex flex-col gap-4 p-2 pt-0 md:pb-0 md:pt-2 xl:w-full xl:pb-2',
					{ grow: currentSpecialGuest === null }
				)}
			>
				{currentSpecialGuest === null ? (
					<Placeholder className="pb-5 md:pb-9 xl:pb-0">
						<span
							aria-hidden
							className="image-rendering-pixelated block h-loading w-loading bg-loading"
						/>
						<p>{t('guests.guestPage.selectGuestPrompt')}</p>
					</Placeholder>
				) : (
					<>
						<GuestCard />
						<ResultCard />
						<SuggestedMealCard />
						<SavedMealCard />
					</>
				)}
			</FadeMotionDiv>

			<SideButtonGroup
				className={cn(
					'xl:left-6',
					guestTabStyle.classNames.sideButtonGroup,
					{ '!hidden': !isGuestTabFilterVisible }
				)}
			>
				<SidePinyinSortIconButton
					pinyinSortConfig={guestPinyinSortConfig}
				/>
				<SideFilterIconButton selectConfig={guestSelectConfig} />
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
				currentSpecialGuest !== null &&
				currentGuestName !== null && (
					<Tachie
						aria-hidden
						alt={currentGuestName}
						src={getSpecialGuestTachiePath(currentSpecialGuest)}
						width={
							currentSpecialGuest === 31 ||
							currentSpecialGuest === 30
								? 60
								: 120
						}
						className="pointer-events-none fixed bottom-0 right-0 pr-1"
					/>
				)}
		</div>
	);
}
