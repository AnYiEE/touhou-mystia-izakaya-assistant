'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import InstallNudge from '@/features/pwa/client/components/InstallNudge';
import { PWA_INSTALL_CHANGE_EVENT } from '@/features/pwa/client/installScript';
import { computePwaInstallMode } from '@/features/pwa/client/installState';
import { pwaInstallStore } from '@/features/pwa/client/installStore';
import { pwaInstallMessages } from '@/features/pwa/client/messages';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { useI18n } from '@/shared/i18n/useI18n';

const VALUE_MOMENT_PAGE_DWELL_MS = 15000;
const VALUE_MOMENT_BOTTOM_THRESHOLD_PX = 24;
const VALUE_MOMENT_MIN_SCROLL_VIEWPORTS = 2;
const INSTALLED_NOTICE_DURATION_MS = 6000;
const INSTALLING_RESET_DELAY_MS = 2 * 60 * 1000;

export default function PwaInstallClient() {
	const { t } = useI18n(pwaInstallMessages);
	const [isInstalledNoticeVisible, setIsInstalledNoticeVisible] =
		useState(false);
	const installedAt = pwaInstallStore.persistence.installedAt.use();
	const installing = pwaInstallStore.persistence.installing.use();
	const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showInstalledNotice = useCallback(() => {
		setIsInstalledNoticeVisible(true);
		if (noticeTimerRef.current !== null) {
			clearTimeout(noticeTimerRef.current);
		}
		noticeTimerRef.current = setTimeout(() => {
			setIsInstalledNoticeVisible(false);
			noticeTimerRef.current = null;
		}, INSTALLED_NOTICE_DURATION_MS);
	}, []);

	useEffect(
		() => () => {
			if (noticeTimerRef.current !== null) {
				clearTimeout(noticeTimerRef.current);
			}
		},
		[]
	);

	useEffect(() => {
		if (PUBLIC_RUNTIME_CONFIG.isOffline) {
			return;
		}

		const applyMode = (isRuntimeChange: boolean) => {
			const previousMode = pwaInstallStore.mode.get();
			const nextMode = computePwaInstallMode();
			pwaInstallStore.mode.set(nextMode);
			if (
				!isRuntimeChange ||
				nextMode !== 'installed' ||
				previousMode === 'installed'
			) {
				return;
			}

			// Broadcast the completed install so other tabs hide their entries.
			pwaInstallStore.persistence.installedAt.set(Date.now());
			trackEvent(
				trackEvent.category.click,
				'PWA Install Button',
				'Install Completed'
			);
			showInstalledNotice();
		};
		const handleInstallChange = () => {
			applyMode(true);
		};

		applyMode(false);
		pwaInstallStore.ready.set(true);
		globalThis.addEventListener(
			PWA_INSTALL_CHANGE_EVENT,
			handleInstallChange
		);

		return () => {
			globalThis.removeEventListener(
				PWA_INSTALL_CHANGE_EVENT,
				handleInstallChange
			);
		};
	}, [showInstalledNotice]);

	useEffect(() => {
		if (installedAt !== null) {
			pwaInstallStore.mode.set('installed');
		}
	}, [installedAt]);

	useEffect(() => {
		if (PUBLIC_RUNTIME_CONFIG.isOffline || !installing) {
			return;
		}

		const timer = setTimeout(() => {
			pwaInstallStore.persistence.installing.set(false);
		}, INSTALLING_RESET_DELAY_MS);

		return () => {
			clearTimeout(timer);
		};
	}, [installing]);

	useEffect(() => {
		if (PUBLIC_RUNTIME_CONFIG.isOffline) {
			return;
		}

		const mountedAt = Date.now();
		let dwellTimer: ReturnType<typeof setTimeout> | null = null;
		const checkValueMoment = () => {
			const { documentElement } = document;
			if (
				documentElement.scrollHeight <
				globalThis.innerHeight * VALUE_MOMENT_MIN_SCROLL_VIEWPORTS
			) {
				return;
			}
			if (
				globalThis.innerHeight + globalThis.scrollY <
				documentElement.scrollHeight - VALUE_MOMENT_BOTTOM_THRESHOLD_PX
			) {
				return;
			}

			const dwellRemaining =
				VALUE_MOMENT_PAGE_DWELL_MS - (Date.now() - mountedAt);
			if (dwellRemaining <= 0) {
				void pwaInstallStore.requestNudge();
				return;
			}
			if (dwellTimer !== null) {
				return;
			}
			dwellTimer = setTimeout(() => {
				dwellTimer = null;
				checkValueMoment();
			}, dwellRemaining);
		};

		globalThis.addEventListener('scroll', checkValueMoment, {
			passive: true,
		});
		checkValueMoment();

		return () => {
			globalThis.removeEventListener('scroll', checkValueMoment);
			if (dwellTimer !== null) {
				clearTimeout(dwellTimer);
			}
		};
	}, []);

	if (PUBLIC_RUNTIME_CONFIG.isOffline) {
		return null;
	}

	return (
		<>
			<InstallNudge />
			{isInstalledNoticeVisible && (
				<div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
					<p className="pointer-events-auto rounded-medium border border-default/60 bg-content1/95 px-4 py-2 text-small shadow-large backdrop-blur-md dark:border-default/30">
						{t('pwa.install.notice.installed')}
					</p>
				</div>
			)}
		</>
	);
}
