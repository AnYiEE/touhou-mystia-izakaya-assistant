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
import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
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
import { getClothesTachiePath } from '@/features/catalog/presentation/tachiePaths';
import SideButtonGroup from '@/features/catalog/shared/client/components/SideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/features/catalog/shared/client/components/SideFilterIconButton';
import SidePinyinSortIconButton from '@/features/catalog/shared/client/components/SidePinyinSortIconButton';
import Tachie from '@/features/catalog/shared/client/components/Tachie';
import { type IPinyinSortConfig } from '@/features/catalog/shared/state/pinyinSort';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

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

const { enName } = SITE_METADATA;
const GUEST_TAB_BY_KEY: ReadonlyMap<Key, TTab> = new Map([
	['beverage', 'beverage'],
	['food', 'food'],
	['guest', 'guest'],
	['ingredient', 'ingredient'],
]);

interface INormalGuestTabsProps {
	isGuestSelected: boolean;
	isHighAppearance: boolean;
	isMealSelected: boolean;
	isReducedMotion: boolean;
	onSelectionChange: (key: Key) => void;
	selectedKey: TTab;
}

const NormalGuestTabs = memo<INormalGuestTabsProps>(function NormalGuestTabs({
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
			<Tab key="guest" title={tAppShell('appShell.nav.normalGuests')} />
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
});

export default function Content() {
	const { pathname } = usePathname();
	const router = useRouter();
	const { t } = useI18n(catalogGuestsMessages);
	const { t: tAppShell } = useI18n(appShellMessages);
	const { t: tSite } = useI18n(siteMessages);

	const [, , routeGuestSegment] = pathname.split('/');
	const routeGuest = resolveGuestRouteSegment({
		catalog: normalGuestStore.instances.guest.get(),
		value: routeGuestSegment,
	});
	const resolvedRouteGuest = routeGuest?.id ?? null;
	const routeGuestName = routeGuest?.name ?? null;
	const hasGuestPath =
		routeGuestSegment !== undefined && routeGuestSegment !== '';
	const siteName = tSite('site.name');
	const siteTitle =
		siteName === enName ? siteName : `${siteName} - ${enName}`;
	const title = `${
		routeGuestName === null ? '' : `${routeGuestName} | `
	}${tAppShell('appShell.nav.normalGuests')} | ${siteTitle}`;

	useDocumentTitle(title, '/normal-guests');

	useEffect(() => {
		normalGuestStore.shared.guest.id.set(resolvedRouteGuest);
	}, [resolvedRouteGuest]);

	const { breakpoint } = useBreakpoint(tachieBreakPointMap, 'noTachie');
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const isShowTachie = globalStore.persistence.tachie.use();

	const currentNormalGuest = normalGuestStore.shared.guest.id.use();
	const currentMealFood = normalGuestStore.shared.recipe.data.use();

	const isFirstRendering = useRef(true);
	useEffect(() => {
		if (hasGuestPath && resolvedRouteGuest === null) {
			router.replace('/normal-guests');
			return;
		}
		if (isFirstRendering.current) {
			isFirstRendering.current = false;
			return;
		}
		if (currentNormalGuest === null) {
			router.replace('/normal-guests');
		}
	}, [currentNormalGuest, hasGuestPath, resolvedRouteGuest, router]);

	const normalGuestCatalog = normalGuestStore.instances.guest.get();

	const { guestSortedData } = useGuestRouteData(
		normalGuestCatalog,
		normalGuestStore
	);

	const availableGuestAvailabilityDlcs =
		normalGuestStore.availableGuestAvailabilityDlcs.use();
	const availableGuestMaps = normalGuestStore.availableGuestMaps.use();
	const availableNormalGuests = normalGuestStore.availableNormalGuests.use();

	const canonicalAvailableGuestMaps = useMemo(
		() =>
			[...availableGuestMaps].sort((left, right) =>
				compareMapCanonicalOrder(left.value, right.value)
			),
		[availableGuestMaps]
	);

	const guestPinyinSortState =
		normalGuestStore.persistence.guest.pinyinSortState.use();

	const guestFilterAvailabilityDlcs =
		normalGuestStore.persistence.guest.filters.availabilityDlcs.use();
	const guestFilterMaps =
		normalGuestStore.persistence.guest.filters.places.use();
	const guestFilterNoMaps =
		normalGuestStore.persistence.guest.filters.noPlaces.use();
	const guestFilterIncludes =
		normalGuestStore.persistence.guest.filters.includes.use();
	const guestFilterExcludes =
		normalGuestStore.persistence.guest.filters.excludes.use();

	const guestPinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState: guestPinyinSortState,
			setPinyinSortState:
				normalGuestStore.persistence.guest.pinyinSortState.set,
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
					normalGuestStore.persistence.guest.filters.availabilityDlcs
						.set,
				valueType: 'dlc',
			},
			{
				items: canonicalAvailableGuestMaps,
				label: t('guests.filter.guestPlacesInclude'),
				selectedKeys: guestFilterMaps,
				setSelectedKeys:
					normalGuestStore.persistence.guest.filters.places.set,
				valueType: 'map',
			},
			{
				items: canonicalAvailableGuestMaps,
				label: t('guests.filter.guestPlacesExclude'),
				selectedKeys: guestFilterNoMaps,
				setSelectedKeys:
					normalGuestStore.persistence.guest.filters.noPlaces.set,
				valueType: 'map',
			},
			{
				items: availableNormalGuests.map(({ id, name }) => ({
					name,
					recordId: id,
					value: id,
				})),
				label: t('guests.filter.guestIncludes'),
				selectedKeys: guestFilterIncludes,
				setSelectedKeys:
					normalGuestStore.persistence.guest.filters.includes.set,
				spriteTarget: 'normal_guest',
			},
			{
				items: availableNormalGuests.map(({ id, name }) => ({
					name,
					recordId: id,
					value: id,
				})),
				label: t('guests.filter.guestExcludes'),
				selectedKeys: guestFilterExcludes,
				setSelectedKeys:
					normalGuestStore.persistence.guest.filters.excludes.set,
				spriteTarget: 'normal_guest',
			},
		],
		[
			availableGuestAvailabilityDlcs,
			availableNormalGuests,
			canonicalAvailableGuestMaps,
			guestFilterAvailabilityDlcs,
			guestFilterExcludes,
			guestFilterIncludes,
			guestFilterNoMaps,
			guestFilterMaps,
			t,
		]
	);

	const guestTabVisibilityState =
		normalGuestStore.persistence.guest.tabVisibility.use();

	const guestTabStyle = guestTabStyleMap[guestTabVisibilityState];

	const isGuestTabFilterVisible =
		normalGuestStore.shared.guest.filterVisibility.use();

	const { ingredientFilteredData, ingredientSortedData } =
		useIngredientRouteData(normalGuestStore);

	const availableIngredientAvailabilityDlcs =
		normalGuestStore.availableIngredientAvailabilityDlcs.use();
	const availableIngredientLevels =
		normalGuestStore.availableIngredientLevels.use();
	const availableIngredientTags =
		normalGuestStore.availableIngredientTags.use();

	const ingredientPinyinSortState =
		normalGuestStore.persistence.ingredient.pinyinSortState.use();

	const ingredientFilterAvailabilityDlcs =
		normalGuestStore.persistence.ingredient.filters.availabilityDlcs.use();
	const ingredientFilterTags =
		normalGuestStore.persistence.ingredient.filters.tags.use();
	const ingredientFilterNoTags =
		normalGuestStore.persistence.ingredient.filters.noTags.use();
	const ingredientFilterLevels =
		normalGuestStore.persistence.ingredient.filters.levels.use();

	const ingredientPinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState: ingredientPinyinSortState,
			setPinyinSortState:
				normalGuestStore.persistence.ingredient.pinyinSortState.set,
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
					normalGuestStore.persistence.ingredient.filters
						.availabilityDlcs.set,
				valueType: 'dlc',
			},
			{
				items: availableIngredientTags,
				label: t('guests.filter.ingredientTagsInclude'),
				selectedKeys: ingredientFilterTags,
				setSelectedKeys:
					normalGuestStore.persistence.ingredient.filters.tags.set,
				valueType: 'foodTag',
			},
			{
				items: availableIngredientTags,
				label: t('guests.filter.ingredientTagsExclude'),
				selectedKeys: ingredientFilterNoTags,
				setSelectedKeys:
					normalGuestStore.persistence.ingredient.filters.noTags.set,
				valueType: 'foodTag',
			},
			{
				items: availableIngredientLevels,
				label: t('guests.filter.level'),
				selectedKeys: ingredientFilterLevels,
				setSelectedKeys:
					normalGuestStore.persistence.ingredient.filters.levels.set,
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
		normalGuestStore.persistence.ingredient.tabVisibility.use();

	const ingredientTabStyle =
		ingredientTabStyleMap[ingredientTabVisibilityState];

	const isIngredientTabFilterVisible =
		normalGuestStore.shared.ingredient.filterVisibility.use();

	const selectedTabKey = normalGuestStore.shared.tab.use();

	const onTabSelectionChange = useCallback(
		(key: Key) => {
			const nextTabKey = GUEST_TAB_BY_KEY.get(key);
			if (nextTabKey === undefined) {
				return;
			}
			vibrate(nextTabKey !== selectedTabKey);
			normalGuestStore.onTabSelectionChange(nextTabKey);
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
						currentNormalGuest !== null,
				}
			)}
		>
			<div className="px-2 xl:w-full xl:px-0 xl:pt-2">
				<NormalGuestTabs
					isGuestSelected={currentNormalGuest !== null}
					isHighAppearance={isHighAppearance}
					isMealSelected={
						currentNormalGuest !== null && currentMealFood !== null
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
				target={currentNormalGuest === null ? 'placeholder' : 'content'}
				variant={
					currentNormalGuest === null ? 'placeholder' : 'content'
				}
				className={cn(
					'flex flex-col gap-4 p-2 pt-0 md:pb-0 md:pt-2 xl:w-full xl:pb-2',
					{ grow: currentNormalGuest === null }
				)}
			>
				{currentNormalGuest === null ? (
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
				currentNormalGuest !== null && (
					<Tachie
						aria-hidden
						alt={normalGuestStore.instances.clothes
							.get()
							.getDisplayPropsById(-2, 'name')}
						src={getClothesTachiePath(-2)}
						width={120}
						className="pointer-events-none fixed bottom-0 right-0 pr-1"
					/>
				)}
		</div>
	);
}
