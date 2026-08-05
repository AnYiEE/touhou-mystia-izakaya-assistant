export type TAnnouncementServiceError =
	| 'announcement-conflict'
	| 'announcement-invalid-state'
	| 'announcement-not-found'
	| 'announcement-not-visible'
	| 'invalid-object-structure';

export type TAnnouncementServiceResult<TData> =
	| { data: TData; status: 'ok' }
	| { error: TAnnouncementServiceError; status: 'error' };
