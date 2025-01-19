'use client';

import {memo, useCallback} from 'react';

import {useRouter} from 'next/navigation';
import {useVibrate} from '@/hooks';

import {Select, SelectItem} from '@heroui/select';
import {type Selection} from '@heroui/table';

import {Button, Switch, cn, useMotionProps, useReducedMotion} from '@/design/ui/components';

import DataManager, {type IDataManagerProps} from './dataManager';
import SwitchItem from './switchItem';
import Heading from '@/components/heading';
import Sprite from '@/components/sprite';

import {TAG_POPULAR_NEGATIVE, TAG_POPULAR_POSITIVE} from '@/data';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {toSet} from '@/utilities';

interface IProps extends IDataManagerProps {}

export default memo<IProps>(function Content({onModalClose}) {
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const router = useRouter();
	const vibrate = useVibrate();

	const isOrderLinkedFilter = customerStore.persistence.customer.orderLinkedFilter.use();
	const isShowTagDescription = customerStore.persistence.customer.showTagDescription.use();

	const isFamousShop = globalStore.persistence.famousShop.use();
	const popularTags = globalStore.popularTags.get();
	const isPopularTrendNegative = globalStore.persistence.popularTrend.isNegative.use();
	const selectedPopularTag = globalStore.selectedPopularTag.use();

	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const isShowTachie = globalStore.persistence.tachie.use();
	const isShowTagsTooltip = globalStore.persistence.customerCardTagsTooltip.use();
	const isVibrateEnabled = globalStore.persistence.vibrate.use();

	const resetRecipeTablePage = useCallback(() => {
		customerStore.shared.recipe.page.set(1);
	}, []);

	const onIsFamousShopChange = useCallback(
		(value: boolean) => {
			globalStore.persistence.famousShop.set(value);
			resetRecipeTablePage();
		},
		[resetRecipeTablePage]
	);

	const onIsPopularTrendNegativeChange = useCallback(
		(value: boolean) => {
			globalStore.persistence.popularTrend.isNegative.set(value);
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

	const onClearPopularTrendButtonPress = useCallback(() => {
		vibrate();
		globalStore.persistence.popularTrend.isNegative.set(false);
		globalStore.selectedPopularTag.set(toSet());
		resetRecipeTablePage();
	}, [resetRecipeTablePage, vibrate]);

	const handleIsHighAppearanceChange = useCallback(
		(value: boolean) => {
			globalStore.persistence.highAppearance.set(value);
			if (onModalClose === undefined) {
				location.reload();
			} else {
				onModalClose();
				// Wait for the modal to close (the animate will take 300ms).
				setTimeout(() => {
					router.back();
					location.reload();
				}, 500);
			}
		},
		[onModalClose, router]
	);

	return (
		<div>
			<Heading isFirst subTitle="以下所有的更改都会即时生效">
				设置
			</Heading>
			<Heading as="h2" className="mt-0">
				全局设置
			</Heading>
			<Heading as="h3" subTitle="正确设置游戏中现时的流行趋势可以使套餐评级更为准确">
				流行趋势
			</Heading>
			<div className="space-y-2">
				<div className="flex items-center">
					<span className="font-medium">类别：</span>
					{TAG_POPULAR_POSITIVE}
					<Switch
						isSelected={isPopularTrendNegative}
						size="sm"
						onValueChange={onIsPopularTrendNegativeChange}
						aria-label={`设置为${isPopularTrendNegative ? TAG_POPULAR_POSITIVE : TAG_POPULAR_NEGATIVE}`}
						classNames={{
							base: 'mx-2',
							wrapper: 'bg-primary',
						}}
					/>
					{TAG_POPULAR_NEGATIVE}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center">
						<span className="font-medium">标签：</span>
						<Select
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={popularTags}
							selectedKeys={selectedPopularTag}
							size="sm"
							variant="flat"
							onSelectionChange={onSelectedPopularTagChange}
							aria-label="选择游戏中现时流行的标签"
							title="选择游戏中现时流行的标签"
							popoverProps={{
								motionProps: popoverMotionProps,
							}}
							classNames={{
								base: 'w-28',
								listboxWrapper: cn(
									'[&_li]:transition-background motion-reduce:[&_li]:transition-none',
									{
										'focus:[&_li]:!bg-default/40 data-[focus=true]:[&_li]:!bg-default/40 data-[hover=true]:[&_li]:!bg-default/40':
											isHighAppearance,
									}
								),
								popoverContent: cn({
									'bg-content1/70 backdrop-blur-lg': isHighAppearance,
								}),
								trigger: cn(
									'transition-background motion-reduce:transition-none',
									onModalClose !== undefined || !isHighAppearance
										? 'bg-default-200 data-[hover=true]:bg-default dark:bg-default-100 dark:data-[hover=true]:bg-default-200'
										: 'bg-default/40 backdrop-blur data-[hover=true]:bg-default-400/40'
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
						onPress={onClearPopularTrendButtonPress}
					>
						清除选择
					</Button>
				</div>
				<SwitchItem
					isSelected={isFamousShop}
					onValueChange={onIsFamousShopChange}
					aria-label={`${isFamousShop ? '关闭' : '开启'}“明星店”效果`}
					className="!mt-4"
				>
					“明星店”效果
					<span className="text-tiny text-foreground-500">
						【
						<Sprite
							target="customer_rare"
							name="射命丸文"
							size={1}
							className="mx-0.5 rounded-full align-text-top"
						/>
						射命丸文】奖励符卡
					</span>
				</SwitchItem>
			</div>
			<Heading as="h3">外观</Heading>
			<div className="space-y-2">
				<SwitchItem
					isSelected={isHighAppearance}
					onValueChange={handleIsHighAppearanceChange}
					aria-label={`${isHighAppearance ? '关闭' : '开启'}平滑滚动和磨砂效果`}
				>
					<span className="flex w-min flex-wrap items-center break-keep md:flex-nowrap">
						<span>平滑滚动和磨砂效果</span>
						<span className="text-tiny text-foreground-500">
							（如因浏览器性能受限而感卡顿可关闭）
							<br />
							（开启或关闭平滑滚动需刷新页面生效）
						</span>
					</span>
				</SwitchItem>
				<SwitchItem
					isSelected={isShowTachie}
					onValueChange={globalStore.persistence.tachie.set}
					aria-label={`${isShowTagDescription ? '隐藏' : '显示'}顾客页面立绘`}
				>
					顾客页面右下角的立绘
					<span className="text-tiny text-foreground-500">（宽屏可见）</span>
				</SwitchItem>
			</div>
			<Heading as="h3">体验</Heading>
			<div className="space-y-2">
				<SwitchItem
					isSelected={isVibrateEnabled}
					onValueChange={globalStore.persistence.vibrate.set}
					aria-label={`${isVibrateEnabled ? '关闭' : '开启'}操作震动反馈`}
				>
					部分操作的震动反馈
					<span className="text-tiny text-foreground-500">（需设备和浏览器支持）</span>
				</SwitchItem>
				<SwitchItem
					isSelected={isShowTagsTooltip}
					onValueChange={globalStore.persistence.customerCardTagsTooltip.set}
					aria-label={`${isShowTagsTooltip ? '隐藏' : '显示'}标签浮动提示`}
				>
					顾客卡片中标签的浮动提示
					<span className="text-tiny text-foreground-500">（鼠标悬停可见）</span>
				</SwitchItem>
			</div>
			<Heading as="h2">稀客页面</Heading>
			<Heading as="h3">稀客卡片</Heading>
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
