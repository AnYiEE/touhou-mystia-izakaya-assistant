export {
	ANNOUNCEMENT_DISMISSED_COOKIE_NAME,
	appendAnnouncementDismissalToken,
	createAnnouncementDismissalToken,
	parseAnnouncementDismissedCookieValue,
	serializeAnnouncementDismissedCookieTokens,
} from '../shared/dismissals';

import {
	appendAnnouncementDismissalToken,
	serializeAnnouncementDismissedCookieTokens,
} from '../shared/dismissals';

export function createDismissedCookieHeaderValue(
	tokens: string[],
	token: string
) {
	return serializeAnnouncementDismissedCookieTokens(
		appendAnnouncementDismissalToken(tokens, token)
	);
}
