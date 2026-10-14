'use client';

import { cn } from '@heroui/theme';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';
import { MOTION_DURATION_S, MOTION_EASE } from '@/design/ui/motion';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import InstallGuidePopover from '@/features/pwa/client/components/InstallGuidePopover';
import { pwaInstallStore } from '@/features/pwa/client/installStore';
import { pwaInstallMessages } from '@/features/pwa/client/messages';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useI18n } from '@/shared/i18n/useI18n';
import { siteMessages } from '@/shared/site/messages';

const NUDGE_HIDDEN = { opacity: 0, y: 48 } as const;
const NUDGE_TRANSITION = {
	duration: MOTION_DURATION_S.base,
	ease: MOTION_EASE.standard,
	type: 'tween',
} as const;
const NUDGE_VISIBLE = { opacity: 1, y: 0 } as const;
const REDUCED_MOTION_TRANSITION = { duration: 0 } as const;

export default function InstallNudge() {
	const { t } = useI18n(pwaInstallMessages);
	const { t: tSite } = useI18n(siteMessages);
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const isVisible = pwaInstallStore.nudgeVisible.use();
	const mode = pwaInstallStore.mode.use();
	const installing = pwaInstallStore.persistence.installing.use();
	const promptDismissed = pwaInstallStore.persistence.promptDismissed.use();
	const hasTrackedShownRef = useRef(false);

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

	const shouldRenderNudge = isVisible && !installing && mode !== 'installed';

	const title = t('pwa.install.nudge.title', {
		name: tSite('site.shortName'),
	});

	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
			<AnimatePresence>
				{shouldRenderNudge && (
					<motion.div
						key="install-nudge"
						animate={NUDGE_VISIBLE}
						className={cn(
							'pointer-events-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-large border border-default/60 px-4 py-3 shadow-large dark:border-default/30',
							isHighAppearance
								? 'backdrop-saturate-125 bg-content1/55 backdrop-blur-lg dark:bg-content1/60'
								: 'bg-content1'
						)}
						exit={NUDGE_HIDDEN}
						initial={NUDGE_HIDDEN}
						transition={
							isReducedMotion
								? REDUCED_MOTION_TRANSITION
								: NUDGE_TRANSITION
						}
					>
						<div className="flex min-w-0 flex-1 flex-col gap-0.5">
							<p className="text-small font-medium">{title}</p>
							<p className="text-tiny text-foreground-500">
								{t('pwa.install.nudge.body')}
							</p>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<Button
								size="sm"
								variant="light"
								onPress={handleDismiss}
							>
								{t('pwa.install.nudge.later')}
							</Button>
							<InstallGuidePopover
								anchor="nudge"
								canOpen={
									!(mode === 'promptable' && !promptDismissed)
								}
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
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
