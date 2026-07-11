import {
	type Generated,
	type Insertable,
	type Selectable,
	type Updateable,
} from 'kysely';

import { type TUserStatus } from '@/lib/account/shared/types';
import { type SSO_CALLBACK_EVENT_LIST } from '@/lib/account/shared/constants';
import {
	type TAnnouncementAudience,
	type TAnnouncementLevel,
	type TAnnouncementVersionAction,
} from '@/lib/announcements/shared/types';
import { type TSyncNamespace } from '@/lib/account/sync';

export type TSsoCallbackEvent = (typeof SSO_CALLBACK_EVENT_LIST)[number];

export type TSsoGrantEvent =
	| 'admin_revoked'
	| 'client_deleted'
	| 'grant_created'
	| 'grant_refreshed'
	| 'user_revoked';

export type TSsoActorType = 'admin' | 'client' | 'system' | 'user';

export type TSsoCallbackDeliveryStatus =
	| 'failed'
	| 'final_failed'
	| 'succeeded';

interface ITableAnnouncement {
	audience: TAnnouncementAudience;
	created_at: number;
	deleted_at: number | null;
	dismissible: number;
	enabled: number;
	ends_at: number | null;
	html: string;
	id: string;
	level: TAnnouncementLevel;
	priority: number;
	revision: number;
	starts_at: number | null;
	target_user_ids_json: string;
	title: string;
	updated_at: number;
}

interface ITableAnnouncementDismissal {
	announcement_id: string;
	announcement_updated_at: number;
	dismissed_at: number;
	user_id: string;
}

interface ITableAnnouncementVersion {
	action: TAnnouncementVersionAction;
	announcement_id: string;
	changed_at: number;
	changed_by: string | null;
	changed_fields_json: string;
	id: Generated<number>;
	revision: number;
	snapshot_json: string;
}

interface ITableBackupFileRecord {
	code: string;
	created_at: number;
	file_name: string | null;
	last_accessed: number;
	ip_address: string;
	user_agent: string;
	user_id: string;
}

interface ITableBackupCodeLock {
	code: string;
	expires_at: number;
	owner_id: string;
}

interface ITableBackupImportRecord {
	code: string;
	created_at: number;
	file_name: string | null;
	results: string;
	state_epoch: number;
	user_id: string;
}

interface ITableUser {
	created_at: number;
	deleted_at: number | null;
	id: string;
	last_login_at: number | null;
	nickname: string | null;
	state_epoch: number;
	status: TUserStatus;
	updated_at: number;
	username: string;
	username_normalized: string;
}

interface ITableUserCredential {
	failed_attempts: number;
	locked_until: number | null;
	password_hash: string;
	password_must_change: number;
	password_set: number;
	updated_at: number;
	user_id: string;
}

interface ITableSession {
	created_at: number;
	id: string;
	ip_address: string;
	last_seen_at: number;
	token_hash: string;
	user_agent: string;
	user_id: string;
}

interface ITableSiteRuntimeState {
	expires_at: number;
	key: string;
	operation_id: string;
	started_at: number;
}

interface ITableSsoCallbackQueue {
	attempts: number;
	client_id: string;
	created_at: number;
	event: TSsoCallbackEvent;
	generation: number;
	id: Generated<number>;
	last_error: string | null;
	lease_expires_at: number | null;
	lease_token: string | null;
	metadata_json: string;
	next_retry_at: number;
	timestamp: number;
	user_id: string | null;
}

interface ITableSsoClient {
	cancel_redirect_uri: string | null;
	created_at: number;
	custom_scheme_redirect_uris: string;
	deleted_at: number | null;
	deleted_by_admin: string | null;
	disabled_at: number | null;
	https_redirect_uris: string;
	id: string;
	loopback_redirect_paths: string;
	name: string;
	secret_hashes: string;
	status_callback_url: string | null;
	updated_at: number;
}

interface ITableSsoClientSecret {
	client_id: string;
	created_at: number;
	created_by_admin: string | null;
	disabled_at: number | null;
	id: string;
	label: string | null;
	last_used_at: number | null;
	position: number;
	revoked_at: number | null;
	secret_hash: string;
}

