import { memo, useCallback } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
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

const PREFERENCES_APPEARANCE_SWITCH_SETTLE_MS = 800;
const PREFERENCES_MODAL_EXIT_DELAY_MS = 300;

interface IProps {
	highlightedPreferenceKey: null | TPreferenceTargetKey;
	isReducedMotion: boolean;
	onModalClose?: (() => void) | undefined;
}

export default memo<IProps>(function AppearancePreferencesSection({
	highlightedPreferenceKey,
	isReducedMotion,
	onModalClose,
}) {
	const { isHighAppearance } = useDesignPreferences();
	const isShowTachie = globalStore.persistence.tachie.use();
	const { t } = useI18n(preferencesMessages);

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

	return (
		<>
			<Heading as="h3">{t('preferences.section.appearance')}</Heading>
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
						aria-label={t(
							isHighAppearance
								? 'preferences.appearance.highAppearance.disableAria'
								: 'preferences.appearance.highAppearance.enableAria'
						)}
					>
						<span className="flex min-w-0 flex-wrap items-center gap-x-1">
							<span>
								{t('preferences.appearance.highAppearance')}
							</span>
							<span className="text-tiny text-foreground-500">
								{t(
									'preferences.appearance.highAppearance.notePerf'
								)}
								<br />
								{t(
									'preferences.appearance.highAppearance.noteReload'
								)}
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
						aria-label={t(
							isShowTachie
								? 'preferences.appearance.tachie.hideAria'
								: 'preferences.appearance.tachie.showAria'
						)}
					>
						{t('preferences.appearance.tachie')}
						<span className="text-tiny text-foreground-500">
							{t('preferences.appearance.tachie.note')}
						</span>
					</SwitchItem>
				</div>
			</div>
		</>
	);
});
