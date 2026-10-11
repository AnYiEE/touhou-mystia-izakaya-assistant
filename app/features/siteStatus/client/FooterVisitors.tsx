'use client';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { useI18n } from '@/shared/i18n/useI18n';

import {
	SITE_VISITOR_STATUS_MESSAGE_KEYS,
	createSiteVisitorCountMessage,
} from './copy';
import { siteStatusMessages } from './messages';
import { useSiteVisitors } from './SiteStatusProvider';

export default function FooterVisitors() {
	const { t } = useI18n(siteStatusMessages);
	const { hasLoaded, visitors } = useSiteVisitors();

	if (
		PUBLIC_RUNTIME_CONFIG.isOffline ||
		!PUBLIC_RUNTIME_CONFIG.isAnalytics ||
		!PUBLIC_RUNTIME_CONFIG.isSelfHosted
	) {
		return null;
	} else if (!hasLoaded) {
		return <span>{t(SITE_VISITOR_STATUS_MESSAGE_KEYS.loading)}</span>;
	} else if (visitors === null) {
		return <span>{t(SITE_VISITOR_STATUS_MESSAGE_KEYS.failed)}</span>;
	}

	return <span>{createSiteVisitorCountMessage(visitors, t)}</span>;
}
