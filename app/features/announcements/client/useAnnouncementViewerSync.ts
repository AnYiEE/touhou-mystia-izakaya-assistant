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

const ANNOUNCEMENT_VIEWER_SYNC_DEBOUNCE_MS = 150;

interface IUseAnnouncementViewerSyncOptions {
	onAnnouncements: (announcements: IAnnouncementPublicItem[]) => void;
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
	onAnnouncements,
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
	const syncGenerationRef = useRef(0);

	useEffect(() => {
		renderedViewerSignatureRef.current = serverViewerSignature;
		syncGenerationRef.current += 1;
	}, [serverViewerSignature]);

	useEffect(() => {
		if (
			serverViewerSignature === null ||
			viewerSignature === null ||
			viewerSignature === renderedViewerSignatureRef.current
		) {
			return;
		}

		const generation = syncGenerationRef.current;
		const timer = setTimeout(() => {
			if (generation !== syncGenerationRef.current) {
				return;
			}

			const currentViewerSignature = readCurrentViewerSignature();
			if (
				currentViewerSignature === null ||
				currentViewerSignature === renderedViewerSignatureRef.current
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
					if (
						readCurrentViewerSignature() !== currentViewerSignature
					) {
						return;
					}

					renderedViewerSignatureRef.current = currentViewerSignature;
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
	}, [onAnnouncements, serverViewerSignature, viewerSignature]);
}
