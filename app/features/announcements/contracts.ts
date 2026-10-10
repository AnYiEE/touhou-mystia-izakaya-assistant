import {
	type TAnnouncementAudience,
	type TAnnouncementLevel,
	type TAnnouncementVersionAction,
} from '@/domain/announcements/contracts';

import type { TLocale } from '@/shared/i18n/locale';

export const ANNOUNCEMENT_COMPUTED_STATUSES = [
	'active',
	'archived',
	'disabled',
	'ended',
	'scheduled',
] as const;

export type TAnnouncementComputedStatus =
	(typeof ANNOUNCEMENT_COMPUTED_STATUSES)[number];

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

export interface IAnnouncementLocalizedContent {
	html: string;
	title: string;
}

/**
 * @description Localized content of one announcement. Simplified Chinese
 * always lives in the legacy `title`/`html` columns; other locales are stored
 * here and are only complete entries (missing content means "not shown in
 * this language").
 */
export type TAnnouncementTranslations = Partial<
	Record<TLocale, IAnnouncementLocalizedContent>
>;

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
	locales: TLocale[];
	priority: number;
	revision: number;
	starts_at: number | null;
	target_user_ids: string[];
	title: string;
	translations: TAnnouncementTranslations;
	updated_at: number;
}

export interface IAdminAnnouncementListData {
	active_count: number;
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
	is_visible: boolean;
	locale: TLocale;
	visible_text_length: number;
}

export interface IAdminAnnouncementBody {
	audience: TAnnouncementAudience;
	dismissible: boolean;
	enabled: boolean;
	ends_at: number | null;
	expected_revision?: number;
	html: string;
	id?: string;
	level: TAnnouncementLevel;
	locales: TLocale[];
	priority: number;
	preview_locale?: TLocale;
	starts_at: number | null;
	target_user_ids: string[];
	title: string;
	translations: TAnnouncementTranslations;
}
