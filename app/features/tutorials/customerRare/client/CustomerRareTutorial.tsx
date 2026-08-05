'use client';

import { driver } from 'driver.js';
import { useCallback, useEffect, useRef } from 'react';

import { DYNAMIC_TAG_MAP } from '@/domain/data/tags/tagFacts';

import { accountStore } from '@/features/account/client/state/accountStore';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';
import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';
import { CUSTOMER_INFO_QUERY_PARAM } from '@/features/catalog/customers/shared/navigation';
import {
	consumeCustomerRareTutorialAllowedPathname,
	useCustomerRareTutorialAllowedPathname,
} from '@/features/globalSearch/client/customerRareTutorialHandoff';
import {
	tryAcquireTutorial,
	useOverlayIdleForTutorial,
} from '@/features/overlays/client';
import type { ITutorialLease } from '@/features/overlays/contracts';
import {
	CUSTOMER_RARE_TUTORIAL_BEVERAGE_POSITION,
	CUSTOMER_RARE_TUTORIAL_BEVERAGE_STEP_INDEX,
	CUSTOMER_RARE_TUTORIAL_EGG_POSITION,
	CUSTOMER_RARE_TUTORIAL_HONEY_POSITION,
	CUSTOMER_RARE_TUTORIAL_MOVE_DELAY_MS,
	CUSTOMER_RARE_TUTORIAL_PATHNAME,
	CUSTOMER_RARE_TUTORIAL_RECIPE_POSITION,
	CUSTOMER_RARE_TUTORIAL_RESET_LABEL,
	CUSTOMER_RARE_TUTORIAL_SCROLL_MOVE_DELAY_MS,
	CUSTOMER_RARE_TUTORIAL_START_DELAY_MS,
} from '@/features/tutorials/customerRare/constants';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import {
	completeCustomerRareTutorial,
	useCustomerRareTutorialCompleted,
} from './tutorialProgress';

