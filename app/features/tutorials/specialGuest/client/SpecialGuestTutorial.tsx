'use client';

import { driver } from 'driver.js';
import { useCallback, useEffect, useRef } from 'react';

import type { TIngredientId } from '@/domain/data/ingredients/types';
import { DYNAMIC_FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';

import { accountStore } from '@/features/account/client/state/accountStore';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { appShellMessages } from '@/features/appShell/client/messages';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { GUEST_INFO_QUERY_PARAM } from '@/features/catalog/guests/shared/navigation';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import {
	getBeverageTagLabel,
	getFoodTagLabel,
} from '@/features/catalog/shared/client/localization/tagLabels';
import { preferencesMessages } from '@/features/preferences/client/messages';
import {
	consumeSpecialGuestTutorialAllowedPathname,
	useSpecialGuestTutorialAllowedPathname,
} from '@/features/globalSearch/client/specialGuestTutorialHandoff';
import {
	tryAcquireTutorial,
	useOverlayIdleForTutorial,
} from '@/features/overlays/client';
import type { ITutorialLease } from '@/features/overlays/contracts';
import { specialGuestTutorialMessages } from '@/features/tutorials/specialGuest/client/messages';
import {
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_ID,
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_POSITION,
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_SORT_POSITION,
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_STEP_INDEX,
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_ID,
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_POSITION,
	SPECIAL_GUEST_TUTORIAL_EGG_ID,
	SPECIAL_GUEST_TUTORIAL_EGG_POSITION,
	SPECIAL_GUEST_TUTORIAL_FOOD_TAG_ID,
	SPECIAL_GUEST_TUTORIAL_FOOD_TAG_POSITION,
	SPECIAL_GUEST_TUTORIAL_GUEST_ID,
	SPECIAL_GUEST_TUTORIAL_GUEST_POSITION,
	SPECIAL_GUEST_TUTORIAL_HONEY_ID,
	SPECIAL_GUEST_TUTORIAL_HONEY_POSITION,
	SPECIAL_GUEST_TUTORIAL_INGREDIENT_TAB_POSITION,
	SPECIAL_GUEST_TUTORIAL_MOVE_DELAY_MS,
	SPECIAL_GUEST_TUTORIAL_PATHNAME,
	SPECIAL_GUEST_TUTORIAL_RECIPE_ID,
	SPECIAL_GUEST_TUTORIAL_RECIPE_POSITION,
	SPECIAL_GUEST_TUTORIAL_SCROLL_MOVE_DELAY_MS,
	SPECIAL_GUEST_TUTORIAL_START_DELAY_MS,
} from '@/features/tutorials/specialGuest/constants';

import { useI18n } from '@/shared/i18n/useI18n';
import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import {
	completeSpecialGuestTutorial,
	useSpecialGuestTutorialCompleted,
} from './tutorialProgress';

const tutorialEgg: TIngredientId = 0;
const tutorialHoney: TIngredientId = 24;

export default function SpecialGuestTutorial() {
	const isOverlayIdleForTutorial = useOverlayIdleForTutorial();
	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const accountConflicts = accountStore.shared.sync.conflicts.use();
	const accountIsLoggedIn = accountStore.shared.isLoggedIn.use();
	const accountLastSyncedAt = accountStore.shared.sync.lastSyncedAt.use();
	const accountUser = accountStore.shared.user.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();

	const globalSearchSpecialGuestTutorialAllowedPathname =
		useSpecialGuestTutorialAllowedPathname();

	const { pathname: currentPathname } = usePathname();
	const isTargetPage = currentPathname.startsWith(
		SPECIAL_GUEST_TUTORIAL_PATHNAME
	);

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();
	const currentGuestOrder = specialGuestStore.shared.guest.order.use();
	const {
		beverageTag: currentOrderedBeverageTag,
		foodTag: currentOrderedFoodTag,
	} = currentGuestOrder;

	const currentBeverage = specialGuestStore.shared.beverage.id.use();
	const currentBeverageTableSortDescriptor =
		specialGuestStore.persistence.beverage.table.sortDescriptor.use();
	const isBeverageTableSortedByPriceAscending =
		currentBeverageTableSortDescriptor.column === 'price' &&
		currentBeverageTableSortDescriptor.direction === 'descending';

	const currentMealFood = specialGuestStore.shared.recipe.data.use();
	const currentExtraIngredients = currentMealFood?.extraIngredients;

	const selectedTabKey = specialGuestStore.shared.tab.use();
	const isIngredientTabSelected = selectedTabKey === 'ingredient';

	const isCompleted = useSpecialGuestTutorialCompleted();
	const hasCurrentUserConflict = accountConflicts.some(
		(conflict) => conflict.userId === accountUser?.id
	);
	const hasBlockingAccountModal =
		passwordMustChange || hasCurrentUserConflict;
	const isAccountSyncReady =
		!accountIsLoggedIn || accountLastSyncedAt !== null;

	const delayedMoveNextHandler = useRef<
		ReturnType<typeof setTimeout> | undefined
	>(undefined);
	const mobileScrollMoveHandlers = useRef(
		new Set<ReturnType<typeof setTimeout>>()
	);
	const clearMobileScrollMoveHandlers = useCallback(() => {
		mobileScrollMoveHandlers.current.forEach(clearTimeout);
		mobileScrollMoveHandlers.current.clear();
	}, []);
	const scheduleMobileScrollMove = useCallback((callback: () => void) => {
		const handler = setTimeout(() => {
			mobileScrollMoveHandlers.current.delete(handler);
			callback();
		}, SPECIAL_GUEST_TUTORIAL_SCROLL_MOVE_DELAY_MS);
		mobileScrollMoveHandlers.current.add(handler);
	}, []);

	const shouldSkipCompletionOnDestroy = useRef(false);
	const allowedGlobalSearchPathname = useRef<null | string>(null);
	const tutorialLeaseRef = useRef<ITutorialLease | null>(null);
	const { t } = useI18n(specialGuestTutorialMessages);
	const { t: tAppShell } = useI18n(appShellMessages);
	const { t: tPreferences } = useI18n(preferencesMessages);

	const driverRef = useRef<ReturnType<typeof driver> | null>(null);

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
		const popularPositiveName = getFoodTagLabel(
			DYNAMIC_FOOD_TAG_MAP.popularPositive
		);
		const popularNegativeName = getFoodTagLabel(
			DYNAMIC_FOOD_TAG_MAP.popularNegative
		);
		const preferencesLabel = tAppShell('appShell.nav.preferences');
		const resetLabel = tPreferences('preferences.reset.tutorial');

		return driver({
			allowClose: false,
			popoverClass: '!bg-background dark:!bg-content1 !text-foreground',
			progressText: t('tutorial.progress'),
			showButtons: ['close'],
			showProgress: true,

			onDestroyed() {
				clearTimeout(delayedMoveNextHandler.current);
				delayedMoveNextHandler.current = undefined;
				clearMobileScrollMoveHandlers();
				tutorialLeaseRef.current?.release();
				tutorialLeaseRef.current = null;

				if (shouldSkipCompletionOnDestroy.current) {
					shouldSkipCompletionOnDestroy.current = false;
					return;
				}

				if (
					location.pathname.startsWith(
						SPECIAL_GUEST_TUTORIAL_PATHNAME
					)
				) {
					completeSpecialGuestTutorial();
				}
			},

			steps: [
				{
					popover: {
						description: `<div class="space-y-2"><p>${t('tutorial.intro.p1')}</p><p class="text-tiny text-foreground-500">${t('tutorial.intro.p2', { preferences: preferencesLabel, reset: resetLabel })}</p></div>`,
						onPopoverRender(popover) {
							const skipButton = document.createElement('button');
							skipButton.textContent = t('tutorial.skip');
							skipButton.addEventListener('click', () => {
								driverRef.current?.destroy();
								trackEvent(
									trackEvent.category.click,
									'Tutorial Button',
									'Skip'
								);
							});
							const nextButton = document.createElement('button');
							nextButton.textContent = t('tutorial.next');
							nextButton.addEventListener('click', () => {
								driverRef.current?.moveNext();
								trackEvent(
									trackEvent.category.click,
									'Tutorial Button',
									'Next'
								);
							});
							popover.footerButtons.append(
								skipButton,
								nextButton
							);
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
					element: SPECIAL_GUEST_TUTORIAL_RECIPE_POSITION,
					popover: {
						description: t('tutorial.step.food.desc', {
							food: foodName,
						}),
						title: t('tutorial.step.food.title'),
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_INGREDIENT_TAB_POSITION,
					popover: {
						description: t('tutorial.step.ingredient.desc'),
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
						title: t('tutorial.step.ingredient1.title', {
							name: honeyName,
						}),
					},
				},
				{
					element: () => {
						const target = document.querySelector(
							globalThis.matchMedia('(min-width: 768px)').matches
								? '[data-customer-info-trigger="desktop"]'
								: '[data-customer-info-trigger="mobile"]'
						);
						if (target === null) {
							throw new Error(
								'Guest info tutorial target is missing.'
							);
						}
						return target;
					},
					popover: {
						description: t('tutorial.step.more.desc', {
							popular: popularPositiveName,
							preferences: preferencesLabel,
							unpopular: popularNegativeName,
						}),
						onPopoverRender(popover) {
							const completeButton =
								document.createElement('button');
							completeButton.textContent = t('tutorial.complete');
							completeButton.addEventListener('click', () => {
								driverRef.current?.destroy();
								trackEvent(
									trackEvent.category.click,
									'Tutorial Button',
									'Complete'
								);
							});
							popover.footerButtons.append(completeButton);
						},
						title: t('tutorial.step.more.title'),
					},
				},
			],
		});
	}, [clearMobileScrollMoveHandlers, t, tAppShell, tPreferences]);

	const isGuestSelected = useRef(false);

	const isBeverageSelected = useRef(false);
	const isBeverageTableSorted = useRef(false);
	const hasOrderedBeverageTag = useRef(false);

	const isFoodSelected = useRef(false);
	const hasExtraEgg = useRef(false);
	const hasExtraHoney = useRef(false);
	const hasOrderedFoodTag = useRef(false);

	const isInIngredientTab = useRef(false);

	const delayedMoveNext = useCallback((callback: () => void) => {
		clearTimeout(delayedMoveNextHandler.current);
		delayedMoveNextHandler.current = setTimeout(() => {
			delayedMoveNextHandler.current = undefined;

			if (driverRef.current?.isActive()) {
				callback();
			}
		}, SPECIAL_GUEST_TUTORIAL_MOVE_DELAY_MS);
	}, []);

	const moveNext = useCallback(
		(selectors: string, position?: ScrollLogicalPosition) => {
			const tutorialDriver = driverRef.current;
			if (tutorialDriver === null) {
				return;
			}

			// The `xl` breakpoint is 1280px.
			if (globalThis.innerWidth >= 1280) {
				tutorialDriver.moveNext();
			} else {
				const element = document.querySelector(selectors);
				// Some browsers don't support scrollIntoViewOptions
				try {
					element?.scrollIntoView({
						behavior: 'smooth',
						block: position ?? 'start',
					});
				} catch {
					element?.scrollIntoView(true);
				}
				// Delay focusing to allow time for scroll animation.
				scheduleMobileScrollMove(() => {
					document.querySelector('main').scrollIntoView(true);
					tutorialDriver.moveNext();
				});
			}
		},
		[scheduleMobileScrollMove]
	);

	const moveTo = useCallback(
		(
			index: number,
			selectors: string,
			position?: ScrollLogicalPosition
		) => {
			const tutorialDriver = driverRef.current;
			if (tutorialDriver === null) {
				return;
			}

			// The `xl` breakpoint is 1280px.
			if (globalThis.innerWidth >= 1280) {
				tutorialDriver.moveTo(index);
			} else {
				const element = document.querySelector(selectors);
				// Some browsers don't support scrollIntoViewOptions
				try {
					element?.scrollIntoView({
						behavior: 'smooth',
						block: position ?? 'start',
					});
				} catch {
					element?.scrollIntoView(true);
				}
				// Delay focusing to allow time for scroll animation.
				scheduleMobileScrollMove(() => {
					document.querySelector('main').scrollIntoView(true);
					tutorialDriver.moveTo(index);
				});
			}
		},
		[scheduleMobileScrollMove]
	);

	useEffect(() => {
		const tutorialDriver = driverRef.current;
		if (!tutorialDriver?.isActive()) {
			return;
		}

		if (currentSpecialGuest !== null && !isGuestSelected.current) {
			isGuestSelected.current = true;
			tutorialDriver.moveTo(2);
		} else if (currentBeverage !== null && !isBeverageSelected.current) {
			isBeverageSelected.current = true;
			tutorialDriver.moveNext();
		} else if (
			currentOrderedBeverageTag !== null &&
			!hasOrderedBeverageTag.current
		) {
			hasOrderedBeverageTag.current = true;

			if (isBeverageTableSortedByPriceAscending) {
				isBeverageTableSorted.current = true;
				delayedMoveNext(() => {
					moveTo(
						SPECIAL_GUEST_TUTORIAL_BEVERAGE_STEP_INDEX,
						SPECIAL_GUEST_TUTORIAL_BEVERAGE_POSITION,
						'nearest'
					);
				});
			} else {
				delayedMoveNext(() => {
					tutorialDriver.moveNext();
				});
			}
		} else if (
			isBeverageTableSortedByPriceAscending &&
			!isBeverageTableSorted.current
		) {
			isBeverageTableSorted.current = true;
			moveNext(SPECIAL_GUEST_TUTORIAL_BEVERAGE_POSITION, 'nearest');
		} else if (currentMealFood !== null && !isFoodSelected.current) {
			isFoodSelected.current = true;
			tutorialDriver.moveNext();
		} else if (
			currentExtraIngredients !== undefined &&
			!checkLengthEmpty(currentExtraIngredients)
		) {
			if (
				currentExtraIngredients.includes(tutorialEgg) &&
				!hasExtraEgg.current
			) {
				hasExtraEgg.current = true;
				moveNext(SPECIAL_GUEST_TUTORIAL_HONEY_POSITION);
			} else if (
				currentExtraIngredients.includes(tutorialHoney) &&
				!hasExtraHoney.current
			) {
				hasExtraHoney.current = true;
				tutorialDriver.moveNext();
			}
		} else if (
			currentOrderedFoodTag !== null &&
			!hasOrderedFoodTag.current
		) {
			hasOrderedFoodTag.current = true;
			delayedMoveNext(() => {
				moveNext(SPECIAL_GUEST_TUTORIAL_RECIPE_POSITION, 'nearest');
			});
		} else if (isIngredientTabSelected && !isInIngredientTab.current) {
			isInIngredientTab.current = true;
			delayedMoveNext(() => {
				moveNext(SPECIAL_GUEST_TUTORIAL_EGG_POSITION);
			});
		}
	}, [
		currentBeverage,
		currentSpecialGuest,
		currentExtraIngredients,
		currentOrderedBeverageTag,
		currentOrderedFoodTag,
		currentMealFood,
		delayedMoveNext,
		isBeverageTableSortedByPriceAscending,
		isIngredientTabSelected,
		moveNext,
		moveTo,
	]);

	useEffect(
		() => () => {
			clearTimeout(delayedMoveNextHandler.current);
			clearMobileScrollMoveHandlers();
			tutorialLeaseRef.current?.release();
			tutorialLeaseRef.current = null;
		},
		[clearMobileScrollMoveHandlers]
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

			isGuestSelected.current = false;
			isBeverageSelected.current = false;
			isBeverageTableSorted.current = false;
			hasOrderedBeverageTag.current = false;
			isFoodSelected.current = false;
			hasExtraEgg.current = false;
			hasExtraHoney.current = false;
			hasOrderedFoodTag.current = false;
			isInIngredientTab.current = false;

			return () => {
				clearTimeout(handler);
			};
		}

		if (
			globalSearchSpecialGuestTutorialAllowedPathname === currentPathname
		) {
			allowedGlobalSearchPathname.current = currentPathname;
			consumeSpecialGuestTutorialAllowedPathname();
		}

		const isAllowedGlobalSearchPathname =
			currentPathname !== SPECIAL_GUEST_TUTORIAL_PATHNAME &&
			allowedGlobalSearchPathname.current === currentPathname;
		const isAllowedSharedInfoPathname = new URLSearchParams(
			location.search
		).has(GUEST_INFO_QUERY_PARAM);

		if (
			accountBootstrapStatus !== 'unknown' &&
			isTargetPage &&
			!isCompleted &&
			!driverRef.current?.isActive()
		) {
			if (currentPathname === SPECIAL_GUEST_TUTORIAL_PATHNAME) {
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
							clearTimeout(delayedMoveNextHandler.current);
							delayedMoveNextHandler.current = undefined;
							clearMobileScrollMoveHandlers();
							driverRef.current?.destroy();
						},
					});
					if (tutorialLease === null) {
						return;
					}

					tutorialLeaseRef.current = tutorialLease;
					const tutorialDriver = createDriver();
					driverRef.current = tutorialDriver;
					try {
						tutorialDriver.drive();
					} catch (error) {
						tutorialLease.release();
						tutorialLeaseRef.current = null;
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
				location.href = SPECIAL_GUEST_TUTORIAL_PATHNAME;
			}
		}
		if (!isTargetPage) {
			allowedGlobalSearchPathname.current = null;
			driverRef.current?.destroy();
			driverRef.current = null;
			tutorialLeaseRef.current?.release();
			tutorialLeaseRef.current = null;
		}

		return () => {
			clearTimeout(handler);
		};
	}, [
		accountBootstrapStatus,
		clearMobileScrollMoveHandlers,
		createDriver,
		currentPathname,
		globalSearchSpecialGuestTutorialAllowedPathname,
		hasBlockingAccountModal,
		isAccountSyncReady,
		isCompleted,
		isOverlayIdleForTutorial,
		isTargetPage,
	]);

	return null;
}
