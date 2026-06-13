export const ANNOUNCEMENT_LEVELS = [
	'info',
	'success',
	'warning',
	'danger',
	'critical',
] as const;

export const ANNOUNCEMENT_AUDIENCES = [
	'all',
	'anonymous',
	'authenticated',
	'targeted',
] as const;

export const ANNOUNCEMENT_VERSION_ACTIONS = [
	'create',
	'update',
	'enable',
	'disable',
	'archive',
	'restore',
] as const;

export type TAnnouncementLevel = (typeof ANNOUNCEMENT_LEVELS)[number];
export type TAnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];
export type TAnnouncementVersionAction =
	(typeof ANNOUNCEMENT_VERSION_ACTIONS)[number];

export type TAnnouncementComputedStatus =
	| 'active'
	| 'archived'
	| 'disabled'
	| 'ended'
	| 'scheduled';

export interface IAnnouncementPublicItem {
	audience: TAnnouncementAudience;
	dismissed_token: string;
	dismissible: boolean;
	ends_at: number | null;
	html: string;
	id: string;
	level: TAnnouncementLevel;
	priority: number;
	revision: number;
	starts_at: number | null;
	title: string;
	updated_at: number;
}

export interface IAnnouncementVisibleListData {
	active: boolean;
	announcements: IAnnouncementPublicItem[];
}

export interface IAdminAnnouncementProfile {
	audience: TAnnouncementAudience;
	computed_status: TAnnouncementComputedStatus;
	created_at: number;
	deleted_at: number | null;
	dismissible: boolean;
	enabled: boolean;
	ends_at: number | null;
	html: string;
	id: string;
	level: TAnnouncementLevel;
	priority: number;
	revision: number;
	starts_at: number | null;
	target_user_ids: string[];
	title: string;
	updated_at: number;
}

export interface IAdminAnnouncementListData {
	announcements: IAdminAnnouncementProfile[];
	archived_count: number;
	filtered_count: number;
	page: number;
	page_size: number;
	total_count: number;
	total_pages: number;
}

export interface IAdminAnnouncementMutationData {
	announcement: IAdminAnnouncementProfile;
}

export interface IAnnouncementChangedField {
	field: string;
	next: unknown;
	previous: unknown;
}

export interface IAdminAnnouncementVersionProfile {
	action: TAnnouncementVersionAction;
	announcement_id: string;
	changed_at: number;
	changed_by: string | null;
	changed_fields: IAnnouncementChangedField[];
	id: number;
	revision: number;
	snapshot: IAdminAnnouncementProfile;
}

export interface IAdminAnnouncementVersionListData {
	versions: IAdminAnnouncementVersionProfile[];
}

export interface IAdminAnnouncementPreviewData {
	computed_status: TAnnouncementComputedStatus;
	html: string;
	visible_text_length: number;
}

export interface IAdminAnnouncementBody {
	audience: TAnnouncementAudience;
	dismissible: boolean;
	enabled: boolean;
	ends_at: number | null;
	html: string;
	id?: string;
	level: TAnnouncementLevel;
	priority: number;
	starts_at: number | null;
	target_user_ids: string[];
	title: string;
}

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
