import { Select, SelectItem } from '@heroui/select';
import { cn } from '@heroui/theme';
import { memo, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Heading from '@/design/ui/components/heading';
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';

import { GUEST_RATING_KEY } from '@/domain/evaluation/labels';
import { getEvaluationLabelByKey } from '@/domain/evaluation/localizedLabels';
import { getRecommendationSortProfileLabel } from '@/domain/recommendations/localizedLabels';

import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { preferencesMessages } from '@/features/preferences/client/messages';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { type TPreferenceTargetKey } from '@/features/preferences/contracts';

import { useI18n } from '@/shared/i18n/useI18n';

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
	const { isHighAppearance } = useDesignPreferences();
	const selectMotionProps = useMotionProps('select');
	const { t } = useI18n(preferencesMessages);
	useCatalogLocalizationRevision();

	const isSuggestEnabled = globalStore.persistence.suggestMeals.enabled.use();
	const suggestMaxExtraIngredients =
		globalStore.maxSuggestMealExtraIngredients.use();
	const suggestMaxRating = globalStore.maxSuggestMealRating.use();
	const suggestMaxResults = globalStore.maxSuggestMealResults.use();
	const suggestSortProfile = globalStore.suggestMealSortProfile.use();
	const selectableMaxExtraIngredients =
		globalStore.shared.suggestMeals.selectableMaxExtraIngredients.get();
	const selectableMaxRatings =
		globalStore.shared.suggestMeals.selectableMaxRatings.get();
	const suggestSelectableMaxResults =
		globalStore.shared.suggestMeals.selectableMaxResults.get();
	const suggestSelectableSortProfiles =
		globalStore.shared.suggestMeals.selectableSortProfiles.get();

	const popoverProps = useMemo(
		() => ({ motionProps: selectMotionProps }),
		[selectMotionProps]
	);
	const selectClassNames = useMemo(
		() => ({
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
			trigger: cn('transition-background motion-reduce:transition-none', {
				'bg-default/40 backdrop-blur data-[hover=true]:bg-default-400/40':
					isHighAppearance,
				'bg-default-200 data-[hover=true]:bg-default':
					!isHighAppearance,
			}),
		}),
		[isHighAppearance]
	);
	const narrowSelectClassNames = useMemo(
		() => ({ base: 'w-20', ...selectClassNames }),
		[selectClassNames]
	);
	const ratingSelectClassNames = useMemo(
		() => ({ base: 'w-28', ...selectClassNames }),
		[selectClassNames]
	);
	const sortProfileSelectClassNames = useMemo(
		() => ({ base: 'w-28', ...selectClassNames }),
		[selectClassNames]
	);

	return (
		<>
			<Heading as="h3">{t('preferences.section.recommendation')}</Heading>
			<div
				{...getPreferenceTargetDataProps('special-guest-suggest-meals')}
				className={cn(
					'space-y-2.5',
					getPreferenceTargetClassName(
						'special-guest-suggest-meals',
						highlightedPreferenceKey
					)
				)}
			>
				<SwitchItem
					isSelected={isSuggestEnabled}
					onValueChange={
						globalStore.persistence.suggestMeals.enabled.set
					}
					aria-label={t(
						isSuggestEnabled
							? 'preferences.recommendation.card.disableAria'
							: 'preferences.recommendation.card.enableAria'
					)}
				>
					{t('preferences.recommendation.card')}
				</SwitchItem>
				<p className="text-small text-foreground-500">
					{t('preferences.recommendation.note')}
				</p>
				<div className="flex items-center gap-2">
					<span className="whitespace-nowrap font-medium">
						{t('preferences.recommendation.sortProfile')}
					</span>
					<Select
						disallowEmptySelection
						disableAnimation={isReducedMotion}
						isVirtualized={false}
						items={suggestSelectableSortProfiles}
						selectedKeys={suggestSortProfile}
						selectionMode="single"
						size="sm"
						variant="flat"
						onSelectionChange={
							globalStore.suggestMealSortProfile.set
						}
						aria-label={t(
							'preferences.recommendation.sortProfile.aria'
						)}
						title={t('preferences.recommendation.sortProfile.aria')}
						popoverProps={popoverProps}
						classNames={sortProfileSelectClassNames}
					>
						{({ value }) => {
							const label =
								getRecommendationSortProfileLabel(value);
							return (
								<SelectItem key={value} textValue={label}>
									{label}
								</SelectItem>
							);
						}}
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<span className="whitespace-nowrap font-medium">
						{t('preferences.recommendation.maxResults')}
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
						aria-label={t(
							'preferences.recommendation.maxResults.aria'
						)}
						title={t('preferences.recommendation.maxResults.aria')}
						popoverProps={popoverProps}
						classNames={narrowSelectClassNames}
					>
						{({ value }) => (
							<SelectItem
								key={value.toString()}
								textValue={value.toString()}
							>
								{value}
							</SelectItem>
						)}
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<span className="whitespace-nowrap font-medium">
						{t('preferences.recommendation.maxRating')}
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
						aria-label={t(
							'preferences.recommendation.maxRating.aria'
						)}
						title={t('preferences.recommendation.maxRating.aria')}
						popoverProps={popoverProps}
						classNames={ratingSelectClassNames}
					>
						{({ label, value }) => {
							const ratingKey = GUEST_RATING_KEY[value];
							const itemLabel =
								ratingKey === undefined
									? label
									: getEvaluationLabelByKey(ratingKey);
							return (
								<SelectItem
									key={value.toString()}
									textValue={itemLabel}
								>
									{itemLabel}
								</SelectItem>
							);
						}}
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<span className="whitespace-nowrap font-medium">
						{t('preferences.recommendation.maxExtraIngredients')}
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
						aria-label={t(
							'preferences.recommendation.maxExtraIngredients.aria'
						)}
						title={t(
							'preferences.recommendation.maxExtraIngredients.aria'
						)}
						popoverProps={popoverProps}
						classNames={narrowSelectClassNames}
					>
						{({ label, value }) => {
							const itemLabel =
								value === null
									? t('preferences.recommendation.unlimited')
									: label;
							return (
								<SelectItem
									key={value === null ? '' : value.toString()}
									textValue={itemLabel}
								>
									{itemLabel}
								</SelectItem>
							);
						}}
					</Select>
				</div>
			</div>
		</>
	);
});
