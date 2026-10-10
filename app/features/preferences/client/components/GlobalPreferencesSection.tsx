import { Select, SelectItem } from '@heroui/select';
import { cn } from '@heroui/theme';
import { memo, useCallback, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';
import Switch from '@/design/ui/components/switch';
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';

import { getDlcLabel } from '@/domain/availability/localizedLabels';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { DYNAMIC_FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';

import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { getFoodTagLabel } from '@/features/catalog/shared/client/localization/tagLabels';
import { catalogSharedMessages } from '@/features/catalog/shared/client/messages';
import { preferencesMessages } from '@/features/preferences/client/messages';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import { type TPreferenceTargetKey } from '@/features/preferences/contracts';

import { useI18n } from '@/shared/i18n/useI18n';

import SwitchItem from './PreferenceSwitchItem';
import {
	getPreferenceTargetClassName,
	getPreferenceTargetDataProps,
} from './preferenceTarget';

const SHAMEIMARU_AYA_ID: TSpecialGuestId = 4000;
const specialGuestCatalog = SpecialGuestCatalog.getInstance();
const POPULAR_TREND_SWITCH_CLASS_NAMES = {
	base: 'mx-2',
	wrapper: 'bg-primary',
} as const;

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
	const { isHighAppearance } = useDesignPreferences();
	const selectMotionProps = useMotionProps('select');
	const vibrate = useVibrate();
	const { t } = useI18n(preferencesMessages);
	const { t: tShared } = useI18n(catalogSharedMessages);
	useCatalogLocalizationRevision();

	const allDlcs = globalStore.dlcs.get();
	const hiddenDlcs = globalStore.hiddenDlcs.use();

	const isFamousShop = globalStore.persistence.famousShop.use();
	const popularTags = globalStore.popularTags.get();
	const isPopularTrendNegative =
		globalStore.persistence.popularTrend.isNegative.use();
	const selectedPopularTag = globalStore.selectedPopularTag.use();

	const popularTagPopoverProps = useMemo(
		() => ({ motionProps: selectMotionProps }),
		[selectMotionProps]
	);
	const popularTagSelectClassNames = useMemo(
		() => ({
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
			trigger: cn('transition-background motion-reduce:transition-none', {
				'bg-default/40 backdrop-blur data-[hover=true]:bg-default-400/40':
					isHighAppearance,
				'bg-default-200 data-[hover=true]:bg-default':
					!isHighAppearance,
				'dark:bg-default-100 dark:data-[hover=true]:bg-default-200':
					!isHighAppearance && onModalClose === undefined,
			}),
		}),
		[isHighAppearance, onModalClose]
	);

	const onClearPopularTrendButtonPress = useCallback(() => {
		vibrate();
		globalStore.persistence.popularTrend.isNegative.set(false);
		globalStore.selectedPopularTag.set(new Set());
	}, [vibrate]);

	return (
		<>
			<Heading as="h2" className="mt-0">
				{t('preferences.section.global')}
			</Heading>
			<Heading
				as="h3"
				subTitle={t('preferences.global.dataset.subTitle')}
			>
				{t('preferences.global.dataset.title')}
			</Heading>
			<div
				{...getPreferenceTargetDataProps('global-hidden-dlcs')}
				className={cn(
					'grid h-min w-full grid-cols-2 content-start gap-2 md:grid-cols-3 md:gap-x-12',
					{ 'lg:w-1/2': !isPreferencesModalOpen },
					getPreferenceTargetClassName(
						'global-hidden-dlcs',
						highlightedPreferenceKey
					)
				)}
			>
				{allDlcs.map(({ value: dlc }, index) => {
					const isHidden = hiddenDlcs.has(dlc);
					const dlcLabel = getDlcLabel(dlc);
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
							aria-label={t(
								isHidden
									? 'preferences.global.dataset.showAria'
									: 'preferences.global.dataset.hideAria',
								{ label: dlcLabel }
							)}
						>
							<span className="inline-block min-w-16">
								{dlcLabel}
							</span>
						</SwitchItem>
					);
				})}
			</div>
			<Heading
				as="h3"
				subTitle={t('preferences.global.popularTrend.subTitle')}
			>
				{t('preferences.global.popularTrend.title')}
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
					<span className="font-medium">
						{t('preferences.global.popularTrend.category')}
					</span>
					{getFoodTagLabel(DYNAMIC_FOOD_TAG_MAP.popularPositive)}
					<Switch
						isSelected={isPopularTrendNegative}
						size="sm"
						onValueChange={
							globalStore.persistence.popularTrend.isNegative.set
						}
						aria-label={t(
							'preferences.global.popularTrend.switchAria',
							{
								tag: getFoodTagLabel(
									isPopularTrendNegative
										? DYNAMIC_FOOD_TAG_MAP.popularPositive
										: DYNAMIC_FOOD_TAG_MAP.popularNegative
								),
							}
						)}
						classNames={POPULAR_TREND_SWITCH_CLASS_NAMES}
					/>
					{getFoodTagLabel(DYNAMIC_FOOD_TAG_MAP.popularNegative)}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center">
						<span className="font-medium">
							{t('preferences.global.popularTrend.tag')}
						</span>
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
							aria-label={t(
								'preferences.global.popularTrend.selectAria'
							)}
							title={t(
								'preferences.global.popularTrend.selectAria'
							)}
							popoverProps={popularTagPopoverProps}
							classNames={popularTagSelectClassNames}
						>
							{({ tag, value }) => (
								<SelectItem key={tag.toString()}>
									{value}
								</SelectItem>
							)}
						</Select>
					</div>
					<Button
						color="primary"
						isDisabled={selectedPopularTag.size === 0}
						size="sm"
						variant="flat"
						onPress={onClearPopularTrendButtonPress}
					>
						{t('preferences.global.popularTrend.clear')}
					</Button>
				</div>
				<SwitchItem
					isSelected={isFamousShop}
					onValueChange={globalStore.persistence.famousShop.set}
					aria-label={t(
						isFamousShop
							? 'preferences.global.famousShop.disableAria'
							: 'preferences.global.famousShop.enableAria'
					)}
					className="!mt-4"
				>
					{t('preferences.global.famousShop')}
					<span className="text-tiny text-foreground-500">
						{tShared('catalog.guestTag.open')}
						<Sprite
							target="special_guest"
							recordId={SHAMEIMARU_AYA_ID}
							size={1}
							className="mx-0.5 rounded-full align-text-top"
						/>
						{specialGuestCatalog.getDisplayPropsById(
							SHAMEIMARU_AYA_ID,
							'name'
						)}
						{tShared('catalog.guestTag.close')}
						{t('preferences.global.famousShop.rewardSuffix')}
					</span>
				</SwitchItem>
			</div>
		</>
	);
});
