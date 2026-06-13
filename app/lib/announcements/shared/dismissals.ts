export const ANNOUNCEMENT_DISMISSED_COOKIE_NAME = 'announcement.dismissed';
export const MAX_ANNOUNCEMENT_DISMISSAL_COOKIE_TOKENS = 50;

const MAX_DISMISSAL_TOKEN_LENGTH = 256;

function normalizeDismissalTokens(tokens: string[]) {
	const result: string[] = [];

	for (const token of tokens) {
		if (
			token.length === 0 ||
			token.length > MAX_DISMISSAL_TOKEN_LENGTH ||
			result.includes(token)
		) {
			continue;
		}

		result.push(token);
	}

	return result.slice(-MAX_ANNOUNCEMENT_DISMISSAL_COOKIE_TOKENS);
}

export function createAnnouncementDismissalToken(
	id: string,
	updatedAt: number
) {
	return `${encodeURIComponent(id)}:${updatedAt}`;
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
