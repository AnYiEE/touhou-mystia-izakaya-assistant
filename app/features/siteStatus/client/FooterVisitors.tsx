'use client';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

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
		return <span>正在获取在线人数</span>;
	} else if (visitors === null) {
		return <span>获取在线人数失败</span>;
	}

	return <span>实时{visitors}人在线</span>;
}
