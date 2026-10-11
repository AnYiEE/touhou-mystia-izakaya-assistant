'use client';

import { useEffect, useRef } from 'react';

import { createAccountViewerSignatureFromClientState } from '@/features/account/client/accountViewerSignature';
import { accountStore } from '@/features/account/client/state/accountStore';
import type {
	IAnnouncementPublicItem,
	IAnnouncementVisibleListData,
} from '@/features/announcements/contracts';

import { fetchServiceApi } from '@/infrastructure/http/client/fetchServiceApi';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import type { TLocale } from '@/shared/i18n/locale';

const ANNOUNCEMENT_VIEWER_SYNC_DEBOUNCE_MS = 150;

interface IUseAnnouncementViewerSyncOptions {
	locale: TLocale;
	onAnnouncements: (announcements: IAnnouncementPublicItem[]) => void;
	renderedLocale: TLocale;
	serverViewerSignature: string | null;
}

function readCurrentViewerSignature() {
	return createAccountViewerSignatureFromClientState({
		bootstrapStatus: accountStore.shared.bootstrapStatus.get(),
		isLoggedIn: accountStore.shared.isLoggedIn.get(),
		user: accountStore.shared.user.get(),
	});
}

export function useAnnouncementViewerSync({
	locale,
	onAnnouncements,
	renderedLocale,
	serverViewerSignature,
}: IUseAnnouncementViewerSyncOptions) {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const isLoggedIn = accountStore.shared.isLoggedIn.use();
	const user = accountStore.shared.user.use();
	const viewerSignature = createAccountViewerSignatureFromClientState({
		bootstrapStatus,
		isLoggedIn,
		user,
	});
	const renderedViewerSignatureRef = useRef(serverViewerSignature);
	const renderedLocaleRef = useRef(renderedLocale);
	const latestLocaleRef = useRef(locale);
	const syncGenerationRef = useRef(0);
	latestLocaleRef.current = locale;

	useEffect(() => {
		renderedViewerSignatureRef.current = serverViewerSignature;
		renderedLocaleRef.current = renderedLocale;
		syncGenerationRef.current += 1;
	}, [renderedLocale, serverViewerSignature]);

	useEffect(() => {
		if (serverViewerSignature === null || viewerSignature === null) {
			return;
		}
		if (
			viewerSignature === renderedViewerSignatureRef.current &&
			locale === renderedLocaleRef.current
		) {
			return;
		}

		const generation = syncGenerationRef.current;
		const timer = setTimeout(() => {
			if (generation !== syncGenerationRef.current) {
				return;
			}
			if (latestLocaleRef.current !== locale) {
				return;
			}

			const currentViewerSignature = readCurrentViewerSignature();
			if (
				currentViewerSignature === null ||
				(currentViewerSignature ===
					renderedViewerSignatureRef.current &&
					locale === renderedLocaleRef.current)
			) {
				return;
			}

			void (async () => {
				try {
					const data =
						await fetchServiceApi<IAnnouncementVisibleListData>(
							'/api/v1/announcements'
						);
					if (generation !== syncGenerationRef.current) {
						return;
					}
					if (latestLocaleRef.current !== locale) {
						return;
					}
					if (
						readCurrentViewerSignature() !== currentViewerSignature
					) {
						return;
					}

					renderedViewerSignatureRef.current = currentViewerSignature;
					renderedLocaleRef.current = locale;
					onAnnouncements(data.announcements);
				} catch (error) {
					console.warn('announcement viewer sync failed', {
						errorCode: getLogSafeErrorCode(error),
					});
				}
			})();
		}, ANNOUNCEMENT_VIEWER_SYNC_DEBOUNCE_MS);

		return () => {
			clearTimeout(timer);
		};
	}, [locale, onAnnouncements, serverViewerSignature, viewerSignature]);
}
