'use client';

import { useCallback, useEffect, useRef } from 'react';

import {
	claimBottomNudge,
	releaseBottomNudge,
} from '@/design/ui/bottomNudgeCoordinator';
import BottomNudge from '@/design/ui/components/bottomNudge';
import Button from '@/design/ui/components/button';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import InstallGuidePopover from '@/features/pwa/client/components/InstallGuidePopover';
import { pwaInstallStore } from '@/features/pwa/client/installStore';
import { pwaInstallMessages } from '@/features/pwa/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';
import { siteMessages } from '@/shared/site/messages';

export default function InstallNudge() {
	const { t } = useI18n(pwaInstallMessages);
	const { t: tSite } = useI18n(siteMessages);
	const vibrate = useVibrate();

	const isVisible = pwaInstallStore.nudgeVisible.use();
	const mode = pwaInstallStore.mode.use();
	const installing = pwaInstallStore.persistence.installing.use();
	const promptDismissed = pwaInstallStore.persistence.promptDismissed.use();
	const hasTrackedShownRef = useRef(false);
	const shouldRenderNudge = isVisible && !installing && mode !== 'installed';

	useEffect(() => {
		if (!isVisible) {
			hasTrackedShownRef.current = false;
			return;
		}
		if (hasTrackedShownRef.current) {
			return;
		}

		hasTrackedShownRef.current = true;
		trackEvent(trackEvent.category.show, 'Banner', 'PWA Install Nudge');
	}, [isVisible]);

	useEffect(() => {
		if (!shouldRenderNudge) {
			releaseBottomNudge('pwa');
			return;
		}

		claimBottomNudge('pwa');
		return () => {
			releaseBottomNudge('pwa');
		};
	}, [shouldRenderNudge]);

	const handleDismiss = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'PWA Install Button',
			'Dismiss PWA Install Nudge'
		);
		pwaInstallStore.markNudgeClosed();
	}, [vibrate]);

	const handleInstall = useCallback(() => {
		if (pwaInstallStore.guideOpenSource.get() === 'nudge') {
			return;
		}

		vibrate();
		pwaInstallStore.markNudgeEngaged();
		trackEvent(
			trackEvent.category.click,
			'PWA Install Button',
			'PWA Install Nudge',
			mode
		);

		const outcome = pwaInstallStore.attemptPrompt();
		if (outcome === null) {
			pwaInstallStore.guideOpenSource.set('nudge');
			return;
		}

		void outcome.then((result) => {
			trackEvent(
				trackEvent.category.click,
				'PWA Install Button',
				'PWA Install Prompt Result',
				result
			);
			if (result === 'timeout') {
				pwaInstallStore.guideOpenSource.set('nudge');
			}
		});
	}, [mode, vibrate]);

	const title = t('pwa.install.nudge.title', {
		name: tSite('site.shortName'),
	});

	return (
		<BottomNudge isVisible={shouldRenderNudge} nudgeKey="install-nudge">
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<p className="text-small font-medium">{title}</p>
				<p className="text-tiny text-foreground-500">
					{t('pwa.install.nudge.body')}
				</p>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<Button size="sm" variant="light" onPress={handleDismiss}>
					{t('pwa.install.nudge.later')}
				</Button>
				<InstallGuidePopover
					anchor="nudge"
					canOpen={!(mode === 'promptable' && !promptDismissed)}
					placement="top"
				>
					<Button
						color="primary"
						size="sm"
						variant="solid"
						onPress={handleInstall}
					>
						{t('pwa.install.nudge.install')}
					</Button>
				</InstallGuidePopover>
			</div>
		</BottomNudge>
	);
}
