import { MAX_ANNOUNCEMENT_ID_LENGTH } from '@/features/announcements/limits';

import {
	SUPPORTED_LOCALES,
	type TLocale,
	isLocale,
} from '@/shared/i18n/locale';
import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

export const ANNOUNCEMENT_DISMISSED_COOKIE_NAME = 'announcement.dismissed';
export const MAX_ANNOUNCEMENT_DISMISSAL_COOKIE_TOKENS = 50;

const MAX_DISMISSAL_TOKEN_LENGTH = 512;
const MAX_DISMISSAL_COOKIE_TOKEN_CHARACTERS = 3500;

const BASE36_TIMESTAMP_PATTERN = /^[0-9a-z]{1,9}$/u;

export interface IAnnouncementDismissalToken {
	announcementId: string;
	localesUpdatedAt: Partial<Record<TLocale, number>>;
}

function normalizeDismissalTokens(tokens: string[]) {
	const dedupedTokens: string[] = [];

	for (const token of tokens) {
		if (
			token.length === 0 ||
			token.length > MAX_DISMISSAL_TOKEN_LENGTH ||
			dedupedTokens.includes(token)
		) {
			continue;
		}

		dedupedTokens.push(token);
	}

	const result: string[] = [];
	let usedCharacters = 0;
	for (let index = dedupedTokens.length - 1; index >= 0; index -= 1) {
		const token = dedupedTokens[index];
		if (
			token === undefined ||
			result.length >= MAX_ANNOUNCEMENT_DISMISSAL_COOKIE_TOKENS ||
			(result.length > 0 &&
				usedCharacters + token.length >
					MAX_DISMISSAL_COOKIE_TOKEN_CHARACTERS)
		) {
			break;
		}

		usedCharacters += token.length;
		result.unshift(token);
	}

	return result;
}

export function createAnnouncementDismissalToken(
	id: string,
	localesUpdatedAt: Partial<Record<TLocale, number>>
) {
	const entries: string[] = [];
	for (const locale of SUPPORTED_LOCALES) {
		const updatedAt = localesUpdatedAt[locale];
		if (updatedAt === undefined) {
			continue;
		}

		entries.push(`${locale}.${updatedAt.toString(36)}`);
	}

	return `${encodeURIComponent(id)}:${entries.join('.')}`;
}

export function readAnnouncementDismissedCookieValue(cookie: string) {
	return (
		cookie
			.split('; ')
			.find((item) =>
				item.startsWith(`${ANNOUNCEMENT_DISMISSED_COOKIE_NAME}=`)
			)
			?.split('=', 2)[1] ?? null
	);
}

function decodeAnnouncementDismissalId(value: string) {
	let decoded: string;
	try {
		decoded = decodeURIComponent(value);
	} catch {
		return null;
	}

	return decoded.length > 0 && decoded.length <= MAX_ANNOUNCEMENT_ID_LENGTH
		? decoded
		: null;
}

function parseBase36Timestamp(value: string) {
	if (!BASE36_TIMESTAMP_PATTERN.test(value)) {
		return null;
	}

	const timestamp = Number.parseInt(value, 36);

	return isNonNegativeSafeInteger(timestamp) ? timestamp : null;
}

export function parseAnnouncementDismissalToken(
	value: string
): IAnnouncementDismissalToken | null {
	const segments = value.split(':');
	if (segments.length !== 2) {
		return null;
	}

	const [rawId = '', payload = ''] = segments;
	const announcementId = decodeAnnouncementDismissalId(rawId);
	if (announcementId === null) {
		return null;
	}

	const entries = payload.split('.');
	if (entries.length < 2 || entries.length % 2 !== 0) {
		return null;
	}

	const localesUpdatedAt: Partial<Record<TLocale, number>> = {};
	for (let index = 0; index < entries.length; index += 2) {
		const locale = entries[index];
		const rawUpdatedAt = entries[index + 1];
		if (
			locale === undefined ||
			rawUpdatedAt === undefined ||
			!isLocale(locale) ||
			localesUpdatedAt[locale] !== undefined
		) {
			return null;
		}

		const updatedAt = parseBase36Timestamp(rawUpdatedAt);
		if (updatedAt === null) {
			return null;
		}

		localesUpdatedAt[locale] = updatedAt;
	}

	return { announcementId, localesUpdatedAt };
}

export function parseAnnouncementDismissalTokens(tokens: string[]) {
	const dismissalsByAnnouncement = new Map<
		string,
		IAnnouncementDismissalToken[]
	>();
	for (const token of tokens) {
		const parsed = parseAnnouncementDismissalToken(token);
		if (parsed === null) {
			continue;
		}

		const announcementDismissals =
			dismissalsByAnnouncement.get(parsed.announcementId) ?? [];
		announcementDismissals.push(parsed);
		dismissalsByAnnouncement.set(
			parsed.announcementId,
			announcementDismissals
		);
	}

	return dismissalsByAnnouncement;
}

export function checkAnnouncementDismissalTokensCoverLocale(
	tokens: ReadonlyArray<IAnnouncementDismissalToken> | undefined,
	locale: TLocale,
	localeUpdatedAt: number
) {
	return (
		tokens?.some(
			(token) => token.localesUpdatedAt[locale] === localeUpdatedAt
		) === true
	);
}

export function parseAnnouncementDismissedCookieValue(value: string | null) {
	if (value === null || value === '') {
		return [];
	}

	try {
		const parsed: unknown = JSON.parse(decodeURIComponent(value));
		if (!Array.isArray(parsed)) {
			return [];
		}

		return normalizeDismissalTokens(
			parsed.filter((item): item is string => typeof item === 'string')
		);
	} catch {
		return [];
	}
}

export function serializeAnnouncementDismissedCookieTokens(tokens: string[]) {
	return encodeURIComponent(JSON.stringify(normalizeDismissalTokens(tokens)));
}

export function appendAnnouncementDismissalToken(
	tokens: string[],
	token: string
) {
	return normalizeDismissalTokens([
		...tokens.filter((item) => item !== token),
		token,
	]);
}
