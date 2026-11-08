'use client';

import { driver } from 'driver.js';
import { useCallback, useEffect, useRef } from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { accountStore } from '@/features/account/client/state/accountStore';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { appShellMessages } from '@/features/appShell/client/messages';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';
import { GUEST_INFO_QUERY_PARAM } from '@/features/catalog/guests/shared/navigation';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import {
	getBeverageTagLabel,
	getFoodTagLabel,
} from '@/features/catalog/shared/client/localization/tagLabels';
import { useCatalogLocalizationReady } from '@/features/catalog/shared/client/localization/useCatalogLocalizationReady';
import {
	consumeSpecialGuestTutorialAllowedPathname,
	useSpecialGuestTutorialAllowedPathname,
} from '@/features/globalSearch/client/specialGuestTutorialHandoff';
import {
	tryAcquireTutorial,
	useOverlayIdleForTutorial,
} from '@/features/overlays/client';
import type { ITutorialLease } from '@/features/overlays/contracts';
import { preferencesMessages } from '@/features/preferences/client/messages';
import { suggestedMealsUiStore } from '@/features/recommendations/client/state/suggestedMealsUiStore';
import { specialGuestTutorialMessages } from '@/features/tutorials/specialGuest/client/messages';
import {
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_ID,
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_POSITION,
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_SORT_POSITION,
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAB_POSITION,
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_ID,
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_POSITION,
	SPECIAL_GUEST_TUTORIAL_COOKER_POSITION,
	SPECIAL_GUEST_TUTORIAL_EGG_ID,
	SPECIAL_GUEST_TUTORIAL_EGG_POSITION,
	SPECIAL_GUEST_TUTORIAL_FOOD_TAB_POSITION,
	SPECIAL_GUEST_TUTORIAL_FOOD_TAG_ID,
	SPECIAL_GUEST_TUTORIAL_FOOD_TAG_POSITION,
	SPECIAL_GUEST_TUTORIAL_GUEST_ID,
	SPECIAL_GUEST_TUTORIAL_GUEST_POSITION,
	SPECIAL_GUEST_TUTORIAL_HONEY_ID,
	SPECIAL_GUEST_TUTORIAL_HONEY_POSITION,
	SPECIAL_GUEST_TUTORIAL_INGREDIENT_TAB_POSITION,
	SPECIAL_GUEST_TUTORIAL_MORE_POSITION,
	SPECIAL_GUEST_TUTORIAL_MOVE_DELAY_MS,
	SPECIAL_GUEST_TUTORIAL_PATHNAME,
	SPECIAL_GUEST_TUTORIAL_RATING_POSITION,
	SPECIAL_GUEST_TUTORIAL_RECIPE_ID,
	SPECIAL_GUEST_TUTORIAL_RECIPE_POSITION,
	SPECIAL_GUEST_TUTORIAL_SAVE_POSITION,
	SPECIAL_GUEST_TUTORIAL_SCROLL_MOVE_DELAY_MS,
	SPECIAL_GUEST_TUTORIAL_START_DELAY_MS,
	SPECIAL_GUEST_TUTORIAL_STEP_INDEX,
	SPECIAL_GUEST_TUTORIAL_SUGGESTED_MEALS_POSITION,
} from '@/features/tutorials/specialGuest/constants';

import {
	buildLocalePath,
	getPathnameWithoutLocalePrefix,
} from '@/shared/i18n/routeLocales';
import { useI18n } from '@/shared/i18n/useI18n';

import {
	completeSpecialGuestTutorial,
	useSpecialGuestTutorialCompleted,
} from './tutorialProgress';

type TSpecialGuestTutorialTransition =
	| 'beverage'
	| 'beverageTab'
	| 'food'
	| 'foodTab'
	| 'foodTag'
	| 'guest'
	| 'ingredient1'
	| 'ingredient2'
	| 'ingredientTab'
	| 'sort'
	| 'suggestion';

