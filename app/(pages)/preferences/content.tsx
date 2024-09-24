'use client';

import {memo, useCallback} from 'react';
import {twJoin} from 'tailwind-merge';

import {Button, ScrollShadow, Select, SelectItem, type Selection, Switch} from '@nextui-org/react';

import DataManager, {type IDataManagerProps} from './dataManager';
import SwitchItem from './switchItem';
import H1 from '@/components/h1';
import H2 from '@/components/h2';
import H3 from '@/components/h3';

import {TAG_POPULAR_NEGATIVE, TAG_POPULAR_POSITIVE} from '@/data';
import {customerRareStore as customerStore, globalStore} from '@/stores';

interface IProps extends IDataManagerProps {}

export default memo<IProps>(function Content({onModalClose}) {
	const isOrderLinkedFilter = customerStore.persistence.customer.orderLinkedFilter.use();
	const isShowTagDescription = customerStore.persistence.customer.showTagDescription.use();

	const popularTags = globalStore.popularTags.get();
	const isNegativePopularTag = globalStore.persistence.popular.isNegative.use();
	const selectedPopularTag = globalStore.selectedPopularTag.use();

	const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();
	const isShowTachie = globalStore.persistence.tachie.use();
	const isShowTagsTooltip = globalStore.persistence.customerCardTagsTooltip.use();
	const isVibrateEnabled = globalStore.persistence.vibrate.use();

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
					{TAG_POPULAR_NEGATIVE}
					<Switch
						isSelected={isNegativePopularTag}
						size="sm"
						onValueChange={onIsNegativePopularTagChange}
						aria-label={`设置为${isNegativePopularTag ? TAG_POPULAR_POSITIVE : TAG_POPULAR_NEGATIVE}`}
						classNames={{
							base: 'ml-2',
							wrapper: 'bg-primary',
						}}
					/>
					{TAG_POPULAR_NEGATIVE}
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
							popoverProps={{
								motionProps: isShowBackgroundImage
									? {
											initial: {},
										}
									: {},
							}}
							classNames={{
								base: 'w-28',
								listboxWrapper: twJoin(
									'[&_li]:transition-background',
									isShowBackgroundImage &&
										'focus:[&_li]:!bg-default-200/40 data-[focus=true]:[&_li]:!bg-default-200/40 data-[hover=true]:[&_li]:!bg-default-200/40'
								),
								popoverContent: twJoin(isShowBackgroundImage && 'bg-content1/70 backdrop-blur-lg'),
								trigger: twJoin(
									'transition-background',
									onModalClose || !isShowBackgroundImage
										? 'bg-default-50 data-[hover=true]:bg-default-100'
										: 'bg-default-100/40 backdrop-blur data-[hover=true]:bg-default-200/40'
								),
							}}
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
						className={twJoin(isShowBackgroundImage && 'backdrop-blur')}
					>
						清除选择
					</Button>
				</div>
			</div>
			<H3>外观</H3>
			<div className="space-y-2">
				<SwitchItem
					isSelected={isShowBackgroundImage}
					onValueChange={globalStore.persistence.backgroundImage.set}
					aria-label={`${isShowBackgroundImage ? '关闭' : '开启'}全局背景图片和磨砂效果`}
				>
					全局背景图片和磨砂效果
				</SwitchItem>
				<SwitchItem
					isSelected={isShowTachie}
					onValueChange={globalStore.persistence.tachie.set}
					aria-label={`${isShowTagDescription ? '隐藏' : '显示'}顾客页面立绘`}
				>
					顾客页面右下角的立绘（宽屏可见）
				</SwitchItem>
			</div>
			<H3>体验</H3>
			<div className="space-y-2">
				<SwitchItem
					isSelected={isVibrateEnabled}
					onValueChange={globalStore.persistence.vibrate.set}
					aria-label={`${isVibrateEnabled ? '关闭' : '开启'}操作震动反馈`}
				>
					部分操作的震动反馈（需设备和浏览器支持）
				</SwitchItem>
				<SwitchItem
					isSelected={isShowTagsTooltip}
					onValueChange={globalStore.persistence.customerCardTagsTooltip.set}
					aria-label={`${isShowTagsTooltip ? '隐藏' : '显示'}标签浮动提示`}
				>
					顾客卡片中标签的浮动提示（鼠标悬停可见）
				</SwitchItem>
			</div>
			<H2>稀客页面</H2>
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
