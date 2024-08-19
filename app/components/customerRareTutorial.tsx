import {memo, useEffect, useMemo, useRef} from 'react';
import {usePathname} from 'next/navigation';
import {driver} from 'driver.js';

import {customerRareStore as customerStore, globalStore} from '@/stores';
import {getPageTitle} from '@/utils';

const key = 'customer_rare_tutorial';
const pathname = '/customer-rare';
const resetLabel = '重新进入稀客套餐搭配教程';

export default memo(function CustomerRareTutorial() {
	const currentPathname = usePathname();

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

	const dirverState = globalStore.persistence.dirver.get();
	const isCompleted = useMemo(() => dirverState.includes(key), [dirverState]);

	const isTargetPage = currentPathname === pathname;

	const driverRef = useRef(
		driver({
			allowClose: false,
			popoverClass: '!bg-background-50 dark:!bg-foreground-50 !text-foreground',
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
					element: '[title="选择莉格露"]',
					popover: {
						title: '选择稀客', // eslint-disable-next-line sort-keys
						description: '点击头像，选择莉格露作为目标稀客。',
					},
				},
				{
					element: '[aria-label="可加冰"]',
					popover: {
						title: '选择酒水标签', // eslint-disable-next-line sort-keys
						description: '点击标签，选中“可加冰”标签。此次教程中，假设莉格露点单“可加冰”的酒水。',
					},
				},
				{
					element: '[data-key="price"]',
					popover: {
						title: '按价格排序', // eslint-disable-next-line sort-keys
						description: '点击两次，按价格升序排序酒水。',
					},
				},
				{
					element: 'tbody>tr[data-key="水獭祭"]>:last-child button',
					popover: {
						title: '选择目标酒水', // eslint-disable-next-line sort-keys
						description: '点击加号，选择水獭祭。选择酒水时，酒水售价尽量不要超过目标稀客最大持有金。',
					},
				},
				{
					element: '[aria-label="猎奇"]',
					popover: {
						title: '选择料理标签', // eslint-disable-next-line sort-keys
						description: '点击标签，选中“猎奇”标签。此次教程中，假设莉格露点单“猎奇”的料理。',
					},
				},
				{
					element: 'tbody>tr[data-key="香炸蝉蜕"]>:last-child button',
					popover: {
						title: '选择目标料理', // eslint-disable-next-line sort-keys
						description:
							'点击加号，选择香炸蝉蜕。选择料理时，料理售价尽量不要超过目标稀客剩余的最大持有金。',
					},
				},
				{
					element: '[data-key="ingredient"]',
					popover: {
						title: '选择额外食材', // eslint-disable-next-line sort-keys
						description: '当前套餐评级为“普通”，添加额外食材以提高评级。',
					},
				},
				{
					element: '[title="加入鸡蛋"]',
					popover: {
						title: '加入额外食材：鸡蛋', // eslint-disable-next-line sort-keys
						description: '点击图标，加入鸡蛋。加入后套餐评级应为“满意”，继续添加额外食材以提高评级。',
					},
				},
				{
					element: '[title="加入蜂蜜"]',
					popover: {
						title: '加入额外食材：蜂蜜', // eslint-disable-next-line sort-keys
						description: '点击图标，加入蜂蜜。加入后套餐评级应为“完美”。',
					},
				},
				{
					element: '[aria-label="更多信息"]',
					popover: {
						title: '更多信息', // eslint-disable-next-line sort-keys
						description:
							'在此处可以查看更多信息。点击导航栏中的“设置”按钮可以调整更多偏好项，如：设置游戏中现时的流行喜爱或流行厌恶标签。',
						onPopoverRender(popover) {
							const completeButton = document.createElement('button');
							completeButton.textContent = '完成';
							completeButton.addEventListener('click', () => {
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
		if (currentExtraIngredients) {
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
});

export {
	pathname as customerRareTutorialPathname,
	resetLabel as customerRareTutorialResetLabel,
	key as customerRareTutorialStoreKey,
};
