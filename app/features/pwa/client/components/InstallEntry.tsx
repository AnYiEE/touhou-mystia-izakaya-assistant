'use client';

import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/design/ui/components/button';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import InstallGuidePopover from '@/features/pwa/client/components/InstallGuidePopover';
import { pwaInstallStore } from '@/features/pwa/client/installStore';
import { pwaInstallMessages } from '@/features/pwa/client/messages';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { useI18n } from '@/shared/i18n/useI18n';
import { siteMessages } from '@/shared/site/messages';

const TIMEOUT_HINT_DURATION_MS = 6000;

export default function InstallEntry() {
	const { t } = useI18n(pwaInstallMessages);
	const { t: tSite } = useI18n(siteMessages);
	const vibrate = useVibrate();

	const mode = pwaInstallStore.mode.use();
	const ready = pwaInstallStore.ready.use();
	const installing = pwaInstallStore.persistence.installing.use();
	const promptDismissed = pwaInstallStore.persistence.promptDismissed.use();

	const [isTimeoutHintVisible, setIsTimeoutHintVisible] = useState(false);
	const hasTrackedShownRef = useRef(false);
	const timeoutHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null
	);

	const isHidden = PUBLIC_RUNTIME_CONFIG.isOffline || mode === 'installed';

	useEffect(() => {
		if (
			!ready ||
			isHidden ||
			globalThis.matchMedia('(min-width: 1024px)').matches ||
			hasTrackedShownRef.current
		) {
			return;
		}

		hasTrackedShownRef.current = true;
		trackEvent(
			trackEvent.category.show,
			'Banner',
			'PWA Install Entry',
			mode
		);
	}, [isHidden, mode, ready]);

	useEffect(
		() => () => {
			if (timeoutHintTimerRef.current !== null) {
				clearTimeout(timeoutHintTimerRef.current);
			}
		},
		[]
	);

	const handlePress = useCallback(() => {
		if (installing || pwaInstallStore.guideOpenSource.get() === 'entry') {
			return;
		}

		vibrate();
		pwaInstallStore.markNudgeEngaged();
		trackEvent(
			trackEvent.category.click,
			'PWA Install Button',
			'PWA Install Entry',
			mode
		);

		const outcome = pwaInstallStore.attemptPrompt();
		if (outcome === null) {
			pwaInstallStore.guideOpenSource.set('entry');
			return;
		}

		void outcome.then((result) => {
			trackEvent(
				trackEvent.category.click,
				'PWA Install Button',
				'PWA Install Prompt Result',
				result
			);
			if (result !== 'timeout') {
				return;
			}

			setIsTimeoutHintVisible(true);
			if (timeoutHintTimerRef.current !== null) {
				clearTimeout(timeoutHintTimerRef.current);
			}
			timeoutHintTimerRef.current = setTimeout(() => {
				setIsTimeoutHintVisible(false);
				timeoutHintTimerRef.current = null;
			}, TIMEOUT_HINT_DURATION_MS);
		});
	}, [installing, mode, vibrate]);

	if (isHidden) {
		return null;
	}

	let label = t('pwa.install.entry.steps', { name: tSite('site.shortName') });
	if (mode === 'in-app') {
		label = t('pwa.install.entry.openInBrowser');
	} else if (mode === 'promptable') {
		label = promptDismissed
			? t('pwa.install.entry.dismissed')
			: t('pwa.install.entry.install');
	}
	if (installing) {
		label = t('pwa.install.entry.installing');
	}

	return (
		<div
			className="flex flex-col gap-1 lg:hidden"
			data-pwa-install-entry=""
		>
			<p>
				<InstallGuidePopover
					anchor="entry"
					canOpen={!(mode === 'promptable' && !promptDismissed)}
				>
					<Button
						aria-busy={installing}
						endContent={
							<FontAwesomeIcon
								aria-hidden
								className="text-[0.7em]"
								icon={faArrowRightLong}
							/>
						}
						isDisabled={installing}
						variant="light"
						onPress={handlePress}
						className="h-auto w-auto min-w-0 gap-1 rounded-small px-0 text-small font-normal text-foreground-500 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover md:text-base lg:text-large"
					>
						{label}
					</Button>
				</InstallGuidePopover>
			</p>
			{isTimeoutHintVisible && (
				<p className="text-tiny text-foreground-500">
					{t('pwa.install.entry.timeoutHint')}
				</p>
			)}
		</div>
	);
}
