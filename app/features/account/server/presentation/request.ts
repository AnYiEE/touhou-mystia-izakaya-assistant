import { UAParser } from 'ua-parser-js';

import { accountMessages } from '@/features/account/client/messages';

import type { TLocale } from '@/shared/i18n/locale';
import { translate } from '@/shared/i18n/messages';

export function createIpSummary(value: string, locale: TLocale) {
	if (value === 'direct') {
		return translate(
			accountMessages,
			locale,
			'account.sessions.summary.direct'
		);
	}
	if (/^\d{1,3}(?:\.\d{1,3}){3}$/u.test(value)) {
		const parts = value.split('.');

		return `${parts.slice(0, 2).join('.')}.*.*`;
	}
	if (value.includes(':')) {
		return `${value.split(':').slice(0, 3).join(':')}:*`;
	}

	return value === ''
		? translate(
				accountMessages,
				locale,
				'account.sessions.summary.unknownSource'
			)
		: translate(
				accountMessages,
				locale,
				'account.sessions.summary.recorded'
			);
}

export function createUserAgentSummary(value: string, locale: TLocale) {
	const userAgent = value.trim();
	if (userAgent === '') {
		return translate(
			accountMessages,
			locale,
			'account.sessions.summary.unknownDevice'
		);
	}

	const {
		browser: { name: browserName },
		os: { name: osName },
	} = UAParser(userAgent);
	const normalizedBrowserName = browserName?.trim() ?? '';
	const normalizedOsName = osName?.trim() ?? '';
	const browser =
		normalizedBrowserName === ''
			? translate(
					accountMessages,
					locale,
					'account.sessions.summary.browser'
				)
			: normalizedBrowserName;
	const platform = normalizedOsName === '' ? null : normalizedOsName;

	return platform === null ? browser : `${browser} ⦁ ${platform}`;
}