interface ITableSsoGrantEvent {
	actor_id: string | null;
	actor_type: TSsoActorType;
	client_id: string;
	created_at: number;
	event: TSsoGrantEvent;
	id: Generated<number>;
	reason: string | null;
	user_id: string;
}

interface ITableSsoCallbackDelivery {
	attempt: number;
	client_id: string;
	created_at: number;
	duration_ms: number | null;
	error: string | null;
	event: TSsoCallbackEvent;
	http_status: number | null;
	id: Generated<number>;
	metadata_json: string;
	queue_key: string;
	status: TSsoCallbackDeliveryStatus;
	user_id: string | null;
}

interface ITableAccountAuditLog {
	action: string;
	actor_id: string | null;
	actor_type: TSsoActorType;
	created_at: number;
	id: Generated<number>;
	ip_hash: string | null;
	metadata_json: string;
	scope: string;
	target_id: string | null;
	target_type: string;
	user_agent_hash: string | null;
}

interface ITableSsoTicket {
	client_id: string;
	code_challenge: string;
	created_at: number;
	expires_at: number;
	redirect_uri: string;
	revoked_at: number | null;
	revoked_reason: string | null;
	ticket_hash: string;
	used_at: number | null;
	user_id: string;
}

interface ITableSsoUserClientGrant {
	client_id: string;
	created_at: number;
	updated_at: number;
	user_id: string;
}

interface ITableUserState {
	data: string;
	namespace: TSyncNamespace;
	revision: number;
	schema_version: number;
	updated_at: number;
	user_id: string;
}

interface ITableUserWebauthnCredential {
	aaguid: string | null;
	backed_up: number;
	counter: number;
	created_at: number;
	credential_id: string;
	device_type: string;
	id: string;
	last_used_at: number | null;
	name: string | null;
	public_key: string;
	transports: string;
	user_id: string;
}

interface ITableWebauthnChallenge {
	challenge: string;
	created_at: number;
	expires_at: number;
	id: string;
	purpose: string;
	user_id: string | null;
}

export type TBackupFileRecord = Selectable<ITableBackupFileRecord>;
export type TBackupFileRecordNew = Insertable<ITableBackupFileRecord>;
export type TBackupFileRecordUpdate = Updateable<ITableBackupFileRecord>;

export type TBackupCodeLock = Selectable<ITableBackupCodeLock>;
export type TBackupCodeLockNew = Insertable<ITableBackupCodeLock>;
export type TBackupCodeLockUpdate = Updateable<ITableBackupCodeLock>;

export type TBackupImportRecord = Selectable<ITableBackupImportRecord>;
export type TBackupImportRecordNew = Insertable<ITableBackupImportRecord>;
export type TBackupImportRecordUpdate = Updateable<ITableBackupImportRecord>;

export type TUser = Selectable<ITableUser>;
export type TUserNew = Insertable<ITableUser>;
export type TUserUpdate = Updateable<ITableUser>;

export type TUserCredential = Selectable<ITableUserCredential>;
export type TUserCredentialNew = Insertable<ITableUserCredential>;
export type TUserCredentialUpdate = Updateable<ITableUserCredential>;

export type TSession = Selectable<ITableSession>;
export type TSessionNew = Insertable<ITableSession>;
export type TSessionUpdate = Updateable<ITableSession>;

export type TSiteRuntimeState = Selectable<ITableSiteRuntimeState>;
export type TSiteRuntimeStateNew = Insertable<ITableSiteRuntimeState>;
export type TSiteRuntimeStateUpdate = Updateable<ITableSiteRuntimeState>;

export type TSsoCallbackQueue = Selectable<ITableSsoCallbackQueue>;
export type TSsoCallbackQueueNew = Insertable<ITableSsoCallbackQueue>;
export type TSsoCallbackQueueUpdate = Updateable<ITableSsoCallbackQueue>;

export type TAnnouncement = Selectable<ITableAnnouncement>;
export type TAnnouncementNew = Insertable<ITableAnnouncement>;
export type TAnnouncementUpdate = Updateable<ITableAnnouncement>;

