import {
	type IAdminAnnouncementBody,
	checkAnnouncementAudience,
	checkAnnouncementLevel,
} from '../shared/types';

const MAX_ANNOUNCEMENT_HTML_LENGTH = 4000;
const MAX_ANNOUNCEMENT_ID_LENGTH = 80;
const MAX_ANNOUNCEMENT_PRIORITY = 1_000_000;
const MAX_ANNOUNCEMENT_TITLE_LENGTH = 80;
const RESERVED_ANNOUNCEMENT_IDS = new Set(['cleanup', 'new', 'preview']);

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

function normalizeAnnouncementId(value: unknown) {
	const id = normalizeString(value, MAX_ANNOUNCEMENT_ID_LENGTH);

	return id === null || RESERVED_ANNOUNCEMENT_IDS.has(id.toLowerCase())
		? null
		: id;
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

function normalizeExpectedRevision(value: unknown) {
	if (value === undefined) {
		return;
	}
	if (
		typeof value !== 'number' ||
		!Number.isSafeInteger(value) ||
		value < 1
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
	const expectedRevision = normalizeExpectedRevision(
		input['expected_revision']
	);
	const startsAt = normalizeOptionalTimestamp(input['starts_at']);
	const endsAt = normalizeOptionalTimestamp(input['ends_at']);
	const targetUserIds = normalizeTargetUserIds(input['target_user_ids']);
	const id =
		input['id'] === undefined
			? undefined
			: normalizeAnnouncementId(input['id']);

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
		expectedRevision === null ||
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
		...(expectedRevision === undefined
			? {}
			: { expected_revision: expectedRevision }),
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