const TUTORIAL_VIEWPORT_PADDING_PX = 16;
const TUTORIAL_CLIPPING_OVERFLOW_VALUES: ReadonlySet<string> = new Set([
	'auto',
	'clip',
	'hidden',
	'overlay',
	'scroll',
]);

function getTutorialSafeViewport() {
	const navbar = document.querySelector(
		'[data-coordinated-overlay-id="navigation.mobile-menu"]'
	);
	const navbarRect = navbar?.getBoundingClientRect();
	const navbarIsOverlapping =
		navbarRect !== undefined &&
		navbarRect.bottom > 0 &&
		navbarRect.top < globalThis.innerHeight / 2;

	return {
		bottom: globalThis.innerHeight - TUTORIAL_VIEWPORT_PADDING_PX,
		left: TUTORIAL_VIEWPORT_PADDING_PX,
		right: globalThis.innerWidth - TUTORIAL_VIEWPORT_PADDING_PX,
		top: navbarIsOverlapping
			? navbarRect.bottom + TUTORIAL_VIEWPORT_PADDING_PX
			: TUTORIAL_VIEWPORT_PADDING_PX,
	};
}

function checkIsTutorialTargetVisible(element: Element) {
	const rect = element.getBoundingClientRect();
	const safeViewport = getTutorialSafeViewport();

	const isInsideViewport =
		rect.width > 0 &&
		rect.height > 0 &&
		rect.top >= safeViewport.top &&
		rect.left >= safeViewport.left &&
		rect.bottom <= safeViewport.bottom &&
		rect.right <= safeViewport.right;
	if (!isInsideViewport) {
		return false;
	}

	let ancestor = element.parentElement;
	while (ancestor !== null) {
		const style = getComputedStyle(ancestor);
		const ancestorRect = ancestor.getBoundingClientRect();

		if (
			TUTORIAL_CLIPPING_OVERFLOW_VALUES.has(style.overflowY) &&
			(rect.top < ancestorRect.top || rect.bottom > ancestorRect.bottom)
		) {
			return false;
		}
		if (
			TUTORIAL_CLIPPING_OVERFLOW_VALUES.has(style.overflowX) &&
			(rect.left < ancestorRect.left || rect.right > ancestorRect.right)
		) {
			return false;
		}

		ancestor = ancestor.parentElement;
	}

	return true;
}

function alignTutorialTargetWithSafeViewport(element: Element) {
	const rect = element.getBoundingClientRect();
	const safeViewport = getTutorialSafeViewport();

	if (rect.top < safeViewport.top) {
		globalThis.scrollBy({
			behavior: 'auto',
			top: rect.top - safeViewport.top,
		});
	} else if (rect.bottom > safeViewport.bottom) {
		globalThis.scrollBy({
			behavior: 'auto',
			top: rect.bottom - safeViewport.bottom,
		});
	}
}

