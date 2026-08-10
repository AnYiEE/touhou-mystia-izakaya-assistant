import { Select, SelectItem } from '@heroui/select';
import { cn } from '@heroui/theme';
import { memo, useCallback } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';
import Switch from '@/design/ui/components/switch';
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';

import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { DYNAMIC_TAG_MAP } from '@/domain/data/tags/tagFacts';

import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { type TPreferenceTargetKey } from '@/features/preferences/client/globalSearch/searchItems';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import SwitchItem from './PreferenceSwitchItem';
import {
	getPreferenceTargetClassName,
	getPreferenceTargetDataProps,
} from './preferenceTarget';

interface IProps {
	highlightedPreferenceKey: null | TPreferenceTargetKey;
	isPreferencesModalOpen: boolean;
	isReducedMotion: boolean;
	onModalClose?: (() => void) | undefined;
}

export default memo<IProps>(function GlobalPreferencesSection({
	highlightedPreferenceKey,
	isPreferencesModalOpen,
	isReducedMotion,
	onModalClose,
}) {
	const popoverMotionProps = useMotionProps('popover');
	const vibrate = useVibrate();

	const allDlcs = globalStore.dlcs.get();
	const hiddenDlcs = globalStore.hiddenDlcs.use();

	const isFamousShop = globalStore.persistence.famousShop.use();
	const popularTags = globalStore.popularTags.get();
	const isPopularTrendNegative =
		globalStore.persistence.popularTrend.isNegative.use();
	const selectedPopularTag = globalStore.selectedPopularTag.use();

	const { isHighAppearance } = useDesignPreferences();

	const onClearPopularTrendButtonPress = useCallback(() => {
		vibrate();
		globalStore.persistence.popularTrend.isNegative.set(false);
		globalStore.selectedPopularTag.set(new Set());
	}, [vibrate]);

	return (
		<>
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
								const newHiddenDlcs = new Set(hiddenDlcs);
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
		</>
	);
});
