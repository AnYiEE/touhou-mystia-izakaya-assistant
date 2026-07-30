import { Select, SelectItem } from '@heroui/select';
import { cn } from '@heroui/theme';
import { memo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Heading from '@/design/ui/components/heading';
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';

import { type TPreferenceTargetKey } from '@/features/preferences/client/globalSearch/searchItems';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

import SwitchItem from './PreferenceSwitchItem';
import {
	getPreferenceTargetClassName,
	getPreferenceTargetDataProps,
} from './preferenceTarget';

interface IProps {
	highlightedPreferenceKey: null | TPreferenceTargetKey;
	isReducedMotion: boolean;
}

export default memo<IProps>(function RecommendationPreferencesSection({
	highlightedPreferenceKey,
	isReducedMotion,
}) {
	const popoverMotionProps = useMotionProps('popover');

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

	const { isHighAppearance } = useDesignPreferences();

	return (
		<>
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
		</>
	);
});