export default function SpecialGuestTutorial() {
	const isLocalizationReady = useCatalogLocalizationReady();
	const isReducedMotion = useReducedMotion();
	const { locale, t } = useI18n(specialGuestTutorialMessages);
	const { t: tAppShell } = useI18n(appShellMessages);
	const { t: tCatalog } = useI18n(catalogGuestsMessages);
	const { t: tPreferences } = useI18n(preferencesMessages);
	const isOverlayIdleForTutorial = useOverlayIdleForTutorial();
	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const accountConflicts = accountStore.shared.sync.conflicts.use();
	const accountIsLoggedIn = accountStore.shared.isLoggedIn.use();
	const accountLastSyncedAt = accountStore.shared.sync.lastSyncedAt.use();
	const accountUser = accountStore.shared.user.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();

	const globalSearchSpecialGuestTutorialAllowedPathname =
		useSpecialGuestTutorialAllowedPathname();
	const normalizedGlobalSearchSpecialGuestTutorialAllowedPathname =
		globalSearchSpecialGuestTutorialAllowedPathname === null
			? null
			: getPathnameWithoutLocalePrefix(
					globalSearchSpecialGuestTutorialAllowedPathname
				);

	const { pathname: currentPathname } = usePathname();
	const currentPathnameWithoutLocalePrefix =
		getPathnameWithoutLocalePrefix(currentPathname);
	const isTargetPage = currentPathnameWithoutLocalePrefix.startsWith(
		SPECIAL_GUEST_TUTORIAL_PATHNAME
	);

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();
	const currentOrderedFoodTag =
		specialGuestStore.shared.guest.order.foodTag.use();
	const currentOrderedBeverageTag =
		specialGuestStore.shared.guest.order.beverageTag.use();

	const currentBeverage = specialGuestStore.shared.beverage.id.use();
	const currentBeverageTableSortDescriptor =
		specialGuestStore.persistence.beverage.table.sortDescriptor.use();
	const isBeverageTableSortedByPriceDescending =
		currentBeverageTableSortDescriptor.column === 'price' &&
		currentBeverageTableSortDescriptor.direction === 'descending';

	const currentMealFood = specialGuestStore.shared.recipe.data.use();

	const selectedTabKey = specialGuestStore.shared.tab.use();
	const suggestionStatus = suggestedMealsUiStore.status.use();
	const suggestionResultCount = suggestedMealsUiStore.resultCount.use();

	const isCompleted = useSpecialGuestTutorialCompleted();
	const hasCurrentUserConflict = accountConflicts.some(
		(conflict) => conflict.userId === accountUser?.id
	);
	const hasBlockingAccountModal =
		passwordMustChange || hasCurrentUserConflict;
	const isAccountSyncReady =
		!accountIsLoggedIn || accountLastSyncedAt !== null;

	const scheduledTutorialMovesRef = useRef(
		new Set<ReturnType<typeof setTimeout>>()
	);
	const shouldSkipCompletionOnDestroy = useRef(false);
	const allowedGlobalSearchPathname = useRef<null | string>(null);
	const tutorialLeaseRef = useRef<ITutorialLease | null>(null);
	const driverRef = useRef<ReturnType<typeof driver> | null>(null);
	const completedTransitionsRef = useRef(
		new Set<TSpecialGuestTutorialTransition>()
	);

	const clearScheduledTutorialMoves = useCallback(() => {
		scheduledTutorialMovesRef.current.forEach(clearTimeout);
		scheduledTutorialMovesRef.current.clear();
	}, []);

	const scheduleTutorialTask = useCallback(
		(delayMs: number, callback: () => void) => {
			const handler = setTimeout(() => {
				scheduledTutorialMovesRef.current.delete(handler);
				callback();
			}, delayMs);
			scheduledTutorialMovesRef.current.add(handler);
		},
		[]
	);
	const scheduleStepAfterLayoutChange = useCallback(
		(callback: () => void) => {
			scheduleTutorialTask(
				isReducedMotion ? 0 : SPECIAL_GUEST_TUTORIAL_MOVE_DELAY_MS,
				callback
			);
		},
		[isReducedMotion, scheduleTutorialTask]
	);
	const scheduleTutorialMove = useCallback(
		(callback: () => void) => {
			scheduleTutorialTask(
				SPECIAL_GUEST_TUTORIAL_SCROLL_MOVE_DELAY_MS,
				callback
			);
		},
		[scheduleTutorialTask]
	);

	const resetTutorialDriver = useCallback(() => {
		clearScheduledTutorialMoves();
		tutorialLeaseRef.current?.release();
		tutorialLeaseRef.current = null;
		specialGuestStore.shared.tutorial.isOrderLinkedNavigationSuspended.set(
			false
		);
		completedTransitionsRef.current.clear();
	}, [clearScheduledTutorialMoves]);

	const moveToStep = useCallback(
		(
			index: number,
			selector: string,
			position: ScrollLogicalPosition = 'nearest'
		) => {
			const tutorialDriver = driverRef.current;
			if (!tutorialDriver?.isActive()) {
				return;
			}

			clearScheduledTutorialMoves();
			const element = document.querySelector(selector);
			if (element === null) {
				tutorialDriver.moveTo(index);
				return;
			}

			if (checkIsTutorialTargetVisible(element)) {
				tutorialDriver.moveTo(index);
				return;
			}

			try {
				element.scrollIntoView({ behavior: 'smooth', block: position });
			} catch {
				element.scrollIntoView(true);
			}

			scheduleTutorialMove(() => {
				if (!tutorialDriver.isActive()) {
					return;
				}
				document.querySelector('main').scrollIntoView(true);
				alignTutorialTargetWithSafeViewport(element);
				tutorialDriver.moveTo(index);
			});
		},
		[clearScheduledTutorialMoves, scheduleTutorialMove]
	);

	const enterManualChapter = useCallback(() => {
		specialGuestStore.shared.tutorial.isOrderLinkedNavigationSuspended.set(
			false
		);
		moveToStep(
			SPECIAL_GUEST_TUTORIAL_STEP_INDEX.foodTab,
			SPECIAL_GUEST_TUTORIAL_FOOD_TAB_POSITION
		);
		trackEvent(trackEvent.category.click, 'Tutorial Button', 'Next');
	}, [moveToStep]);

	const createDriver = useCallback(() => {
		const guestCatalog = specialGuestStore.instances.guest.get();
		const beverageCatalog = specialGuestStore.instances.beverage.get();
		const foodCatalog = specialGuestStore.instances.recipe.get();
		const ingredientCatalog = specialGuestStore.instances.ingredient.get();
		const guestName = guestCatalog.getDisplayPropsById(
			SPECIAL_GUEST_TUTORIAL_GUEST_ID
		).name;
		const beverageName = beverageCatalog.getDisplayPropsById(
			SPECIAL_GUEST_TUTORIAL_BEVERAGE_ID,
			'name'
		);
		const foodName = foodCatalog.getDisplayPropsById(
			foodCatalog.getRecipeOwnerById(SPECIAL_GUEST_TUTORIAL_RECIPE_ID)
				.food.id,
			'name'
		);
		const eggName = ingredientCatalog.getDisplayPropsById(
			SPECIAL_GUEST_TUTORIAL_EGG_ID,
			'name'
		);
		const honeyName = ingredientCatalog.getDisplayPropsById(
			SPECIAL_GUEST_TUTORIAL_HONEY_ID,
			'name'
		);
		const beverageTagName = getBeverageTagLabel(
			SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_ID
		);
		const foodTagName = getFoodTagLabel(SPECIAL_GUEST_TUTORIAL_FOOD_TAG_ID);
		const preferencesLabel = tAppShell('appShell.nav.preferences');
		const resetLabel = tPreferences('preferences.reset.tutorial');
		const foodTabLabel = tAppShell('appShell.nav.foods');
		const beverageTabLabel = tAppShell('appShell.nav.beverages');
		const ingredientTabLabel = tAppShell('appShell.nav.ingredients');
		const recommendationSettingsLabel = tCatalog(
			'guests.suggestedMeal.settingsTitle'
		);
		const recommendationSelectLabel = tCatalog('guests.savedMeal.select');
		const popularTrendLabel = tPreferences(
			'preferences.global.popularTrend.title'
		);

		const appendButton = (
			footerButtons: HTMLElement,
			label: string,
			onPress: () => void
		) => {
			const button = document.createElement('button');
			button.textContent = label;
			button.addEventListener('click', onPress);
			footerButtons.append(button);
		};

		const appendNextButton = (
			footerButtons: HTMLElement,
			onPress: () => void
		) => {
			appendButton(footerButtons, t('tutorial.next'), onPress);
		};

		return driver({
			allowClose: false,
			allowKeyboardControl: false,
			popoverClass: '!bg-background dark:!bg-content1 !text-foreground',
			progressText: t('tutorial.progress'),
			showButtons: ['close'],
			showProgress: true,

			onDestroyed() {
				driverRef.current = null;
				resetTutorialDriver();

				if (shouldSkipCompletionOnDestroy.current) {
					shouldSkipCompletionOnDestroy.current = false;
					return;
				}

				if (
					getPathnameWithoutLocalePrefix(
						location.pathname
					).startsWith(SPECIAL_GUEST_TUTORIAL_PATHNAME)
				) {
					completeSpecialGuestTutorial();
				}
			},

			steps: [
				{
					popover: {
						description: `<div class="space-y-2"><p>${t('tutorial.intro.p1')}</p><p class="text-tiny text-foreground-500">${t('tutorial.intro.p2', { preferences: preferencesLabel, reset: resetLabel })}</p></div>`,
						onPopoverRender(popover) {
							appendButton(
								popover.footerButtons,
								t('tutorial.skip'),
								() => {
									driverRef.current?.destroy();
									trackEvent(
										trackEvent.category.click,
										'Tutorial Button',
										'Skip'
									);
								}
							);
							appendNextButton(popover.footerButtons, () => {
								moveToStep(
									SPECIAL_GUEST_TUTORIAL_STEP_INDEX.guest,
									SPECIAL_GUEST_TUTORIAL_GUEST_POSITION,
									'center'
								);
								trackEvent(
									trackEvent.category.click,
									'Tutorial Button',
									'Next'
								);
							});
						},
						title: t('tutorial.intro.title'),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_GUEST_POSITION,
					popover: {
						description: t('tutorial.step.guest.desc', {
							guest: guestName,
						}),
						title: t('tutorial.step.guest.title'),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_FOOD_TAG_POSITION,
					popover: {
						description: t('tutorial.step.foodTag.desc', {
							guest: guestName,
							tag: foodTagName,
						}),
						title: t('tutorial.step.foodTag.title'),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_POSITION,
					popover: {
						description: t('tutorial.step.beverageTag.desc', {
							guest: guestName,
							tag: beverageTagName,
						}),
						title: t('tutorial.step.beverageTag.title'),
					},
				},
				{
					disableActiveInteraction: true,
					element: SPECIAL_GUEST_TUTORIAL_SUGGESTED_MEALS_POSITION,
					popover: {
						description: t(
							'tutorial.step.autoRecommendation.desc',
							{
								select: recommendationSelectLabel,
								settings: recommendationSettingsLabel,
							}
						),
						onPopoverRender(popover) {
							appendNextButton(
								popover.footerButtons,
								enterManualChapter
							);
						},
						title: t('tutorial.step.autoRecommendation.title'),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_FOOD_TAB_POSITION,
					popover: {
						description: t('tutorial.step.foodTab.desc', {
							tab: foodTabLabel,
						}),
						title: t('tutorial.step.foodTab.title'),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_RECIPE_POSITION,
					popover: {
						description: t('tutorial.step.food.desc', {
							food: foodName,
						}),
						title: t('tutorial.step.food.title'),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAB_POSITION,
					popover: {
						description: t('tutorial.step.beverageTab.desc', {
							tab: beverageTabLabel,
						}),
						title: t('tutorial.step.beverageTab.title'),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_BEVERAGE_SORT_POSITION,
					popover: {
						description: t('tutorial.step.sort.desc'),
						title: t('tutorial.step.sort.title'),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_BEVERAGE_POSITION,
					popover: {
						description: t('tutorial.step.beverage.desc', {
							beverage: beverageName,
						}),
						title: t('tutorial.step.beverage.title'),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_INGREDIENT_TAB_POSITION,
					popover: {
						description: t('tutorial.step.ingredient.desc', {
							tab: ingredientTabLabel,
						}),
						title: t('tutorial.step.ingredient.title'),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_EGG_POSITION,
					popover: {
						description: t('tutorial.step.ingredient1.desc', {
							name: eggName,
						}),
						title: t('tutorial.step.ingredient1.title', {
							name: eggName,
						}),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_HONEY_POSITION,
					popover: {
						description: t('tutorial.step.ingredient2.desc', {
							name: honeyName,
						}),
						title: t('tutorial.step.ingredient2.title', {
							name: honeyName,
						}),
					},
				},
				{
					disableActiveInteraction: true,
					element: SPECIAL_GUEST_TUTORIAL_RATING_POSITION,
					popover: {
						description: t('tutorial.step.rating.desc', {
							trend: popularTrendLabel,
						}),
						onPopoverRender(popover) {
							appendNextButton(popover.footerButtons, () => {
								moveToStep(
									SPECIAL_GUEST_TUTORIAL_STEP_INDEX.cooker,
									SPECIAL_GUEST_TUTORIAL_COOKER_POSITION
								);
								trackEvent(
									trackEvent.category.click,
									'Tutorial Button',
									'Next'
								);
							});
						},
						title: t('tutorial.step.rating.title'),
					},
				},
				{
					disableActiveInteraction: true,
					element: SPECIAL_GUEST_TUTORIAL_COOKER_POSITION,
					popover: {
						description: t('tutorial.step.cooker.desc'),
						onPopoverRender(popover) {
							appendNextButton(popover.footerButtons, () => {
								moveToStep(
									SPECIAL_GUEST_TUTORIAL_STEP_INDEX.save,
									SPECIAL_GUEST_TUTORIAL_SAVE_POSITION
								);
								trackEvent(
									trackEvent.category.click,
									'Tutorial Button',
									'Next'
								);
							});
						},
						title: t('tutorial.step.cooker.title'),
					},
				},
				{
					disableActiveInteraction: true,
					element: SPECIAL_GUEST_TUTORIAL_SAVE_POSITION,
					popover: {
						description: t('tutorial.step.save.desc'),
						onPopoverRender(popover) {
							appendNextButton(popover.footerButtons, () => {
								moveToStep(
									SPECIAL_GUEST_TUTORIAL_STEP_INDEX.more,
									SPECIAL_GUEST_TUTORIAL_MORE_POSITION
								);
								trackEvent(
									trackEvent.category.click,
									'Tutorial Button',
									'Next'
								);
							});
						},
						title: t('tutorial.step.save.title'),
					},
				},
				{
					disableActiveInteraction: true,
					element: SPECIAL_GUEST_TUTORIAL_MORE_POSITION,
					popover: {
						description: t('tutorial.step.more.desc'),
						onPopoverRender(popover) {
							appendButton(
								popover.footerButtons,
								t('tutorial.complete'),
								() => {
									driverRef.current?.destroy();
									trackEvent(
										trackEvent.category.click,
										'Tutorial Button',
										'Complete'
									);
								}
							);
						},
						title: t('tutorial.step.more.title'),
					},
				},
			],
		});
	}, [
		enterManualChapter,
		moveToStep,
		resetTutorialDriver,
		t,
		tAppShell,
		tCatalog,
		tPreferences,
	]);

	const takeTransition = useCallback(
		(transition: TSpecialGuestTutorialTransition) => {
			if (completedTransitionsRef.current.has(transition)) {
				return false;
			}
			completedTransitionsRef.current.add(transition);
			return true;
		},
		[]
	);

	useEffect(() => {
		if (!driverRef.current?.isActive()) {
			return;
		}

		const extraIngredients = currentMealFood?.extraIngredients ?? [];

		if (currentSpecialGuest !== null && takeTransition('guest')) {
			moveToStep(
				SPECIAL_GUEST_TUTORIAL_STEP_INDEX.foodTag,
				SPECIAL_GUEST_TUTORIAL_FOOD_TAG_POSITION
			);
		} else if (
			currentOrderedFoodTag !== null &&
			takeTransition('foodTag')
		) {
			moveToStep(
				SPECIAL_GUEST_TUTORIAL_STEP_INDEX.beverageTag,
				SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_POSITION
			);
		} else if (
			currentOrderedFoodTag !== null &&
			currentOrderedBeverageTag !== null &&
			suggestionStatus === 'success' &&
			suggestionResultCount > 0 &&
			takeTransition('suggestion')
		) {
			moveToStep(
				SPECIAL_GUEST_TUTORIAL_STEP_INDEX.autoRecommendation,
				SPECIAL_GUEST_TUTORIAL_SUGGESTED_MEALS_POSITION
			);
		} else if (selectedTabKey === 'food' && takeTransition('foodTab')) {
			scheduleStepAfterLayoutChange(() => {
				moveToStep(
					SPECIAL_GUEST_TUTORIAL_STEP_INDEX.food,
					SPECIAL_GUEST_TUTORIAL_RECIPE_POSITION
				);
			});
		} else if (
			currentMealFood?.recipeId === SPECIAL_GUEST_TUTORIAL_RECIPE_ID &&
			takeTransition('food')
		) {
			moveToStep(
				SPECIAL_GUEST_TUTORIAL_STEP_INDEX.beverageTab,
				SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAB_POSITION
			);
		} else if (
			selectedTabKey === 'beverage' &&
			takeTransition('beverageTab')
		) {
			scheduleStepAfterLayoutChange(() => {
				if (isBeverageTableSortedByPriceDescending) {
					takeTransition('sort');
					moveToStep(
						SPECIAL_GUEST_TUTORIAL_STEP_INDEX.beverage,
						SPECIAL_GUEST_TUTORIAL_BEVERAGE_POSITION
					);
					return;
				}
				moveToStep(
					SPECIAL_GUEST_TUTORIAL_STEP_INDEX.sort,
					SPECIAL_GUEST_TUTORIAL_BEVERAGE_SORT_POSITION,
					'start'
				);
			});
		} else if (
			isBeverageTableSortedByPriceDescending &&
			takeTransition('sort')
		) {
			moveToStep(
				SPECIAL_GUEST_TUTORIAL_STEP_INDEX.beverage,
				SPECIAL_GUEST_TUTORIAL_BEVERAGE_POSITION
			);
		} else if (
			currentBeverage === SPECIAL_GUEST_TUTORIAL_BEVERAGE_ID &&
			takeTransition('beverage')
		) {
			moveToStep(
				SPECIAL_GUEST_TUTORIAL_STEP_INDEX.ingredient,
				SPECIAL_GUEST_TUTORIAL_INGREDIENT_TAB_POSITION
			);
		} else if (
			selectedTabKey === 'ingredient' &&
			takeTransition('ingredientTab')
		) {
			scheduleStepAfterLayoutChange(() => {
				moveToStep(
					SPECIAL_GUEST_TUTORIAL_STEP_INDEX.ingredient1,
					SPECIAL_GUEST_TUTORIAL_EGG_POSITION
				);
			});
		} else if (
			extraIngredients.includes(SPECIAL_GUEST_TUTORIAL_EGG_ID) &&
			takeTransition('ingredient1')
		) {
			moveToStep(
				SPECIAL_GUEST_TUTORIAL_STEP_INDEX.ingredient2,
				SPECIAL_GUEST_TUTORIAL_HONEY_POSITION
			);
		} else if (
			extraIngredients.includes(SPECIAL_GUEST_TUTORIAL_HONEY_ID) &&
			takeTransition('ingredient2')
		) {
			moveToStep(
				SPECIAL_GUEST_TUTORIAL_STEP_INDEX.rating,
				SPECIAL_GUEST_TUTORIAL_RATING_POSITION
			);
		}
	}, [
		currentBeverage,
		currentMealFood,
		currentOrderedBeverageTag,
		currentOrderedFoodTag,
		currentSpecialGuest,
		isBeverageTableSortedByPriceDescending,
		moveToStep,
		scheduleStepAfterLayoutChange,
		selectedTabKey,
		suggestionResultCount,
		suggestionStatus,
		takeTransition,
	]);

	useEffect(
		() => () => {
			clearScheduledTutorialMoves();
			tutorialLeaseRef.current?.release();
			tutorialLeaseRef.current = null;
			specialGuestStore.shared.tutorial.isOrderLinkedNavigationSuspended.set(
				false
			);
			completedTransitionsRef.current.clear();
		},
		[clearScheduledTutorialMoves]
	);

	useEffect(() => {
		let handler: ReturnType<typeof setTimeout> | undefined;

		const activeDriver = driverRef.current;

		if (isCompleted && activeDriver?.isActive()) {
			shouldSkipCompletionOnDestroy.current = true;
			activeDriver.destroy();
		}

		if (!isAccountSyncReady || hasBlockingAccountModal) {
			if (driverRef.current?.isActive()) {
				shouldSkipCompletionOnDestroy.current = true;
				driverRef.current.destroy();
			}

			completedTransitionsRef.current.clear();

			return () => {
				clearTimeout(handler);
			};
		}

		if (
			normalizedGlobalSearchSpecialGuestTutorialAllowedPathname ===
			currentPathnameWithoutLocalePrefix
		) {
			allowedGlobalSearchPathname.current =
				currentPathnameWithoutLocalePrefix;
			consumeSpecialGuestTutorialAllowedPathname();
		}

		const isAllowedGlobalSearchPathname =
			currentPathnameWithoutLocalePrefix !==
				SPECIAL_GUEST_TUTORIAL_PATHNAME &&
			allowedGlobalSearchPathname.current ===
				currentPathnameWithoutLocalePrefix;
		const isAllowedSharedInfoPathname = new URLSearchParams(
			location.search
		).has(GUEST_INFO_QUERY_PARAM);

		if (
			accountBootstrapStatus !== 'unknown' &&
			isLocalizationReady &&
			isTargetPage &&
			!isCompleted &&
			!driverRef.current?.isActive()
		) {
			if (
				currentPathnameWithoutLocalePrefix ===
				SPECIAL_GUEST_TUTORIAL_PATHNAME
			) {
				handler = setTimeout(() => {
					if (
						!isOverlayIdleForTutorial ||
						(driverRef.current?.isActive() ?? false)
					) {
						return;
					}

					const tutorialLease = tryAcquireTutorial({
						onPreempt: () => {
							shouldSkipCompletionOnDestroy.current = true;
							clearScheduledTutorialMoves();
							driverRef.current?.destroy();
						},
					});
					if (tutorialLease === null) {
						return;
					}

					tutorialLeaseRef.current = tutorialLease;
					specialGuestStore.shared.tutorial.isOrderLinkedNavigationSuspended.set(
						true
					);
					completedTransitionsRef.current.clear();
					const tutorialDriver = createDriver();
					driverRef.current = tutorialDriver;
					try {
						tutorialDriver.drive();
					} catch (error) {
						resetTutorialDriver();
						driverRef.current = null;
						throw error;
					}
					trackEvent(
						trackEvent.category.click,
						'Tutorial Button',
						'Start'
					);
				}, SPECIAL_GUEST_TUTORIAL_START_DELAY_MS);
			} else if (
				!isAllowedGlobalSearchPathname &&
				!isAllowedSharedInfoPathname
			) {
				location.href = buildLocalePath(
					locale,
					SPECIAL_GUEST_TUTORIAL_PATHNAME
				);
			}
		}
		if (!isTargetPage) {
			allowedGlobalSearchPathname.current = null;
			driverRef.current?.destroy();
			driverRef.current = null;
			resetTutorialDriver();
		}

		return () => {
			clearTimeout(handler);
		};
	}, [
		accountBootstrapStatus,
		clearScheduledTutorialMoves,
		createDriver,
		currentPathnameWithoutLocalePrefix,
		hasBlockingAccountModal,
		isAccountSyncReady,
		isCompleted,
		isLocalizationReady,
		isOverlayIdleForTutorial,
		isTargetPage,
		locale,
		normalizedGlobalSearchSpecialGuestTutorialAllowedPathname,
		resetTutorialDriver,
	]);

	return null;
}
