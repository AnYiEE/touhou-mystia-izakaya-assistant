import {
	ANNOUNCEMENT_AUDIENCES,
	ANNOUNCEMENT_LEVELS,
	ANNOUNCEMENT_VERSION_ACTIONS,
	type TAnnouncementAudience,
	type TAnnouncementLevel,
	type TAnnouncementVersionAction,
} from '@/domain/announcements/contracts';

import {
	ANNOUNCEMENT_COMPUTED_STATUSES,
	type TAnnouncementComputedStatus,
} from './contracts';

export function checkAnnouncementLevel(
	value: string
): value is TAnnouncementLevel {
	return ANNOUNCEMENT_LEVELS.includes(value as TAnnouncementLevel);
}

export function checkAnnouncementAudience(
	value: string
): value is TAnnouncementAudience {
	return ANNOUNCEMENT_AUDIENCES.includes(value as TAnnouncementAudience);
}

export function checkAnnouncementVersionAction(
	value: string
): value is TAnnouncementVersionAction {
	return ANNOUNCEMENT_VERSION_ACTIONS.includes(
		value as TAnnouncementVersionAction
	);
}

export function checkAnnouncementComputedStatus(
	value: unknown
): value is TAnnouncementComputedStatus {
	return (
		typeof value === 'string' &&
		ANNOUNCEMENT_COMPUTED_STATUSES.includes(
			value as TAnnouncementComputedStatus
		)
	);
}
