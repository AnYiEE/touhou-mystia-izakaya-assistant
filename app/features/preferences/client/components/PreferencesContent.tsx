'use client';

import { memo, useCallback, useEffect, useState } from 'react';

import Heading from '@/design/ui/components/heading';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import MobileAccountActionButton from '@/features/account/client/components/MobileAccountActionButton';
import { getAccountActionLabel } from '@/features/account/client/copy';
import { accountMessages } from '@/features/account/client/messages';
import { accountStore } from '@/features/account/client/state/accountStore';
import { getAccountSyncPauseIndicator } from '@/features/account/client/sync/accountSyncPauseIndicator';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import DataManager, {
	type IDataManagerProps,
} from '@/features/preferences/client/dataManagement/DataManager';
import { preferencesMessages } from '@/features/preferences/client/messages';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import { type TPreferenceTargetKey } from '@/features/preferences/contracts';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { useI18n } from '@/shared/i18n/useI18n';

import AppearancePreferencesSection from './AppearancePreferencesSection';
import CatalogPreferencesSection from './CatalogPreferencesSection';
import ExperiencePreferencesSection from './ExperiencePreferencesSection';
import GlobalPreferencesSection from './GlobalPreferencesSection';
import {
	getPreferenceTargetClassName,
	getPreferenceTargetDataProps,
} from './preferenceTarget';

const { isAccountFeatureClientEnabled } = PUBLIC_RUNTIME_CONFIG;

interface IProps extends IDataManagerProps {}

export default memo<IProps>(function Content({ onModalClose }) {
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();
	const { t } = useI18n(preferencesMessages);
	const { t: tAccount } = useI18n(accountMessages);

	const isPreferencesModalOpen =
		globalStore.shared.preferencesModal.isOpen.use();
	const preferencesModalOpenSource =
		globalStore.shared.preferencesModal.openSource.use();
	const preferencesTargetKey =
		globalStore.shared.preferencesModal.targetKey.use();
	const [highlightedPreferenceKey, setHighlightedPreferenceKey] =
		useState<null | TPreferenceTargetKey>(null);

	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const accountUser = accountStore.shared.user.use();
	const { labelKey: accountSyncPauseLabelKey } = getAccountSyncPauseIndicator(
		accountUser?.sync_status
	);
	const accountSyncPauseLabel =
		accountSyncPauseLabelKey === null
			? null
			: tAccount(accountSyncPauseLabelKey);

	const shouldShowMobileAccountEntry =
		isPreferencesModalOpen &&
		preferencesModalOpenSource === 'sideButton' &&
		isAccountFeatureClientEnabled &&
		accountBootstrapStatus !== 'disabled';
	const accountActionLabel = getAccountActionLabel(
		accountBootstrapStatus,
		accountUser,
		tAccount
	);

	const handleAccountButtonPress = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account Button',
			'Open Modal From Preferences Modal'
		);
		accountStore.openAccountModal('preferences');
	}, [vibrate]);

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
			<Heading isFirst subTitle={t('preferences.subtitle')}>
				{t('preferences.title')}
			</Heading>
			{shouldShowMobileAccountEntry && (
				<MobileAccountActionButton
					isDisabled={accountBootstrapStatus === 'unknown'}
					label={accountActionLabel}
					onClick={handleAccountButtonPress}
					syncStatusLabel={accountSyncPauseLabel}
					className="mb-5"
				/>
			)}
			<GlobalPreferencesSection
				highlightedPreferenceKey={highlightedPreferenceKey}
				isPreferencesModalOpen={isPreferencesModalOpen}
				isReducedMotion={isReducedMotion}
				onModalClose={onModalClose}
			/>
			<AppearancePreferencesSection
				highlightedPreferenceKey={highlightedPreferenceKey}
				isReducedMotion={isReducedMotion}
				onModalClose={onModalClose}
			/>
			<ExperiencePreferencesSection
				highlightedPreferenceKey={highlightedPreferenceKey}
			/>
			<CatalogPreferencesSection
				highlightedPreferenceKey={highlightedPreferenceKey}
				isReducedMotion={isReducedMotion}
				onModalClose={onModalClose}
			/>
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
