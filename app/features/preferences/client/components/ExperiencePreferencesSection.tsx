import { memo } from 'react';

import Heading from '@/design/ui/components/heading';

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
}

export default memo<IProps>(function ExperiencePreferencesSection({
	highlightedPreferenceKey,
}) {
	const isShowTagsTooltip =
		globalStore.persistence.guestCardTagsTooltip.use();
	const isVibrateEnabled = globalStore.persistence.vibrate.use();
	const { t } = useI18n(preferencesMessages);

	return (
		<>
			<Heading as="h3">{t('preferences.section.experience')}</Heading>
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
						aria-label={t(
							isVibrateEnabled
								? 'preferences.experience.vibrate.disableAria'
								: 'preferences.experience.vibrate.enableAria'
						)}
					>
						{t('preferences.experience.vibrate')}
						<span className="text-tiny text-foreground-500">
							{t('preferences.experience.vibrate.note')}
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
							globalStore.persistence.guestCardTagsTooltip.set
						}
						aria-label={t(
							isShowTagsTooltip
								? 'preferences.experience.tagsTooltip.hideAria'
								: 'preferences.experience.tagsTooltip.showAria'
						)}
					>
						{t('preferences.experience.tagsTooltip')}
						<span className="text-tiny text-foreground-500">
							{t('preferences.experience.tagsTooltip.note')}
						</span>
					</SwitchItem>
				</div>
			</div>
		</>
	);
});