export type TAnnouncementDismissal = Selectable<ITableAnnouncementDismissal>;
export type TAnnouncementDismissalNew = Insertable<ITableAnnouncementDismissal>;
export type TAnnouncementDismissalUpdate =
	Updateable<ITableAnnouncementDismissal>;

export type TAnnouncementVersion = Selectable<ITableAnnouncementVersion>;
export type TAnnouncementVersionNew = Insertable<ITableAnnouncementVersion>;
export type TAnnouncementVersionUpdate = Updateable<ITableAnnouncementVersion>;

export type TSsoClient = Selectable<ITableSsoClient>;
export type TSsoClientNew = Insertable<ITableSsoClient>;
export type TSsoClientUpdate = Updateable<ITableSsoClient>;

export type TSsoClientSecret = Selectable<ITableSsoClientSecret>;
export type TSsoClientSecretNew = Insertable<ITableSsoClientSecret>;
export type TSsoClientSecretUpdate = Updateable<ITableSsoClientSecret>;

export type TSsoGrantEventRecord = Selectable<ITableSsoGrantEvent>;
export type TSsoGrantEventNew = Insertable<ITableSsoGrantEvent>;
export type TSsoGrantEventUpdate = Updateable<ITableSsoGrantEvent>;

export type TSsoCallbackDelivery = Selectable<ITableSsoCallbackDelivery>;
export type TSsoCallbackDeliveryNew = Insertable<ITableSsoCallbackDelivery>;
export type TSsoCallbackDeliveryUpdate = Updateable<ITableSsoCallbackDelivery>;

export type TAccountAuditLog = Selectable<ITableAccountAuditLog>;
export type TAccountAuditLogNew = Insertable<ITableAccountAuditLog>;
export type TAccountAuditLogUpdate = Updateable<ITableAccountAuditLog>;

export type TSsoTicket = Selectable<ITableSsoTicket>;
export type TSsoTicketNew = Insertable<ITableSsoTicket>;
export type TSsoTicketUpdate = Updateable<ITableSsoTicket>;

export type TSsoUserClientGrant = Selectable<ITableSsoUserClientGrant>;
export type TSsoUserClientGrantNew = Insertable<ITableSsoUserClientGrant>;
export type TSsoUserClientGrantUpdate = Updateable<ITableSsoUserClientGrant>;

export type TUserState = Selectable<ITableUserState>;
export type TUserStateNew = Insertable<ITableUserState>;
export type TUserStateUpdate = Updateable<ITableUserState>;

export type TUserWebauthnCredential = Selectable<ITableUserWebauthnCredential>;
export type TUserWebauthnCredentialNew =
	Insertable<ITableUserWebauthnCredential>;
export type TUserWebauthnCredentialUpdate =
	Updateable<ITableUserWebauthnCredential>;

export type TWebauthnChallenge = Selectable<ITableWebauthnChallenge>;
export type TWebauthnChallengeNew = Insertable<ITableWebauthnChallenge>;
export type TWebauthnChallengeUpdate = Updateable<ITableWebauthnChallenge>;

export interface TDatabase {
	account_audit_logs: ITableAccountAuditLog;
	announcement_dismissals: ITableAnnouncementDismissal;
	announcement_versions: ITableAnnouncementVersion;
	announcements: ITableAnnouncement;
	backup_code_locks: ITableBackupCodeLock;
	backup_files: ITableBackupFileRecord;
	backup_imports: ITableBackupImportRecord;
	sessions: ITableSession;
	site_runtime_states: ITableSiteRuntimeState;
	sso_callback_deliveries: ITableSsoCallbackDelivery;
	sso_callback_queue: ITableSsoCallbackQueue;
	sso_clients: ITableSsoClient;
	sso_client_secrets: ITableSsoClientSecret;
	sso_grant_events: ITableSsoGrantEvent;
	sso_tickets: ITableSsoTicket;
	sso_user_client_grants: ITableSsoUserClientGrant;
	users: ITableUser;
	user_credentials: ITableUserCredential;
	user_state: ITableUserState;
	user_webauthn_credentials: ITableUserWebauthnCredential;
	webauthn_challenges: ITableWebauthnChallenge;
}