export default function CustomerRareTutorial() {
	const isOverlayIdleForTutorial = useOverlayIdleForTutorial();
	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const accountConflicts = accountStore.shared.sync.conflicts.use();
	const accountIsLoggedIn = accountStore.shared.isLoggedIn.use();
	const accountLastSyncedAt = accountStore.shared.sync.lastSyncedAt.use();
	const accountUser = accountStore.shared.user.use();
	const passwordMustChange = accountStore.shared.passwordMustChange.use();

	const globalSearchCustomerRareTutorialAllowedPathname =
		useCustomerRareTutorialAllowedPathname();

	const { pathname: currentPathname } = usePathname();
	const isTargetPage = currentPathname.startsWith(
		CUSTOMER_RARE_TUTORIAL_PATHNAME
	);

	const currentCustomerName = customerRareStore.shared.customer.name.use();
	const currentCustomerOrder = customerRareStore.shared.customer.order.use();
	const {
		beverageTag: currentOrderedBeverageTag,
		recipeTag: currentOrderedRecipeTag,
	} = currentCustomerOrder;

	const currentBeverageName = customerRareStore.shared.beverage.name.use();
	const currentBeverageTableSortDescriptor =
		customerRareStore.persistence.beverage.table.sortDescriptor.use();
	const isBeverageTableSortedByPriceAscending =
		currentBeverageTableSortDescriptor.column === 'price' &&
		currentBeverageTableSortDescriptor.direction === 'descending';

	const currentRecipeData = customerRareStore.shared.recipe.data.use();
	const currentRecipeName = currentRecipeData?.name;
	const currentExtraIngredients = currentRecipeData?.extraIngredients;

	const selectedTabKey = customerRareStore.shared.tab.use();
	const isIngredientTabSelected = selectedTabKey === 'ingredient';

	const isCompleted = useCustomerRareTutorialCompleted();
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
		}, CUSTOMER_RARE_TUTORIAL_SCROLL_MOVE_DELAY_MS);
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
						CUSTOMER_RARE_TUTORIAL_PATHNAME
					)
				) {
					completeCustomerRareTutorial();
				}
			},

			steps: [
				{
					popover: {
						title: '稀客套餐搭配教程', // eslint-disable-next-line sort-keys
						description: `<div class="space-y-2"><p>跟随指引，搭配一次“完美”评级的稀客套餐。</p><p class="text-tiny text-foreground-500">注：本教程可随时通过“${getPageTitle('/preferences')}”页面的“${CUSTOMER_RARE_TUTORIAL_RESET_LABEL}”按钮再次进入。</p></div>`,
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
					},
				},
				{
					element: '[title="点击：选择【莉格露】"]',
					popover: {
						title: '选择稀客', // eslint-disable-next-line sort-keys
						description: '点击头像，选择【莉格露】作为目标稀客。',
					},
				},
				{
					element: '[aria-label="可加冰"]',
					popover: {
						title: '选择酒水标签', // eslint-disable-next-line sort-keys
						description:
							'点击标签，选中“可加冰”标签。此次教程中，假设莉格露的酒水点单需求为“可加冰”。',
					},
				},
				{
					element: '[aria-label="酒水选择表格"] [data-key="price"]',
					popover: {
						title: '按售价排序', // eslint-disable-next-line sort-keys
						description: '点击以按售价降序排序酒水。',
					},
				},
				{
					element: CUSTOMER_RARE_TUTORIAL_BEVERAGE_POSITION,
					popover: {
						title: '选择目标酒水', // eslint-disable-next-line sort-keys
						description:
							'点击加号，选择【水獭祭】。选择酒水时，酒水售价尽量不要超过目标稀客的最大持有金。',
					},
				},
				{
					element: '[aria-label="猎奇"]',
					popover: {
						title: '选择料理标签', // eslint-disable-next-line sort-keys
						description:
							'点击标签，选中“猎奇”标签。此次教程中，假设莉格露的料理点单需求为“猎奇”。',
					},
				},
				{
					element: CUSTOMER_RARE_TUTORIAL_RECIPE_POSITION,
					popover: {
						title: '选择目标料理', // eslint-disable-next-line sort-keys
						description:
							'点击加号，选择【香炸蝉蜕】。选择料理时，料理售价尽量不要超过目标稀客剩余的最大持有金。',
					},
				},
				{
					element: '[data-key="ingredient"]',
					popover: {
						title: '选择额外食材', // eslint-disable-next-line sort-keys
						description:
							'当前套餐评级为绿评“普通”，添加额外食材以提高评级。',
					},
				},
				{
					element: CUSTOMER_RARE_TUTORIAL_EGG_POSITION,
					popover: {
						title: '加入额外食材【鸡蛋】', // eslint-disable-next-line sort-keys
						description:
							'点击图标，加入额外食材【鸡蛋】。加入后套餐评级应为橙评“满意”，继续添加额外食材以提高评级。',
					},
				},
				{
					element: CUSTOMER_RARE_TUTORIAL_HONEY_POSITION,
					popover: {
						title: '加入额外食材【蜂蜜】', // eslint-disable-next-line sort-keys
						description:
							'点击图标，加入额外食材【蜂蜜】。加入后套餐评级应为粉评“完美”。',
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
								'Customer info tutorial target is missing.'
							);
						}
						return target;
					},
					popover: {
						title: '更多信息', // eslint-disable-next-line sort-keys
						description: `在此处可以查看更多信息，如：稀客的羁绊奖励和符卡效果。点击导航栏中的“设置”按钮可以调整更多偏好项，如：设置游戏中现时的${DYNAMIC_TAG_MAP.popularPositive}或${DYNAMIC_TAG_MAP.popularNegative}趋势。`,
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
					},
				},
			],
		})
	);

	const isCustomerSelected = useRef(false);

	const isBeverageSelected = useRef(false);
	const isBeverageTableSorted = useRef(false);
	const hasOrderedBeverageTag = useRef(false);

	const isRecipeSelected = useRef(false);
	const hasExtraEgg = useRef(false);
	const hasExtraHoney = useRef(false);
	const hasOrderedRecipeTag = useRef(false);

	const isInIngredientTab = useRef(false);

	const delayedMoveNext = useCallback((callback: () => void) => {
		clearTimeout(delayedMoveNextHandler.current);
		delayedMoveNextHandler.current = setTimeout(() => {
			delayedMoveNextHandler.current = undefined;

			if (driverRef.current.isActive()) {
				callback();
			}
		}, CUSTOMER_RARE_TUTORIAL_MOVE_DELAY_MS);
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

		if (currentCustomerName !== null && !isCustomerSelected.current) {
			isCustomerSelected.current = true;
			driverRef.current.moveTo(2);
		} else if (
			currentBeverageName !== null &&
			!isBeverageSelected.current
		) {
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
						CUSTOMER_RARE_TUTORIAL_BEVERAGE_STEP_INDEX,
						CUSTOMER_RARE_TUTORIAL_BEVERAGE_POSITION,
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
			moveNext(CUSTOMER_RARE_TUTORIAL_BEVERAGE_POSITION, 'nearest');
		} else if (
			currentRecipeName !== undefined &&
			!isRecipeSelected.current
		) {
			isRecipeSelected.current = true;
			driverRef.current.moveNext();
		} else if (
			currentExtraIngredients !== undefined &&
			!checkLengthEmpty(currentExtraIngredients)
		) {
			if (
				currentExtraIngredients.includes('鸡蛋') &&
				!hasExtraEgg.current
			) {
				hasExtraEgg.current = true;
				moveNext(CUSTOMER_RARE_TUTORIAL_HONEY_POSITION);
			} else if (
				currentExtraIngredients.includes('蜂蜜') &&
				!hasExtraHoney.current
			) {
				hasExtraHoney.current = true;
				driverRef.current.moveNext();
			}
		} else if (
			currentOrderedRecipeTag !== null &&
			!hasOrderedRecipeTag.current
		) {
			hasOrderedRecipeTag.current = true;
			delayedMoveNext(() => {
				moveNext(CUSTOMER_RARE_TUTORIAL_RECIPE_POSITION, 'nearest');
			});
		} else if (isIngredientTabSelected && !isInIngredientTab.current) {
			isInIngredientTab.current = true;
			delayedMoveNext(() => {
				moveNext(CUSTOMER_RARE_TUTORIAL_EGG_POSITION);
			});
		}
	}, [
		currentBeverageName,
		currentCustomerName,
		currentExtraIngredients,
		currentOrderedBeverageTag,
		currentOrderedRecipeTag,
		currentRecipeName,
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

			isCustomerSelected.current = false;
			isBeverageSelected.current = false;
			isBeverageTableSorted.current = false;
			hasOrderedBeverageTag.current = false;
			isRecipeSelected.current = false;
			hasExtraEgg.current = false;
			hasExtraHoney.current = false;
			hasOrderedRecipeTag.current = false;
			isInIngredientTab.current = false;

			return () => {
				clearTimeout(handler);
			};
		}

		if (
			globalSearchCustomerRareTutorialAllowedPathname === currentPathname
		) {
			allowedGlobalSearchPathname.current = currentPathname;
			consumeCustomerRareTutorialAllowedPathname();
		}

		const isAllowedGlobalSearchPathname =
			currentPathname !== CUSTOMER_RARE_TUTORIAL_PATHNAME &&
			allowedGlobalSearchPathname.current === currentPathname;
		const isAllowedSharedInfoPathname = new URLSearchParams(
			location.search
		).has(CUSTOMER_INFO_QUERY_PARAM);

		if (
			accountBootstrapStatus !== 'unknown' &&
			isTargetPage &&
			!isCompleted &&
			!driverRef.current.isActive()
		) {
			if (currentPathname === CUSTOMER_RARE_TUTORIAL_PATHNAME) {
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
				}, CUSTOMER_RARE_TUTORIAL_START_DELAY_MS);
			} else if (
				!isAllowedGlobalSearchPathname &&
				!isAllowedSharedInfoPathname
			) {
				location.href = CUSTOMER_RARE_TUTORIAL_PATHNAME;
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
		globalSearchCustomerRareTutorialAllowedPathname,
		hasBlockingAccountModal,
		isAccountSyncReady,
		isCompleted,
		isOverlayIdleForTutorial,
		isTargetPage,
	]);

	return null;
}
