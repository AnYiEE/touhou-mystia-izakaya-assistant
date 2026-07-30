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

export const ANNOUNCEMENT_DEFAULT_LEVEL = 'info' satisfies TAnnouncementLevel;
export const ANNOUNCEMENT_DEFAULT_AUDIENCE =
	'all' satisfies TAnnouncementAudience;
export const ANNOUNCEMENT_VERSION_DEFAULT_ACTION =
	'update' satisfies TAnnouncementVersionAction;
