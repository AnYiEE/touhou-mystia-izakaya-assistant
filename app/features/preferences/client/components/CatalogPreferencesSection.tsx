import { memo } from 'react';

import Heading from '@/design/ui/components/heading';

import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { preferencesMessages } from '@/features/preferences/client/messages';
import { type TPreferenceTargetKey } from '@/features/preferences/contracts';

import { useI18n } from '@/shared/i18n/useI18n';

import HiddenItems from './HiddenItems';
import SwitchItem from './PreferenceSwitchItem';
import {
	getPreferenceTargetClassName,
	getPreferenceTargetDataProps,
} from './preferenceTarget';
import RecommendationPreferencesSection from './RecommendationPreferencesSection';

interface IProps {
	highlightedPreferenceKey: null | TPreferenceTargetKey;
	isReducedMotion: boolean;
	onModalClose?: (() => void) | undefined;
}

export default memo<IProps>(function CatalogPreferencesSection({
	highlightedPreferenceKey,
	isReducedMotion,
	onModalClose,
}) {
	const isOrderLinkedFilter =
		specialGuestStore.persistence.guest.orderLinkedFilter.use();
	const isShowTagDescription =
		specialGuestStore.persistence.guest.showTagDescription.use();
	const { t } = useI18n(preferencesMessages);

	return (
		<>
			<Heading as="h2">{t('preferences.section.catalog')}</Heading>
			<Heading as="h3">{t('preferences.section.catalog.items')}</Heading>
			<div className="space-y-2">
				<div
					{...getPreferenceTargetDataProps('guest-hidden-items')}
					className={getPreferenceTargetClassName(
						'guest-hidden-items',
						highlightedPreferenceKey
					)}
				>
					<HiddenItems onModalClose={onModalClose} />
				</div>
			</div>
			<RecommendationPreferencesSection
				highlightedPreferenceKey={highlightedPreferenceKey}
				isReducedMotion={isReducedMotion}
			/>
			<Heading as="h3">
				{t('preferences.section.catalog.specialGuest')}
			</Heading>
			<div className="space-y-2">
				<div
					{...getPreferenceTargetDataProps(
						'special-guest-order-linked-filter'
					)}
					className={getPreferenceTargetClassName(
						'special-guest-order-linked-filter',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isOrderLinkedFilter}
						onValueChange={
							specialGuestStore.persistence.guest
								.orderLinkedFilter.set
						}
						aria-label={t(
							isOrderLinkedFilter
								? 'preferences.catalog.orderLinked.enabledAria'
								: 'preferences.catalog.orderLinked.disabledAria'
						)}
					>
						{t('preferences.catalog.orderLinked.label')}
					</SwitchItem>
				</div>
				<div
					{...getPreferenceTargetDataProps(
						'special-guest-show-tag-description'
					)}
					className={getPreferenceTargetClassName(
						'special-guest-show-tag-description',
						highlightedPreferenceKey
					)}
				>
					<SwitchItem
						isSelected={isShowTagDescription}
						onValueChange={
							specialGuestStore.persistence.guest
								.showTagDescription.set
						}
						aria-label={t(
							isShowTagDescription
								? 'preferences.catalog.tagDescription.hideAria'
								: 'preferences.catalog.tagDescription.showAria'
						)}
					>
						{t('preferences.catalog.tagDescription.label')}
					</SwitchItem>
				</div>
			</div>
		</>
	);
});
