import {
	type IAdminAnnouncementProfile,
	type IAdminAnnouncementVersionProfile,
	type IAnnouncementChangedField,
	type TAnnouncementComputedStatus,
	checkAnnouncementAudience,
	checkAnnouncementLevel,
	checkAnnouncementVersionAction,
} from '../shared/types';
import { type TAnnouncementVersion } from '@/lib/db/types';

function checkAnnouncementComputedStatus(
	value: unknown
): value is TAnnouncementComputedStatus {
	return (
		typeof value === 'string' &&
		['active', 'archived', 'disabled', 'ended', 'scheduled'].includes(value)
	);
}

function parseJsonObject(value: string) {
	try {
		const parsed: unknown = JSON.parse(value);

		return parsed !== null && typeof parsed === 'object'
			? (parsed as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

function parseChangedFields(value: string): IAnnouncementChangedField[] {
	try {
		const parsed: unknown = JSON.parse(value);
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.filter((field): field is IAnnouncementChangedField => {
			if (
				field === null ||
				typeof field !== 'object' ||
				Array.isArray(field)
			) {
				return false;
			}

			const record = field as Record<string, unknown>;

			return (
				typeof record['field'] === 'string' &&
				Object.hasOwn(record, 'previous') &&
				Object.hasOwn(record, 'next')
			);
		});
	} catch {
		return [];
	}
}

function parseTargetUserIds(value: unknown): string[] | null {
	if (!Array.isArray(value)) {
		return null;
	}

	const userIds: string[] = [];
	for (const item of value) {
		if (typeof item !== 'string') {
			return null;
		}

		userIds.push(item);
	}

	return userIds;
}

function parseAnnouncementSnapshot(
	value: string
): IAdminAnnouncementProfile | null {
	const snapshot = parseJsonObject(value);
	if (snapshot === null) {
		return null;
	}

	const { audience, level } = snapshot;
	const computedStatus = snapshot['computed_status'];
	const isComputedStatus = checkAnnouncementComputedStatus(computedStatus);
	if (
		typeof snapshot['id'] !== 'string' ||
		typeof snapshot['title'] !== 'string' ||
		typeof snapshot['html'] !== 'string' ||
		typeof level !== 'string' ||
		!checkAnnouncementLevel(level) ||
		typeof audience !== 'string' ||
		!checkAnnouncementAudience(audience) ||
		!isComputedStatus ||
		typeof snapshot['enabled'] !== 'boolean' ||
		typeof snapshot['dismissible'] !== 'boolean' ||
		typeof snapshot['priority'] !== 'number' ||
		typeof snapshot['revision'] !== 'number' ||
		typeof snapshot['created_at'] !== 'number' ||
		typeof snapshot['updated_at'] !== 'number'
	) {
		return null;
	}

	const startsAt = snapshot['starts_at'];
	const endsAt = snapshot['ends_at'];
	const deletedAt = snapshot['deleted_at'];
	const targetUserIds = parseTargetUserIds(snapshot['target_user_ids'] ?? []);
	if (
		(startsAt !== null && typeof startsAt !== 'number') ||
		(endsAt !== null && typeof endsAt !== 'number') ||
		(deletedAt !== null && typeof deletedAt !== 'number') ||
		targetUserIds === null
	) {
		return null;
	}

	return {
		audience,
		computed_status: computedStatus,
		created_at: snapshot['created_at'],
		deleted_at: deletedAt,
		dismissible: snapshot['dismissible'],
		enabled: snapshot['enabled'],
		ends_at: endsAt,
		html: snapshot['html'],
		id: snapshot['id'],
		level,
		priority: snapshot['priority'],
		revision: snapshot['revision'],
		starts_at: startsAt,
		target_user_ids: targetUserIds,
		title: snapshot['title'],
		updated_at: snapshot['updated_at'],
	};
}

export function createAnnouncementVersionProfile(
	version: TAnnouncementVersion
): IAdminAnnouncementVersionProfile | null {
	const snapshot = parseAnnouncementSnapshot(version.snapshot_json);
	if (snapshot === null || !checkAnnouncementVersionAction(version.action)) {
		return null;
	}

	return {
		action: version.action,
		announcement_id: version.announcement_id,
		changed_at: version.changed_at,
		changed_by: version.changed_by,
		changed_fields: parseChangedFields(version.changed_fields_json),
		id: version.id,
		revision: version.revision,
		snapshot,
	};
}

export function createAnnouncementChangedFields(
	previous: IAdminAnnouncementProfile | null,
	next: IAdminAnnouncementProfile
) {
	const fields = [
		'audience',
		'computed_status',
		'deleted_at',
		'dismissible',
		'enabled',
		'ends_at',
		'html',
		'id',
		'level',
		'priority',
		'revision',
		'starts_at',
		'target_user_ids',
		'title',
		'updated_at',
	] as const;

	if (previous === null) {
		return fields.map((field) => ({
			field,
			next: next[field],
			previous: null,
		}));
	}

	return fields
		.filter((field) => {
			if (field === 'target_user_ids') {
				return (
					JSON.stringify(previous[field]) !==
					JSON.stringify(next[field])
				);
			}

			return previous[field] !== next[field];
		})
		.map((field) => ({
			field,
			next: next[field],
			previous: previous[field],
		}));
}
