import type { TSiteTranslate } from './messages';

export const SITE_VISITOR_STATUS_MESSAGE_KEYS = {
	failed: 'siteStatus.failed',
	loading: 'siteStatus.loading',
} as const;

export function createSiteVisitorCountMessage(
	visitorCount: number,
	t: TSiteTranslate
) {
	return t('siteStatus.visitors', { count: visitorCount });
}
