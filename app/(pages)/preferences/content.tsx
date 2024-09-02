'use client';

import {memo, useCallback} from 'react';

import {Button, ScrollShadow, Select, SelectItem, type Selection, Switch} from '@nextui-org/react';

import DataManager from './dataManager';
import SwitchItem from './switchItem';
import H1 from '@/components/h1';
import H2 from '@/components/h2';
import H3 from '@/components/h3';

import {customerRareStore as customerStore, globalStore} from '@/stores';

interface IProps {
	onModalClose: (() => void) | undefined;
}

export default memo<Partial<IProps>>(function Content({onModalClose}) {
	const isOrderLinkedFilter = customerStore.persistence.customer.orderLinkedFilter.use();
	const isShowTachie = customerStore.persistence.customer.showTachie.use();
	const isShowTagDescription = customerStore.persistence.customer.showTagDescription.use();

	const popularTags = globalStore.popularTags.get();
	const isNegativePopularTag = globalStore.persistence.popular.isNegative.use();
	const selectedPopularTag = globalStore.selectedPopularTag.use();
	const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();
	const isShowTagsTooltip = globalStore.persistence.customerCardTagsTooltip.use();

	const resetRecipeTablePage = useCallback(() => {
		customerStore.shared.recipe.page.set(1);
	}, []);

	const onIsNegativePopularTagChange = useCallback(
		(value: boolean) => {
			globalStore.persistence.popular.isNegative.set(value);
			resetRecipeTablePage();
		},
		[resetRecipeTablePage]
	);

	const onSelectedPopularTagChange = useCallback(
		(value: Selection) => {
			globalStore.selectedPopularTag.set(value);
			resetRecipeTablePage();
		},
		[resetRecipeTablePage]
	);

	const onClearPopularTagButtonPress = useCallback(() => {
		globalStore.selectedPopularTag.set(new Set());
		resetRecipeTablePage();
	}, [resetRecipeTablePage]);

	return (
		<div>
			<H1 isFirst subTitle="以下所有的更改都会即时生效">
				设置
			</H1>
			<H2 className="mt-0">全局设置</H2>
			<div className="space-y-2">
				<SwitchItem
					isSelected={isShowBackgroundImage}
					onValueChange={globalStore.persistence.backgroundImage.set}
					aria-label={`${isShowBackgroundImage ? '隐藏' : '显示'}全局背景图片`}
				>
					全局背景图片
				</SwitchItem>
				<SwitchItem
					isSelected={isShowTagsTooltip}
					onValueChange={globalStore.persistence.customerCardTagsTooltip.set}
					aria-label={`${isShowTagsTooltip ? '隐藏' : '显示'}标签浮动提示`}
				>
					顾客卡片中标签的浮动提示
				</SwitchItem>
			</div>
			<H3
				subTitle={<ScrollShadow hideScrollBar>正确设置游戏中现时流行的标签可以使套餐评级更为准确</ScrollShadow>}
				classNames={{
					subTitle: 'whitespace-nowrap',
				}}
			>
				流行标签
			</H3>
			<div className="space-y-2">
				<div className="flex items-center">
					<span className="font-medium">类别：</span>
					流行喜爱
					<Switch
						isSelected={isNegativePopularTag}
						size="sm"
						onValueChange={onIsNegativePopularTagChange}
						aria-label={`设置为流行${isNegativePopularTag ? '喜爱' : '厌恶'}`}
						classNames={{
							base: 'ml-2',
							wrapper: 'bg-primary',
						}}
					/>
					流行厌恶
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center">
						<span className="font-medium">标签：</span>
						<Select
							items={popularTags}
							defaultSelectedKeys={selectedPopularTag}
							selectedKeys={selectedPopularTag}
							size="sm"
							variant="flat"
							onSelectionChange={onSelectedPopularTagChange}
							aria-label="选择游戏中现时流行的标签"
							title="选择游戏中现时流行的标签"
							className="w-28"
						>
							{({value}) => <SelectItem key={value}>{value}</SelectItem>}
						</Select>
					</div>
					<Button
						color="primary"
						isDisabled={selectedPopularTag.has(null as never)}
						size="sm"
						variant="flat"
						onPress={onClearPopularTagButtonPress}
					>
						清除选择
					</Button>
				</div>
			</div>
			<H2>稀客页面</H2>
			<SwitchItem
				isSelected={isShowTachie}
				onValueChange={customerStore.persistence.customer.showTachie.set}
				aria-label={`${isShowTagDescription ? '隐藏' : '显示'}稀客立绘`}
			>
				于右下角显示立绘（宽屏可见）
			</SwitchItem>
			<H3>稀客卡片</H3>
			<div className="space-y-2">
				<SwitchItem
					isSelected={isOrderLinkedFilter}
					onValueChange={customerStore.persistence.customer.orderLinkedFilter.set}
					aria-label={`选择点单需求标签的同时${isOrderLinkedFilter ? '不' : ''}筛选表格`}
				>
					选择点单需求的同时筛选表格
				</SwitchItem>
				<SwitchItem
					isSelected={isShowTagDescription}
					onValueChange={customerStore.persistence.customer.showTagDescription.set}
					aria-label={`${isShowTagDescription ? '隐藏' : '显示'}料理标签描述`}
				>
					显示料理标签所对应的关键词
				</SwitchItem>
			</div>
			<DataManager onModalClose={onModalClose} />
		</div>
	);
});
