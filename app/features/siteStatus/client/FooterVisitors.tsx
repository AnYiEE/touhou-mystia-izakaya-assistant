'use client';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import {
	SITE_VISITOR_STATUS_MESSAGE_MAP,
	createSiteVisitorCountMessage,
} from './copy';
import { useSiteVisitors } from './SiteStatusProvider';

export default function FooterVisitors() {
	const { hasLoaded, visitors } = useSiteVisitors();

	if (
		PUBLIC_RUNTIME_CONFIG.isOffline ||
		!PUBLIC_RUNTIME_CONFIG.isAnalytics ||
		!PUBLIC_RUNTIME_CONFIG.isSelfHosted
	) {
		return null;
	} else if (!hasLoaded) {
		return <span>{SITE_VISITOR_STATUS_MESSAGE_MAP.loading}</span>;
	} else if (visitors === null) {
		return <span>{SITE_VISITOR_STATUS_MESSAGE_MAP.failed}</span>;
	}

	return <span>{createSiteVisitorCountMessage(visitors)}</span>;
}
