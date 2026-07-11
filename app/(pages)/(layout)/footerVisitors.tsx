'use client';

import { siteConfig } from '@/configs';
import { useSiteVisitors } from '@/lib/siteStatus/client/provider';

export default function FooterVisitors() {
	const { hasLoaded, visitors } = useSiteVisitors();

	if (
		siteConfig.isOffline ||
		!siteConfig.isAnalytics ||
		!siteConfig.isSelfHosted
	) {
		return null;
	} else if (!hasLoaded) {
		return <span>正在获取在线人数</span>;
	} else if (visitors === null) {
		return <span>获取在线人数失败</span>;
	}

	return <span>实时{visitors}人在线</span>;
}
