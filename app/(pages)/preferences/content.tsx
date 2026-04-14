'use client';

import { memo, useCallback } from 'react';

import { useVibrate } from '@/hooks';

import { Select, SelectItem } from '@heroui/select';

import {
	Button,
	Switch,
	cn,
	useMotionProps,
	useReducedMotion,
} from '@/design/ui/components';

import DataManager, { type IDataManagerProps } from './dataManager';
import HiddenItems from './hiddenItems';
import SwitchItem from './switchItem';
import Heading from '@/components/heading';
import Sprite from '@/components/sprite';

import { DLC_LABEL_MAP, DYNAMIC_TAG_MAP } from '@/data';
import { t, tUI, tUIf } from '@/i18n';
import { customerRareStore, globalStore } from '@/stores';
import { toSet } from '@/utilities';

interface IProps extends IDataManagerProps {}

export default memo<IProps>(function Content({ onModalClose }) {
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const vibrate = useVibrate();

	const isPreferencesModalOpen =
		globalStore.shared.preferencesModal.isOpen.use();

	const isOrderLinkedFilter =
		customerRareStore.persistence.customer.orderLinkedFilter.use();
	const isShowTagDescription =
		customerRareStore.persistence.customer.showTagDescription.use();

	const allDlcs = globalStore.dlcs.get();
	const hiddenDlcs = globalStore.hiddenDlcs.use();

	const isSuggestEnabled = globalStore.persistence.suggestMeals.enabled.use();
	const suggestMaxResults = globalStore.maxSuggestMealResults.use();
	const suggestSelectableMaxResults =
		globalStore.shared.suggestMeals.selectableMaxResults.get();

	const isFamousShop = globalStore.persistence.famousShop.use();
	const popularTags = globalStore.popularTags.get();
	const isPopularTrendNegative =
		globalStore.persistence.popularTrend.isNegative.use();
	const selectedPopularTag = globalStore.selectedPopularTag.use();

	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const isShowTachie = globalStore.persistence.tachie.use();
	const isShowTagsTooltip =
		globalStore.persistence.customerCardTagsTooltip.use();
	const isVibrateEnabled = globalStore.persistence.vibrate.use();

	const onClearPopularTrendButtonPress = useCallback(() => {
		vibrate();
		globalStore.persistence.popularTrend.isNegative.set(false);
		globalStore.selectedPopularTag.set(toSet());
	}, [vibrate]);

	const handleIsHighAppearanceChange = useCallback(
		(value: boolean) => {
			globalStore.persistence.highAppearance.set(value);
			// Wait for the switch animation to complete (the animate will take 800ms).
			setTimeout(
				() => {
					onModalClose?.();
					// Wait for the modal to close (the animate will take 300ms).
					setTimeout(
						() => {
							location.reload();
						},
						isReducedMotion ? 0 : 300
					);
				},
				isReducedMotion ? 0 : 800
			);
		},
		[isReducedMotion, onModalClose]
	);

	return (
		<div>
			<Heading isFirst subTitle={tUI('以下所有的更改都会即时生效')}>
				{tUI('设置')}
			</Heading>
			<Heading as="h2" className="mt-0">
				{tUI('全局设置')}
			</Heading>
			<Heading
				as="h3"
				subTitle={tUI('已关闭的数据集所对应的物品将在各个页面中被隐藏')}
			>
				{tUI('数据集')}
			</Heading>
			<div
				className={cn(
					'grid h-min w-full grid-cols-2 content-start justify-items-start gap-2 md:grid-cols-3 md:gap-x-12',
					{ 'lg:w-1/2': !isPreferencesModalOpen }
				)}
			>
				{allDlcs.map(({ value: dlc }, index) => {
					const isHidden = hiddenDlcs.has(dlc);
					return (
						<SwitchItem
							key={index}
							isDisabled={dlc === 0}
							isSelected={!isHidden}
							onValueChange={(value) => {
								const newHiddenDlcs = toSet(hiddenDlcs);
								if (value) {
									newHiddenDlcs.delete(dlc);
								} else {
									newHiddenDlcs.add(dlc);
								}
								globalStore.hiddenDlcs.set(newHiddenDlcs);
							}}
							aria-label={tUIf('{action}{name}数据集', { action: tUI(isHidden ? '显示' : '隐藏'), name: t(DLC_LABEL_MAP[dlc].label) })}
						>
							<span className="inline-block min-w-16">
								{t(DLC_LABEL_MAP[dlc].label)}
							</span>
						</SwitchItem>
					);
				})}
			</div>
			<Heading
				as="h3"
				subTitle={tUI('正确设置游戏中现时的流行趋势可以使套餐评级更为准确')}
			>
				{tUI('流行趋势')}
			</Heading>
			<div className="space-y-2">
				<div className="flex items-center">
					<span className="font-medium">{tUI('类别：')}</span>
					{t(DYNAMIC_TAG_MAP.popularPositive)}
					<Switch
						isSelected={isPopularTrendNegative}
						size="sm"
						onValueChange={
							globalStore.persistence.popularTrend.isNegative.set
						}
							aria-label={tUIf('设置为{tag}', { tag: t(isPopularTrendNegative ? DYNAMIC_TAG_MAP.popularPositive : DYNAMIC_TAG_MAP.popularNegative) })}
							classNames={{ base: 'mx-2', wrapper: 'bg-primary' }}
						/>
						{t(DYNAMIC_TAG_MAP.popularNegative)}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center">
						<span className="font-medium">{tUI('标签：')}</span>
						<Select
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={popularTags}
							selectedKeys={selectedPopularTag}
							size="sm"
							variant="flat"
							onSelectionChange={
								globalStore.selectedPopularTag.set
							}
							aria-label={tUI('选择游戏中现时流行的标签')}
							title={tUI('选择游戏中现时流行的标签')}
							popoverProps={{ motionProps: popoverMotionProps }}
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
									'bg-content1/70 backdrop-blur-lg':
										isHighAppearance,
								}),
								trigger: cn(
									'transition-background motion-reduce:transition-none',
									{
										'bg-default/40 backdrop-blur data-[hover=true]:bg-default-400/40':
											isHighAppearance,
										'bg-default-200 data-[hover=true]:bg-default':
											!isHighAppearance,
										'dark:bg-default-100 dark:data-[hover=true]:bg-default-200':
											!isHighAppearance &&
											onModalClose === undefined,
									}
								),
							}}
						>
							{({ value }) => (
								<SelectItem key={value}>{t(value)}</SelectItem>
							)}
						</Select>
					</div>
					<Button
						color="primary"
						isDisabled={selectedPopularTag.has(null as never)}
						size="sm"
						variant="flat"
						onPress={onClearPopularTrendButtonPress}
					>
						{tUI('清除选择')}
					</Button>
				</div>
				<SwitchItem
					isSelected={isFamousShop}
					onValueChange={globalStore.persistence.famousShop.set}
					aria-label={tUIf('{action}"明星店"效果', { action: tUI(isFamousShop ? '关闭' : '开启') })}
					className="!mt-4"
				>
					{tUI('"明星店"效果')}
					<span className="text-tiny text-foreground-500">
						{'【'}
						<Sprite
							target="customer_rare"
							name="射命丸文"
							size={1}
							className="mx-0.5 rounded-full align-text-top"
						/>
						{tUIf('{name}】奖励符卡', { name: t('射命丸文') })}
					</span>
				</SwitchItem>
			</div>
			<Heading as="h3">{tUI('外观')}</Heading>
			<div className="space-y-2">
				<SwitchItem
					isSelected={isHighAppearance}
					onValueChange={handleIsHighAppearanceChange}
					aria-label={tUIf('{action}平滑滚动和磨砂效果', { action: tUI(isHighAppearance ? '关闭' : '开启') })}
				>
					<span className="flex w-min flex-wrap items-center break-keep md:flex-nowrap">
						<span>{tUI('平滑滚动和磨砂效果')}</span>
						<span className="text-tiny text-foreground-500">
							{tUI('（如因浏览器性能受限而感卡顿可关闭）')}
							<br />
							{tUI('（开启或关闭平滑滚动需刷新页面生效）')}
						</span>
					</span>
				</SwitchItem>
				<SwitchItem
					isSelected={isShowTachie}
					onValueChange={globalStore.persistence.tachie.set}
					aria-label={tUIf('{action}顾客页面立绘', { action: tUI(isShowTagDescription ? '隐藏' : '显示') })}
				>
					{tUI('顾客页面右下角的立绘')}
					<span className="text-tiny text-foreground-500">
						{tUI('（宽屏可见）')}
					</span>
				</SwitchItem>
			</div>
			<Heading as="h3">{tUI('体验')}</Heading>
			<div className="space-y-2">
				<SwitchItem
					isSelected={isVibrateEnabled}
					onValueChange={globalStore.persistence.vibrate.set}
					aria-label={tUIf('{action}操作震动反馈', { action: tUI(isVibrateEnabled ? '关闭' : '开启') })}
				>
					{tUI('部分操作的震动反馈')}
					<span className="text-tiny text-foreground-500">
						{tUI('（需设备和浏览器支持）')}
					</span>
				</SwitchItem>
				<SwitchItem
					isSelected={isShowTagsTooltip}
					onValueChange={
						globalStore.persistence.customerCardTagsTooltip.set
					}
					aria-label={tUIf('{action}标签浮动提示', { action: tUI(isShowTagsTooltip ? '隐藏' : '显示') })}
				>
					{tUI('顾客卡片中标签的浮动提示')}
					<span className="text-tiny text-foreground-500">
						{tUI('（鼠标悬停可见）')}
					</span>
				</SwitchItem>
			</div>
			<Heading as="h2">{tUI('顾客页面')}</Heading>
			<Heading as="h3">{tUI('酒水、料理和食材')}</Heading>
			<div className="space-y-2">
				<HiddenItems onModalClose={onModalClose} />
				<SwitchItem
					isSelected={isSuggestEnabled}
					onValueChange={
						globalStore.persistence.suggestMeals.enabled.set
					}
					aria-label={tUIf('{action}"猜您想要"套餐推荐卡片', { action: tUI(isSuggestEnabled ? '关闭' : '开启') })}
				>
					{tUI('"猜您想要"套餐推荐卡片')}
				</SwitchItem>
				{isSuggestEnabled && (
					<div className="flex items-center gap-2 pl-5">
						<span className="whitespace-nowrap font-medium">
							{tUI('最多推荐数：')}
						</span>
						<Select
							disallowEmptySelection
							disableAnimation={isReducedMotion}
							isVirtualized={false}
							items={suggestSelectableMaxResults}
							selectedKeys={suggestMaxResults}
							size="sm"
							variant="flat"
							onSelectionChange={
								globalStore.maxSuggestMealResults.set
							}
							aria-label={tUI('选择最多推荐套餐数量')}
							title={tUI('选择最多推荐套餐数量')}
							popoverProps={{ motionProps: popoverMotionProps }}
							classNames={{
								base: 'w-20',
								listboxWrapper: cn(
									'[&_li]:transition-background motion-reduce:[&_li]:transition-none',
									{
										'focus:[&_li]:!bg-default/40 data-[focus=true]:[&_li]:!bg-default/40 data-[hover=true]:[&_li]:!bg-default/40':
											isHighAppearance,
									}
								),
								popoverContent: cn({
									'bg-content1/70 backdrop-blur-lg':
										isHighAppearance,
								}),
								trigger: cn(
									'transition-background motion-reduce:transition-none',
									{
										'bg-default/40 backdrop-blur data-[hover=true]:bg-default-400/40':
											isHighAppearance,
										'bg-default-200 data-[hover=true]:bg-default':
											!isHighAppearance,
									}
								),
							}}
						>
							{({ value }) => (
								<SelectItem
									key={value}
									textValue={value.toString()}
								>
									{value}
								</SelectItem>
							)}
						</Select>
					</div>
				)}
			</div>
			<Heading as="h3">{tUI('稀客卡片')}</Heading>
			<div className="space-y-2">
				<SwitchItem
					isSelected={isOrderLinkedFilter}
					onValueChange={
						customerRareStore.persistence.customer.orderLinkedFilter
							.set
					}
					aria-label={tUIf('选择点单需求标签的同时{not}筛选表格', { not: isOrderLinkedFilter ? tUI('不') : '' })}
				>
					{tUI('选择点单需求的同时筛选表格')}
				</SwitchItem>
				<SwitchItem
					isSelected={isShowTagDescription}
					onValueChange={
						customerRareStore.persistence.customer
							.showTagDescription.set
					}
					aria-label={tUIf('{action}料理标签描述', { action: tUI(isShowTagDescription ? '隐藏' : '显示') })}
				>
					{tUI('显示料理标签所对应的关键词')}
				</SwitchItem>
			</div>
			<DataManager onModalClose={onModalClose} />
		</div>
	);
});
