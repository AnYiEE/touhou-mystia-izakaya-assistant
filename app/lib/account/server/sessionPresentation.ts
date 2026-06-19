import { UAParser } from 'ua-parser-js';

import { type IAccountSessionRecord } from '@/lib/account/shared/types';
import { type TSession } from '@/lib/db/types';

function createIpSummary(value: string) {
	if (value === 'direct') {
		return '直接连接';
	}
	if (/^\d{1,3}(?:\.\d{1,3}){3}$/u.test(value)) {
		const parts = value.split('.');

		return `${parts.slice(0, 3).join('.')}.*`;
	}
	if (value.includes(':')) {
		return `${value.split(':').slice(0, 4).join(':')}:*`;
	}

	return value === '' ? '未知来源' : '已记录来源';
}

function createUserAgentSummary(value: string) {
	const userAgent = value.trim();
	if (userAgent === '') {
		return '未知设备';
	}

	const {
		browser: { name: browserName },
		os: { name: osName },
	} = UAParser(userAgent);
	const normalizedBrowserName = browserName?.trim() ?? '';
	const normalizedOsName = osName?.trim() ?? '';
	const browser =
		normalizedBrowserName === '' ? '浏览器' : normalizedBrowserName;
	const platform = normalizedOsName === '' ? null : normalizedOsName;

	return platform === null ? browser : `${browser} · ${platform}`;
}

export function createAccountSessionRecord(
	session: Pick<
		TSession,
		'created_at' | 'id' | 'ip_address' | 'last_seen_at' | 'user_agent'
	>,
	currentSessionId: string
): IAccountSessionRecord {
	return {
		created_at: session.created_at,
		id: session.id,
		ip_summary: createIpSummary(session.ip_address),
		is_current: session.id === currentSessionId,
		last_seen_at: session.last_seen_at,
		user_agent_summary: createUserAgentSummary(session.user_agent),
	};
}
