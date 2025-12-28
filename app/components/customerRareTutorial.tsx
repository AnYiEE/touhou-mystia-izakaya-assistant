'use client';

import { useCallback, useEffect, useRef } from 'react';
import { driver } from 'driver.js';

import { usePathname } from '@/hooks';

import { PARAM_INFO } from '@/(pages)/customer-rare/infoButtonBase';
import { trackEvent } from '@/components/analytics';

import { DYNAMIC_TAG_MAP } from '@/data';
import { customerRareStore as customerStore, globalStore } from '@/stores';
import { checkEmpty, getPageTitle } from '@/utilities';

const key = 'customer_rare_tutorial';
const pathname = '/customer-rare';
const resetLabel = '重新进入稀客套餐搭配教程';

export default function CustomerRareTutorial() {
	const { pathname: currentPathname } = usePathname();
	const isTargetPage = currentPathname.startsWith(pathname);

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentCustomerOrder = customerStore.shared.customer.order.use();
	const {
		beverageTag: currentOrderedBeverageTag,
		recipeTag: currentOrderedRecipeTag,
	} = currentCustomerOrder;

	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentBeverageTableDirection =
		customerStore.persistence.beverage.table.sortDescriptor.direction?.use();

	const currentRecipeData = customerStore.shared.recipe.data.use();
	const currentRecipeName = currentRecipeData?.name;
	const currentExtraIngredients = currentRecipeData?.extraIngredients;

	const selectedTabKey = customerStore.shared.tab.use();
	const isIngredientTabSelected = selectedTabKey === 'ingredient';

	// Only obtain the state when first entering the page. Subsequent changes are triggered only by `isTargetPage`，so use `.get()`.
	const dirverState = globalStore.persistence.dirver.get();
	const isCompleted = dirverState.includes(key);

	const BEVERAGE_POSITION =
		'[role="tabpanel"] tbody>tr[data-key="水獭祭"]>:last-child button';
	const EGG_POSITION = '[aria-label="点击：加入额外食材【鸡蛋】，匹配度+1"]';
	const HONEY_POSITION =
		'[aria-label="点击：加入额外食材【蜂蜜】，匹配度+1"]';
	const RECIPE_POSITION =
		'[role="tabpanel"] tbody>tr[data-key="香炸蝉蜕"]>:last-child button';

	const driverRef = useRef(
		driver({
			allowClose: false,
			popoverClass: '!bg-background dark:!bg-content1 !text-foreground',
			progressText: '第{{current}}步，共{{total}}步',
			showButtons: ['close'],
			showProgress: true,

			onDestroyed() {
				if (isTargetPage) {
					globalStore.persistence.dirver.set((prev) => {
						prev.push(key);
					});
				}
			},

			steps: [
				{
					popover: {
						title: '稀客套餐搭配教程', // eslint-disable-next-line sort-keys
						description: `<div class="space-y-2"><p>跟随指引，搭配一次“完美”评级的稀客套餐。</p><p class="text-tiny text-foreground-500">注：本教程可随时通过“${getPageTitle('/preferences')}”页面的“${resetLabel}”按钮再次进入。</p></div>`,
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
					element: '[role="tabpanel"] [data-key="price"]',
					popover: {
						title: '按售价排序', // eslint-disable-next-line sort-keys
						description: '点击以按售价升序排序酒水。',
					},
				},
				{
					element: BEVERAGE_POSITION,
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
					element: RECIPE_POSITION,
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
					element: EGG_POSITION,
					popover: {
						title: '加入额外食材【鸡蛋】', // eslint-disable-next-line sort-keys
						description:
							'点击图标，加入额外食材【鸡蛋】。加入后套餐评级应为橙评“满意”，继续添加额外食材以提高评级。',
					},
				},
				{
					element: HONEY_POSITION,
					popover: {
						title: '加入额外食材【蜂蜜】', // eslint-disable-next-line sort-keys
						description:
							'点击图标，加入额外食材【蜂蜜】。加入后套餐评级应为粉评“完美”。',
					},
				},
				{
					element: '[aria-label="更多信息"]',
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
				setTimeout(() => {
					document.querySelector('main').scrollIntoView(true);
					driverRef.current.moveNext();
				}, 1000);
			}
		},
		[]
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
			currentBeverageTableDirection === 'descending' &&
			!isBeverageTableSorted.current
		) {
			isBeverageTableSorted.current = true;
			moveNext(BEVERAGE_POSITION, 'nearest');
		} else if (
			currentOrderedBeverageTag !== null &&
			!hasOrderedBeverageTag.current
		) {
			hasOrderedBeverageTag.current = true;
			driverRef.current.moveNext();
		} else if (
			currentRecipeName !== undefined &&
			!isRecipeSelected.current
		) {
			isRecipeSelected.current = true;
			driverRef.current.moveNext();
		} else if (
			currentExtraIngredients !== undefined &&
			!checkEmpty(currentExtraIngredients)
		) {
			if (
				currentExtraIngredients.includes('鸡蛋') &&
				!hasExtraEgg.current
			) {
				hasExtraEgg.current = true;
				moveNext(HONEY_POSITION);
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
			moveNext(RECIPE_POSITION, 'nearest');
		} else if (isIngredientTabSelected && !isInIngredientTab.current) {
			isInIngredientTab.current = true;
			moveNext(EGG_POSITION);
		}
	}, [
		currentBeverageName,
		currentBeverageTableDirection,
		currentCustomerName,
		currentExtraIngredients,
		currentOrderedBeverageTag,
		currentOrderedRecipeTag,
		currentRecipeName,
		isIngredientTabSelected,
		moveNext,
	]);

	useEffect(() => {
		if (isTargetPage && !isCompleted && !driverRef.current.isActive()) {
			if (currentPathname === pathname) {
				setTimeout(() => {
					driverRef.current.drive();
					trackEvent(
						trackEvent.category.click,
						'Tutorial Button',
						'Start'
					);
				}, 1000);
			} else if (!new URLSearchParams(location.search).has(PARAM_INFO)) {
				location.href = pathname;
			}
		}
		if (!isTargetPage) {
			driverRef.current.destroy();
		}
	}, [currentPathname, isCompleted, isTargetPage]);

	return null;
}

export {
	pathname as customerRareTutorialPathname,
	resetLabel as customerRareTutorialResetLabel,
	key as customerRareTutorialStoreKey,
};
