'use client';

import { driver } from 'driver.js';
import { useCallback, useEffect, useRef } from 'react';

import type { TIngredientId } from '@/domain/data/ingredients/types';
import {
	DYNAMIC_FOOD_TAG_MAP,
	FOOD_TAG_MAP,
} from '@/domain/data/tags/tagFacts';

import { accountStore } from '@/features/account/client/state/accountStore';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';
import { GUEST_INFO_QUERY_PARAM } from '@/features/catalog/guests/shared/navigation';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import {
	consumeSpecialGuestTutorialAllowedPathname,
	useSpecialGuestTutorialAllowedPathname,
} from '@/features/globalSearch/client/specialGuestTutorialHandoff';
import {
	tryAcquireTutorial,
	useOverlayIdleForTutorial,
} from '@/features/overlays/client';
import type { ITutorialLease } from '@/features/overlays/contracts';
import {
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_POSITION,
	SPECIAL_GUEST_TUTORIAL_BEVERAGE_STEP_INDEX,
	SPECIAL_GUEST_TUTORIAL_EGG_POSITION,
	SPECIAL_GUEST_TUTORIAL_HONEY_POSITION,
	SPECIAL_GUEST_TUTORIAL_MOVE_DELAY_MS,
	SPECIAL_GUEST_TUTORIAL_PATHNAME,
	SPECIAL_GUEST_TUTORIAL_RECIPE_POSITION,
	SPECIAL_GUEST_TUTORIAL_RESET_LABEL,
	SPECIAL_GUEST_TUTORIAL_SCROLL_MOVE_DELAY_MS,
	SPECIAL_GUEST_TUTORIAL_START_DELAY_MS,
} from '@/features/tutorials/specialGuest/constants';

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
	const driverRef = useRef(
		driver({
			allowClose: false,
			popoverClass: '!bg-background dark:!bg-content1 !text-foreground',
			progressText: '第{{current}}步，共{{total}}步',
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
						description: `<div class="space-y-2"><p>跟随指引，搭配一次“完美”评级的稀客套餐。</p><p class="text-tiny text-foreground-500">注：本教程可随时通过“${getPageTitle('/preferences')}”页面的“${SPECIAL_GUEST_TUTORIAL_RESET_LABEL}”按钮再次进入。</p></div>`,
						onPopoverRender(popover) {
							const skipButton = document.createElement('button');
							skipButton.textContent = '跳过';
							skipButton.addEventListener('click', () => {
								driverRef.current.destroy();
								trackEvent(
									trackEvent.category.click,
									'Tutorial Button',
									'Skip'
								);
							});
							const nextButton = document.createElement('button');
							nextButton.textContent = '下一步 →';
							nextButton.addEventListener('click', () => {
								driverRef.current.moveNext();
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
						title: '稀客套餐搭配教程',
					},
				},
				{
					element: '[title="点击：选择【莉格露】"]',
					popover: {
						description: '点击头像，选择【莉格露】作为目标稀客。',
						title: '选择稀客',
					},
				},
				{
					element: '[aria-label="可加冰"]',
					popover: {
						description:
							'点击标签，选中“可加冰”标签。此次教程中，假设莉格露的酒水点单需求为“可加冰”。',
						title: '选择酒水标签',
					},
				},
				{
					element: '[aria-label="酒水选择表格"] [data-key="price"]',
					popover: {
						description: '点击以按售价降序排序酒水。',
						title: '按售价排序',
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_BEVERAGE_POSITION,
					popover: {
						description:
							'点击加号，选择【水獭祭】。选择酒水时，酒水售价尽量不要超过目标稀客的最大持有金。',
						title: '选择目标酒水',
					},
				},
				{
					element: '[aria-label="猎奇"]',
					popover: {
						description:
							'点击标签，选中“猎奇”标签。此次教程中，假设莉格露的料理点单需求为“猎奇”。',
						title: '选择料理标签',
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_RECIPE_POSITION,
					popover: {
						description:
							'点击加号，选择【香炸蝉蜕】。选择料理时，料理售价尽量不要超过目标稀客剩余的最大持有金。',
						title: '选择目标料理',
					},
				},
				{
					element: '[data-key="ingredient"]',
					popover: {
						description:
							'当前套餐评级为绿评“普通”，添加额外食材以提高评级。',
						title: '选择额外食材',
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_EGG_POSITION,
					popover: {
						description:
							'点击图标，加入额外食材【鸡蛋】。加入后套餐评级应为橙评“满意”，继续添加额外食材以提高评级。',
						title: '加入额外食材【鸡蛋】',
					},
				},
				{
					element: SPECIAL_GUEST_TUTORIAL_HONEY_POSITION,
					popover: {
						description:
							'点击图标，加入额外食材【蜂蜜】。加入后套餐评级应为粉评“完美”。',
						title: '加入额外食材【蜂蜜】',
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
						description: `在此处可以查看更多信息，如：稀客的羁绊奖励和符卡效果。点击导航栏中的“设置”按钮可以调整更多偏好项，如：设置游戏中现时的${FOOD_TAG_MAP[DYNAMIC_FOOD_TAG_MAP.popularPositive]}或${FOOD_TAG_MAP[DYNAMIC_FOOD_TAG_MAP.popularNegative]}趋势。`,
						onPopoverRender(popover) {
							const completeButton =
								document.createElement('button');
							completeButton.textContent = '完成';
							completeButton.addEventListener('click', () => {
								driverRef.current.destroy();
								trackEvent(
									trackEvent.category.click,
									'Tutorial Button',
									'Complete'
								);
							});
							popover.footerButtons.append(completeButton);
						},
						title: '更多信息',
					},
				},
			],
		})
	);

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

			if (driverRef.current.isActive()) {
				callback();
			}
		}, SPECIAL_GUEST_TUTORIAL_MOVE_DELAY_MS);
	}, []);

	const moveNext = useCallback(
		(selectors: string, position?: ScrollLogicalPosition) => {
			// The `xl` breakpoint is 1280px.
			if (globalThis.innerWidth >= 1280) {
				driverRef.current.moveNext();
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
					driverRef.current.moveNext();
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
			// The `xl` breakpoint is 1280px.
			if (globalThis.innerWidth >= 1280) {
				driverRef.current.moveTo(index);
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
					driverRef.current.moveTo(index);
				});
			}
		},
		[scheduleMobileScrollMove]
	);

	useEffect(() => {
		if (!driverRef.current.isActive()) {
			return;
		}

		if (currentSpecialGuest !== null && !isGuestSelected.current) {
			isGuestSelected.current = true;
			driverRef.current.moveTo(2);
		} else if (currentBeverage !== null && !isBeverageSelected.current) {
			isBeverageSelected.current = true;
			driverRef.current.moveNext();
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
					driverRef.current.moveNext();
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
			driverRef.current.moveNext();
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
				driverRef.current.moveNext();
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

		if (isCompleted && driverRef.current.isActive()) {
			shouldSkipCompletionOnDestroy.current = true;
			driverRef.current.destroy();
		}

		if (!isAccountSyncReady || hasBlockingAccountModal) {
			if (driverRef.current.isActive()) {
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
			!driverRef.current.isActive()
		) {
			if (currentPathname === SPECIAL_GUEST_TUTORIAL_PATHNAME) {
				handler = setTimeout(() => {
					if (
						!isOverlayIdleForTutorial ||
						driverRef.current.isActive()
					) {
						return;
					}

					const tutorialLease = tryAcquireTutorial({
						onPreempt: () => {
							shouldSkipCompletionOnDestroy.current = true;
							clearTimeout(delayedMoveNextHandler.current);
							delayedMoveNextHandler.current = undefined;
							clearMobileScrollMoveHandlers();
							driverRef.current.destroy();
						},
					});
					if (tutorialLease === null) {
						return;
					}

					tutorialLeaseRef.current = tutorialLease;
					try {
						driverRef.current.drive();
					} catch (error) {
						tutorialLease.release();
						tutorialLeaseRef.current = null;
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
			driverRef.current.destroy();
			tutorialLeaseRef.current?.release();
			tutorialLeaseRef.current = null;
		}

		return () => {
			clearTimeout(handler);
		};
	}, [
		accountBootstrapStatus,
		clearMobileScrollMoveHandlers,
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
