'use client';

import { memo, useCallback, useEffect, useState } from 'react';

import { useVibrate } from '@/hooks';

import { Select, SelectItem } from '@heroui/select';

import { Button, Switch, cn } from '@/design/ui/components';
import { useMotionProps, useReducedMotion } from '@/design/ui/hooks';

import DataManager, { type IDataManagerProps } from './dataManager';
import HiddenItems from './hiddenItems';
import SwitchItem from './switchItem';
import { trackEvent } from '@/components/analytics';
import Heading from '@/components/heading';
import MobileAccountActionButton from '@/components/mobileAccountActionButton';
import Sprite from '@/components/sprite';

import { siteConfig } from '@/configs';
import { DLC_LABEL_MAP, DYNAMIC_TAG_MAP } from '@/data';
import { getAccountSyncPauseIndicator } from '@/lib/account/client/accountSyncPauseIndicator';
import { type TGlobalSearchPreferenceKey } from '@/lib/globalSearch';
import {
	accountStore,
	customerRareStore as customerStore,
	globalStore,
} from '@/stores';
import { toSet } from '@/utilities';

const { isAccountFeatureClientEnabled } = siteConfig;
const PREFERENCES_APPEARANCE_SWITCH_SETTLE_MS = 800;
const PREFERENCES_MODAL_EXIT_DELAY_MS = 300;

interface IProps extends IDataManagerProps {}

function getPreferenceTargetClassName(
	key: TGlobalSearchPreferenceKey,
	highlightedKey: null | TGlobalSearchPreferenceKey
) {
	return cn(
		'rounded-small transition-all motion-reduce:transition-none',
		highlightedKey === key &&
			'bg-primary/10 shadow-[0_0_0_1px] shadow-primary/40'
	);
}

function getPreferenceTargetDataProps(key: TGlobalSearchPreferenceKey) {
	return { 'data-preference-key': key };
}

