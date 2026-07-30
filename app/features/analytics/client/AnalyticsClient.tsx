'use client';

import { useEffect, useRef } from 'react';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';

import { setScriptUrlTag } from '@/infrastructure/browser/dom/setScriptUrlTag';
import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { initializeMatomoQueue, trackPageView } from './matomoQueue';
import { useAnonymousVisitorId } from './visitorIdentity';

const { analyticsScriptUrl } = PUBLIC_RUNTIME_CONFIG;

let isTrackerLoadingOrLoaded = false;

export default function AnalyticsClient() {
	const visitorId = useAnonymousVisitorId();

	useEffect(() => {
		if (visitorId === null || isTrackerLoadingOrLoaded) {
			return;
		}
		isTrackerLoadingOrLoaded = true;

		initializeMatomoQueue();

		setScriptUrlTag(analyticsScriptUrl, 'async', true)
			.then(() => {
				trackPageView();
				console.info('Analytics load succeeded.');
			})
			.catch((error: unknown) => {
				console.error('Analytics load failed.', {
					errorCode: getLogSafeErrorCode(error),
				});
			});
	}, [visitorId]);

	const isLoaded = useRef(true);
	const { pathname } = usePathname();

	useEffect(() => {
		if (isLoaded.current) {
			isLoaded.current = false;
			return;
		}

		trackPageView();
	}, [pathname]);

	return null;
}
