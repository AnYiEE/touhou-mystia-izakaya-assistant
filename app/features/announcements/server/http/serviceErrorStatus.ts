import type { TAnnouncementServiceError } from '@/features/announcements/server/contracts';

export const ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP: Record<
	TAnnouncementServiceError,
	number
> = {
	'announcement-conflict': 409,
	'announcement-invalid-state': 500,
	'announcement-not-found': 404,
	'announcement-not-visible': 400,
	'invalid-object-structure': 400,
};