export default memo<IProps>(function Content({ onModalClose }) {
	const isReducedMotion = useReducedMotion();
	const popoverMotionProps = useMotionProps('popover');
	const vibrate = useVibrate();

	const isPreferencesModalOpen =
		globalStore.shared.preferencesModal.isOpen.use();
	const preferencesModalOpenSource =
		globalStore.shared.preferencesModal.openSource.use();
	const preferencesTargetKey =
		globalStore.shared.preferencesModal.targetKey.use();
	const [highlightedPreferenceKey, setHighlightedPreferenceKey] =
		useState<null | TGlobalSearchPreferenceKey>(null);

	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const accountUser = accountStore.shared.user.use();
	const { label: accountSyncPauseLabel } = getAccountSyncPauseIndicator(
		accountUser?.sync_status
	);

	const shouldShowMobileAccountEntry =
		isPreferencesModalOpen &&
		preferencesModalOpenSource === 'sideButton' &&
		isAccountFeatureClientEnabled &&
		accountBootstrapStatus !== 'disabled';
	const accountActionLabel =
		accountBootstrapStatus === 'error'
			? '账号不可用'
			: accountBootstrapStatus === 'unknown'
				? '欢迎您'
				: accountUser === null
					? '未登录'
					: (accountUser.nickname ?? accountUser.username);

	const isOrderLinkedFilter =
		customerStore.persistence.customer.orderLinkedFilter.use();
	const isShowTagDescription =
		customerStore.persistence.customer.showTagDescription.use();

	const allDlcs = globalStore.dlcs.get();
	const hiddenDlcs = globalStore.hiddenDlcs.use();

	const isSuggestEnabled = globalStore.persistence.suggestMeals.enabled.use();
	const suggestMaxExtraIngredients =
		globalStore.maxSuggestMealExtraIngredients.use();
	const suggestMaxRating = globalStore.maxSuggestMealRating.use();
	const suggestMaxResults = globalStore.maxSuggestMealResults.use();
	const selectableMaxExtraIngredients =
		globalStore.shared.suggestMeals.selectableMaxExtraIngredients.get();
	const selectableMaxRatings =
		globalStore.shared.suggestMeals.selectableMaxRatings.get();
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

	const handleAccountButtonPress = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account Button',
			'Open Modal From Preferences Modal'
		);
		accountStore.openAccountModal('preferences');
	}, [vibrate]);

	const handleIsHighAppearanceChange = useCallback(
		(value: boolean) => {
			globalStore.persistence.highAppearance.set(value);
			// Wait for the appearance switch animation to settle before closing.
			setTimeout(
				() => {
					onModalClose?.();
					// Wait for the preferences modal exit animation before reloading.
					setTimeout(
						() => {
							location.reload();
						},
						isReducedMotion ? 0 : PREFERENCES_MODAL_EXIT_DELAY_MS
					);
				},
				isReducedMotion ? 0 : PREFERENCES_APPEARANCE_SWITCH_SETTLE_MS
			);
		},
		[isReducedMotion, onModalClose]
	);

	useEffect(() => {
		if (preferencesTargetKey === null) {
			return;
		}

		const element = [
			...document.querySelectorAll<HTMLElement>('[data-preference-key]'),
		].find(
			({ dataset }) => dataset['preferenceKey'] === preferencesTargetKey
		);
		if (element === undefined) {
			return;
		}

		// Some browsers don't support scrollIntoViewOptions
		try {
			element.scrollIntoView({
				behavior: isReducedMotion ? 'auto' : 'smooth',
				block: 'center',
			});
		} catch {
			element.scrollIntoView(true);
		}
		element
			.querySelector<HTMLElement>(
				'button, input, select, [tabindex]:not([tabindex="-1"])'
			)
			?.focus({ preventScroll: true });
		setHighlightedPreferenceKey(preferencesTargetKey);

		const timeoutId = setTimeout(
			() => {
				setHighlightedPreferenceKey(null);
				globalStore.shared.preferencesModal.targetKey.set(null);
			},
			isReducedMotion ? 800 : 1800
		);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [isReducedMotion, preferencesTargetKey]);

	return (
		<div>
			<Heading isFirst subTitle="以下所有的更改都会即时生效">
				设置
			</Heading>
			{shouldShowMobileAccountEntry && (
				<MobileAccountActionButton
					isDisabled={accountBootstrapStatus === 'unknown'}
					label={accountActionLabel}
					onPress={handleAccountButtonPress}
					syncStatusLabel={accountSyncPauseLabel}
					className="mb-5"
				/>
			)}
			<Heading as="h2" className="mt-0">
				全局设置
			</Heading>
			<Heading
				as="h3"
				subTitle="关闭未拥有的数据集以隐藏仅在对应数据集中出现或可以获取的内容"
			>
				数据集
			</Heading>
			<div
				{...getPreferenceTargetDataProps('global-hidden-dlcs')}
				className={cn(
					'grid h-min w-full grid-cols-2 content-start justify-items-start gap-2 md:grid-cols-3 md:gap-x-12',
					{ 'lg:w-1/2': !isPreferencesModalOpen },
					getPreferenceTargetClassName(
						'global-hidden-dlcs',
						highlightedPreferenceKey
					)
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
							aria-label={`${isHidden ? '显示' : '隐藏'}${DLC_LABEL_MAP[dlc].label}数据集`}
						>
							<span className="inline-block min-w-16">
								{DLC_LABEL_MAP[dlc].label}
							</span>
						</SwitchItem>
					);
				})}
			</div>
			<Heading
				as="h3"
				subTitle="正确设置游戏中现时的流行趋势可以使套餐评级更为准确"
			>
				流行趋势
			</Heading>
			<div
				{...getPreferenceTargetDataProps('global-popular-trend')}
				className={cn(
					'space-y-2',
					getPreferenceTargetClassName(
						'global-popular-trend',
						highlightedPreferenceKey
					)
				)}
			>
				<div className="flex items-center">
					<span className="font-medium">类别：</span>
					{DYNAMIC_TAG_MAP.popularPositive}
					<Switch
						isSelected={isPopularTrendNegative}
						size="sm"
						onValueChange={
							globalStore.persistence.popularTrend.isNegative.set
						}
						aria-label={`设置为${isPopularTrendNegative ? DYNAMIC_TAG_MAP.popularPositive : DYNAMIC_TAG_MAP.popularNegative}`}
						classNames={{ base: 'mx-2', wrapper: 'bg-primary' }}
					/>
					{DYNAMIC_TAG_MAP.popularNegative}
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
							onSelectionChange={
								globalStore.selectedPopularTag.set
							}
							aria-label="选择游戏中现时流行的标签"
							title="选择游戏中现时流行的标签"
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
								<SelectItem key={value}>{value}</SelectItem>
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
						清除选择
					</Button>
				</div>
				<SwitchItem
					isSelected={isFamousShop}
					onValueChange={globalStore.persistence.famousShop.set}
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
				<div
					{...getPreferenceTargetDataProps(
						'appearance-high-appearance'
					)}
					className={getPreferenceTargetClassName(
						'appearance-high-appearance',
						highlightedPreferenceKey
					)}
				>
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
				</div>
				<div
					{...getPreferenceTargetDataProps('appearance-tachie')}
					className={getPreferenceTargetClassName(
						'appearance-tachie',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isShowTachie}
						onValueChange={globalStore.persistence.tachie.set}
						aria-label={`${isShowTachie ? '隐藏' : '显示'}顾客页面立绘`}
					>
						顾客页面右下角的立绘
						<span className="text-tiny text-foreground-500">
							（宽屏可见）
						</span>
					</SwitchItem>
				</div>
			</div>
			<Heading as="h3">体验</Heading>
			<div className="space-y-2">
				<div
					{...getPreferenceTargetDataProps('experience-vibrate')}
					className={getPreferenceTargetClassName(
						'experience-vibrate',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isVibrateEnabled}
						onValueChange={globalStore.persistence.vibrate.set}
						aria-label={`${isVibrateEnabled ? '关闭' : '开启'}操作震动反馈`}
					>
						部分操作的震动反馈
						<span className="text-tiny text-foreground-500">
							（需设备和浏览器支持）
						</span>
					</SwitchItem>
				</div>
				<div
					{...getPreferenceTargetDataProps('experience-tags-tooltip')}
					className={getPreferenceTargetClassName(
						'experience-tags-tooltip',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isShowTagsTooltip}
						onValueChange={
							globalStore.persistence.customerCardTagsTooltip.set
						}
						aria-label={`${isShowTagsTooltip ? '隐藏' : '显示'}标签浮动提示`}
					>
						顾客卡片中标签的浮动提示
						<span className="text-tiny text-foreground-500">
							（鼠标悬停可见）
						</span>
					</SwitchItem>
				</div>
			</div>
			<Heading as="h2">顾客页面</Heading>
			<Heading as="h3">酒水、料理和食材</Heading>
			<div className="space-y-2">
				<div
					{...getPreferenceTargetDataProps('customer-hidden-items')}
					className={getPreferenceTargetClassName(
						'customer-hidden-items',
						highlightedPreferenceKey
					)}
				>
					<HiddenItems onModalClose={onModalClose} />
				</div>
			</div>
			<Heading as="h3">“猜您想要”推荐</Heading>
			<div
				{...getPreferenceTargetDataProps('customer-suggest-meals')}
				className={cn(
					'space-y-2.5',
					getPreferenceTargetClassName(
						'customer-suggest-meals',
						highlightedPreferenceKey
					)
				)}
			>
				<SwitchItem
					isSelected={isSuggestEnabled}
					onValueChange={
						globalStore.persistence.suggestMeals.enabled.set
					}
					aria-label={`${isSuggestEnabled ? '关闭' : '开启'}稀客页面套餐推荐卡片`}
				>
					稀客页面套餐推荐卡片
				</SwitchItem>
				<p className="text-small text-foreground-500">
					推荐参数会影响稀客页面套餐推荐卡片和营业预设的自动推荐结果
				</p>
				<div className="flex items-center gap-2">
					<span className="whitespace-nowrap font-medium">
						最多推荐：
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
						aria-label="选择自动推荐的最多套餐数量"
						title="选择自动推荐的最多套餐数量"
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
				<div className="flex items-center gap-2">
					<span className="whitespace-nowrap font-medium">
						评级上限：
					</span>
					<Select
						disallowEmptySelection
						disableAnimation={isReducedMotion}
						isVirtualized={false}
						items={selectableMaxRatings}
						selectedKeys={suggestMaxRating}
						size="sm"
						variant="flat"
						onSelectionChange={globalStore.maxSuggestMealRating.set}
						aria-label="选择自动推荐套餐的最高评级"
						title="选择自动推荐套餐的最高评级"
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
								}
							),
						}}
					>
						{({ label, value }) => (
							<SelectItem
								key={value.toString()}
								textValue={label}
							>
								{label}
							</SelectItem>
						)}
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<span className="whitespace-nowrap font-medium">
						加料上限：
					</span>
					<Select
						disableAnimation={isReducedMotion}
						isVirtualized={false}
						items={selectableMaxExtraIngredients}
						selectedKeys={suggestMaxExtraIngredients}
						size="sm"
						variant="flat"
						onSelectionChange={
							globalStore.maxSuggestMealExtraIngredients.set
						}
						aria-label="选择自动推荐套餐的额外食材上限"
						title="选择自动推荐套餐的额外食材上限"
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
						{({ label, value }) => (
							<SelectItem
								key={value === null ? '' : value.toString()}
								textValue={label}
							>
								{label}
							</SelectItem>
						)}
					</Select>
				</div>
			</div>
			<Heading as="h3">稀客卡片</Heading>
			<div className="space-y-2">
				<div
					{...getPreferenceTargetDataProps(
						'customer-order-linked-filter'
					)}
					className={getPreferenceTargetClassName(
						'customer-order-linked-filter',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isOrderLinkedFilter}
						onValueChange={
							customerStore.persistence.customer.orderLinkedFilter
								.set
						}
						aria-label={`选择点单需求标签的同时${isOrderLinkedFilter ? '不' : ''}筛选表格`}
					>
						选择点单需求的同时筛选表格
					</SwitchItem>
				</div>
				<div
					{...getPreferenceTargetDataProps(
						'customer-show-tag-description'
					)}
					className={getPreferenceTargetClassName(
						'customer-show-tag-description',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isShowTagDescription}
						onValueChange={
							customerStore.persistence.customer
								.showTagDescription.set
						}
						aria-label={`${isShowTagDescription ? '隐藏' : '显示'}料理标签描述`}
					>
						显示料理标签所对应的关键词
					</SwitchItem>
				</div>
			</div>
			<div
				{...getPreferenceTargetDataProps('data-manager')}
				className={getPreferenceTargetClassName(
					'data-manager',
					highlightedPreferenceKey
				)}
			>
				<DataManager onModalClose={onModalClose} />
			</div>
		</div>
	);
});
