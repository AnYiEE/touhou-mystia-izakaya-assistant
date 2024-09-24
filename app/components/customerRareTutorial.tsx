import {useEffect, useRef} from 'react';
import {driver} from 'driver.js';

import {usePathname} from 'next/navigation';

import {type TSitePath} from '@/configs';
import {TAG_POPULAR_NEGATIVE, TAG_POPULAR_POSITIVE} from '@/data';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {getPageTitle} from '@/utils';

const key = 'customer_rare_tutorial';
const pathname = '/customer-rare';
const resetLabel = '重新进入稀客套餐搭配教程';

export default function CustomerRareTutorial() {
	const currentPathname = usePathname() as TSitePath;
	const isTargetPage = currentPathname === pathname;

	const currentCustomerName = customerStore.shared.customer.data.use()?.name;
	const currentCustomerOrder = customerStore.shared.customer.order.use();
	const {beverageTag: currentOrderedBeverageTag, recipeTag: currentOrderedRecipeTag} = currentCustomerOrder;

	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentBeverageTableDirection = customerStore.shared.beverage.sortDescriptor.direction?.use();

	const currentRecipeData = customerStore.shared.recipe.data.use();
	const currentRecipeName = currentRecipeData?.name;
	const currentExtraIngredients = currentRecipeData?.extraIngredients;

	const selectedTabKey = customerStore.shared.tab.use();
	const isIngredientTabSelected = selectedTabKey === 'ingredient';

	// Only obtain the state when first entering the page. Subsequent changes are triggered only by `isTargetPage`，so use `.get()`.
	const dirverState = globalStore.persistence.dirver.get();
	const isCompleted = dirverState.includes(key);

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
						description: `<div class="space-y-2"><p>跟随指引，搭配一次“完美”评级的稀客套餐。</p><p class="text-xs text-foreground-500">注：本教程可随时通过“${getPageTitle('/preferences')}”页面的“${resetLabel}”按钮再次进入。</p></div>`,
						onPopoverRender(popover) {
							const skipButton = document.createElement('button');
							skipButton.textContent = '跳过';
							skipButton.addEventListener('click', driverRef.current.destroy);
							const nextButton = document.createElement('button');
							nextButton.textContent = '下一步 →';
							nextButton.addEventListener('click', driverRef.current.moveNext);
							popover.footerButtons.append(skipButton, nextButton);
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
						description: '点击标签，选中“可加冰”标签。此次教程中，假设莉格露的酒水点单需求为“可加冰”。',
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
					element: '[role="tabpanel"] tbody>tr[data-key="水獭祭"]>:last-child button',
					popover: {
						title: '选择目标酒水', // eslint-disable-next-line sort-keys
						description: '点击加号，选择【水獭祭】。选择酒水时，酒水售价尽量不要超过目标稀客的最大持有金。',
					},
				},
				{
					element: '[aria-label="猎奇"]',
					popover: {
						title: '选择料理标签', // eslint-disable-next-line sort-keys
						description: '点击标签，选中“猎奇”标签。此次教程中，假设莉格露的料理点单需求为“猎奇”。',
					},
				},
				{
					element: '[role="tabpanel"] tbody>tr[data-key="香炸蝉蜕"]>:last-child button',
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
						description: '当前套餐评级为绿评“普通”，添加额外食材以提高评级。',
					},
				},
				{
					element: '[aria-label="点击：加入额外食材【鸡蛋】，匹配度+1"]',
					popover: {
						title: '加入额外食材【鸡蛋】', // eslint-disable-next-line sort-keys
						description:
							'点击图标，加入额外食材【鸡蛋】。加入后套餐评级应为橙评“满意”，继续添加额外食材以提高评级。',
					},
				},
				{
					element: '[aria-label="点击：加入额外食材【蜂蜜】，匹配度+1"]',
					popover: {
						title: '加入额外食材【蜂蜜】', // eslint-disable-next-line sort-keys
						description: '点击图标，加入额外食材【蜂蜜】。加入后套餐评级应为粉评“完美”。',
					},
				},
				{
					element: '[aria-label="更多信息"]',
					popover: {
						title: '更多信息', // eslint-disable-next-line sort-keys
						description: `在此处可以查看更多信息，如：稀客的羁绊奖励和符卡效果。点击导航栏中的“设置”按钮可以调整更多偏好项，如：设置游戏中现时的${TAG_POPULAR_POSITIVE}或${TAG_POPULAR_NEGATIVE}标签。`,
						onPopoverRender(popover) {
							const completeButton = document.createElement('button');
							completeButton.textContent = '完成';
							completeButton.addEventListener('click', () => {
								// Restore user preferences.
								customerStore.persistence.customer.orderLinkedFilter.set(
									customerStore.shared.customer.orderLinkedFilter.get()
								);
								driverRef.current.destroy();
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

	useEffect(() => {
		if (!driverRef.current.isActive()) {
			return;
		}

		if (currentCustomerName && !isCustomerSelected.current) {
			isCustomerSelected.current = true;
			driverRef.current.moveTo(2);
		}

		if (currentBeverageName && !isBeverageSelected.current) {
			isBeverageSelected.current = true;
			driverRef.current.moveNext();
		}
		if (currentBeverageTableDirection === 'descending' && !isBeverageTableSorted.current) {
			isBeverageTableSorted.current = true;
			driverRef.current.moveNext();
		}
		if (currentOrderedBeverageTag && !hasOrderedBeverageTag.current) {
			hasOrderedBeverageTag.current = true;
			driverRef.current.moveNext();
		}

		if (currentRecipeName && !isRecipeSelected.current) {
			isRecipeSelected.current = true;
			driverRef.current.moveNext();
		}
		if (currentExtraIngredients && currentExtraIngredients.length > 0) {
			if (currentExtraIngredients.includes('鸡蛋') && !hasExtraEgg.current) {
				hasExtraEgg.current = true;
				driverRef.current.moveNext();
			}
			if (currentExtraIngredients.includes('蜂蜜') && !hasExtraHoney.current) {
				hasExtraHoney.current = true;
				driverRef.current.moveNext();
			}
		}
		if (currentOrderedRecipeTag && !hasOrderedRecipeTag.current) {
			hasOrderedRecipeTag.current = true;
			driverRef.current.moveNext();
		}

		if (isIngredientTabSelected && !isInIngredientTab.current) {
			isInIngredientTab.current = true;
			driverRef.current.moveNext();
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
	]);

	useEffect(() => {
		if (isTargetPage && !isCompleted && !driverRef.current.isActive()) {
			driverRef.current.drive();
		}
		if (!isTargetPage) {
			driverRef.current.destroy();
		}
	}, [isCompleted, isTargetPage]);

	return null;
}

export {
	pathname as customerRareTutorialPathname,
	resetLabel as customerRareTutorialResetLabel,
	key as customerRareTutorialStoreKey,
};
