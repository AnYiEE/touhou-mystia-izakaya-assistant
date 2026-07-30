import { UAParser } from 'ua-parser-js';

export function createIpSummary(value: string) {
	if (value === 'direct') {
		return '直接连接';
	}
	if (/^\d{1,3}(?:\.\d{1,3}){3}$/u.test(value)) {
		const parts = value.split('.');

		return `${parts.slice(0, 2).join('.')}.*.*`;
	}
	if (value.includes(':')) {
		return `${value.split(':').slice(0, 3).join(':')}:*`;
	}

	return value === '' ? '未知来源' : '已记录来源';
}

export function createUserAgentSummary(value: string) {
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
