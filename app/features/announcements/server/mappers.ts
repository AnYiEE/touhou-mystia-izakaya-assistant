import {
	type IAdminAnnouncementProfile,
	type IAnnouncementPublicItem,
} from '@/features/announcements/contracts';
import { createAnnouncementDismissalToken } from '@/features/announcements/dismissals';
import {
	checkAnnouncementAudience,
	checkAnnouncementLevel,
} from '@/features/announcements/validation';

import type { TAnnouncement, TUser } from '@/infrastructure/database/schema';

import { sanitizeAnnouncementHtml } from './html';

export function normalizeAnnouncementBoolean(value: number) {
	return value === 1;
}

export function createAnnouncementBoolean(value: boolean) {
	return value ? 1 : 0;
}

export function parseAnnouncementTargetUserIds(value: string) {
	try {
		const parsed: unknown = JSON.parse(value);
		if (!Array.isArray(parsed)) {
			return null;
		}

		const userIds: string[] = [];
		const seenIds = new Set<string>();
		for (const item of parsed) {
			if (typeof item !== 'string' || item.length === 0) {
				return null;
			}
			if (seenIds.has(item)) {
				continue;
			}

			seenIds.add(item);
			userIds.push(item);
		}

		return userIds;
	} catch {
		return null;
	}
}

export function checkAnnouncementIsActive(
	announcement: Pick<
		TAnnouncement,
		'deleted_at' | 'enabled' | 'ends_at' | 'starts_at'
	>,
	now: number
) {
	return (
		announcement.deleted_at === null &&
		announcement.enabled === 1 &&
		(announcement.starts_at === null || announcement.starts_at <= now) &&
		(announcement.ends_at === null || announcement.ends_at > now)
	);
}

export function getComputedAnnouncementStatus(
	announcement: Pick<
		TAnnouncement,
		'deleted_at' | 'enabled' | 'ends_at' | 'starts_at'
	>,
	now = Date.now()
): IAdminAnnouncementProfile['computed_status'] {
	if (announcement.deleted_at !== null) {
		return 'archived';
	}
	if (announcement.enabled !== 1) {
		return 'disabled';
	}
	if (announcement.starts_at !== null && announcement.starts_at > now) {
		return 'scheduled';
	}
	if (announcement.ends_at !== null && announcement.ends_at <= now) {
		return 'ended';
	}

	return 'active';
}

export function createAdminAnnouncementProfile(
	announcement: TAnnouncement,
	now = Date.now()
): IAdminAnnouncementProfile | null {
	const targetUserIds = parseAnnouncementTargetUserIds(
		announcement.target_user_ids_json
	);
	if (
		!checkAnnouncementLevel(announcement.level) ||
		!checkAnnouncementAudience(announcement.audience) ||
		targetUserIds === null
	) {
		return null;
	}

	return {
		audience: announcement.audience,
		computed_status: getComputedAnnouncementStatus(announcement, now),
		created_at: announcement.created_at,
		deleted_at: announcement.deleted_at,
		dismissible: normalizeAnnouncementBoolean(announcement.dismissible),
		enabled: normalizeAnnouncementBoolean(announcement.enabled),
		ends_at: announcement.ends_at,
		html: sanitizeAnnouncementHtml(announcement.html),
		id: announcement.id,
		level: announcement.level,
		priority: announcement.priority,
		revision: announcement.revision,
		starts_at: announcement.starts_at,
		target_user_ids: targetUserIds,
		title: announcement.title,
		updated_at: announcement.updated_at,
	};
}

export function createPublicAnnouncementItem(
	announcement: TAnnouncement,
	sanitizedHtml: string
): IAnnouncementPublicItem | null {
	if (
		!checkAnnouncementLevel(announcement.level) ||
		!checkAnnouncementAudience(announcement.audience)
	) {
		return null;
	}

	return {
		audience: announcement.audience,
		dismissed_token: createAnnouncementDismissalToken(
			announcement.id,
			announcement.updated_at
		),
		dismissible: normalizeAnnouncementBoolean(announcement.dismissible),
		ends_at: announcement.ends_at,
		html: sanitizedHtml,
		id: announcement.id,
		level: announcement.level,
		priority: announcement.priority,
		revision: announcement.revision,
		starts_at: announcement.starts_at,
		title: announcement.title,
		updated_at: announcement.updated_at,
	};
}

export function checkAnnouncementMatchesRequestContext(
	announcement: TAnnouncement,
	context: { isAuthenticated: boolean; userId: TUser['id'] | undefined }
) {
	if (!checkAnnouncementAudience(announcement.audience)) {
		return false;
	}

	if (announcement.audience === 'all') {
		return true;
	}
	if (announcement.audience === 'anonymous') {
		return !context.isAuthenticated;
	}
	if (announcement.audience === 'authenticated') {
		return context.isAuthenticated;
	}
	if (!context.isAuthenticated || context.userId === undefined) {
		return false;
	}

	const targetUserIds = parseAnnouncementTargetUserIds(
		announcement.target_user_ids_json
	);

	return targetUserIds?.includes(context.userId) === true;
}
