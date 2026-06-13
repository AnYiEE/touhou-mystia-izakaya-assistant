import {
	type IAdminAnnouncementBody,
	checkAnnouncementAudience,
	checkAnnouncementLevel,
} from '../shared/types';

const MAX_ANNOUNCEMENT_HTML_LENGTH = 4000;
const MAX_ANNOUNCEMENT_ID_LENGTH = 80;
const MAX_ANNOUNCEMENT_PRIORITY = 1_000_000;
const MAX_ANNOUNCEMENT_TITLE_LENGTH = 80;

function normalizeInputObject(value: unknown) {
	return value !== null && typeof value === 'object'
		? (value as Record<string, unknown>)
		: null;
}

function normalizeString(value: unknown, maxLength: number) {
	if (typeof value !== 'string') {
		return null;
	}

	const trimmed = value.trim();

	return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

function normalizeOptionalTimestamp(value: unknown) {
	if ([null, undefined, ''].includes(value as null | undefined | string)) {
		return null;
	}

	if (
		typeof value !== 'number' ||
		!Number.isSafeInteger(value) ||
		value < 0
	) {
		return;
	}

	return value;
}

function normalizePriority(value: unknown) {
	if (
		typeof value !== 'number' ||
		!Number.isSafeInteger(value) ||
		Math.abs(value) > MAX_ANNOUNCEMENT_PRIORITY
	) {
		return null;
	}

	return value;
}

function normalizeTargetUserIds(value: unknown) {
	if (value === undefined) {
		return [];
	}
	if (!Array.isArray(value)) {
		return null;
	}

	const userIds: string[] = [];
	const seenIds = new Set<string>();
	for (const rawId of value) {
		if (typeof rawId !== 'string') {
			return null;
		}

		const id = rawId.trim();
		if (id.length === 0) {
			return null;
		}
		if (seenIds.has(id)) {
			continue;
		}

		seenIds.add(id);
		userIds.push(id);
	}

	return userIds;
}

export function parseAdminAnnouncementBody(data: unknown) {
	const input = normalizeInputObject(data);
	if (input === null) {
		return null;
	}

	const title = normalizeString(
		input['title'],
		MAX_ANNOUNCEMENT_TITLE_LENGTH
	);
	const html = normalizeString(input['html'], MAX_ANNOUNCEMENT_HTML_LENGTH);
	const rawLevel = input['level'];
	const rawAudience = input['audience'];
	const priority = normalizePriority(input['priority']);
	const startsAt = normalizeOptionalTimestamp(input['starts_at']);
	const endsAt = normalizeOptionalTimestamp(input['ends_at']);
	const targetUserIds = normalizeTargetUserIds(input['target_user_ids']);
	const id =
		input['id'] === undefined
			? undefined
			: normalizeString(input['id'], MAX_ANNOUNCEMENT_ID_LENGTH);

	if (
		title === null ||
		html === null ||
		typeof rawLevel !== 'string' ||
		!checkAnnouncementLevel(rawLevel) ||
		typeof rawAudience !== 'string' ||
		!checkAnnouncementAudience(rawAudience) ||
		typeof input['enabled'] !== 'boolean' ||
		typeof input['dismissible'] !== 'boolean' ||
		priority === null ||
		startsAt === undefined ||
		endsAt === undefined ||
		targetUserIds === null ||
		id === null
	) {
		return null;
	}

	if (startsAt !== null && endsAt !== null && endsAt <= startsAt) {
		return null;
	}
	if (rawAudience === 'targeted' && targetUserIds.length === 0) {
		return null;
	}

	return {
		...(id === undefined ? {} : { id }),
		audience: rawAudience,
		dismissible: input['dismissible'],
		enabled: input['enabled'],
		ends_at: endsAt,
		html,
		level: rawLevel,
		priority,
		starts_at: startsAt,
		target_user_ids: rawAudience === 'targeted' ? targetUserIds : [],
		title,
	} satisfies IAdminAnnouncementBody;
}
