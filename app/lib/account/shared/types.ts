import {
	type ACCOUNT_COOKIE_NAME_MAP,
	type SSO_CALLBACK_EVENT_LIST,
	type USER_STATUS_MAP,
} from './constants';
import { type IAccountSyncMeta } from '../sync';

export type TUserStatus =
	(typeof USER_STATUS_MAP)[keyof typeof USER_STATUS_MAP];

export type TAccountCookieNameMap = typeof ACCOUNT_COOKIE_NAME_MAP;

export interface IAuthRegisterBody {
	nickname?: string | null;
	password: string;
	username: string;
}

export interface IAuthLoginBody {
	password: string;
	username: string;
}

export interface IAuthLoginSuccessResponse {
	csrf_token: string;
	has_password: boolean;
	password_must_change: boolean;
	user: IAccountUserProfile;
}

export interface IAccountMeSuccessResponse {
	csrf_token: string;
	featureEnabled: true;
	has_password: boolean;
	isLoggedIn: true;
	password_must_change: boolean;
	state_epoch: number;
	syncMeta: IAccountSyncMeta;
	user: IAccountUserProfile;
}

export interface IAccountMeAnonymousResponse {
	csrf_token: null;
	featureEnabled: true;
	has_password: false;
	isLoggedIn: false;
	password_must_change: false;
	state_epoch: null;
	syncMeta: null;
	user: null;
}

export type TAccountMeResponse =
	| IAccountMeAnonymousResponse
	| IAccountMeSuccessResponse;

export interface IAuthChangePasswordBody {
	current_password: string;
	new_password: string;
}

export interface IAuthInitialPasswordBody {
	new_password: string;
}

export interface IAccountProfileUpdateBody {
	current_password?: string;
	nickname?: string | null;
	username?: string;
}

export interface IAccountSessionRecord {
	created_at: number;
	id: string;
	ip_summary: string;
	is_current: boolean;
	last_seen_at: number;
	user_agent_summary: string;
}

export interface IAccountSessionListData {
	sessions: IAccountSessionRecord[];
}

export interface IAccountSessionInitialData extends IAccountSessionListData {
	rendered_at: number;
	user_id: string;
}

export interface IWebauthnCredentialSummary {
	backed_up: boolean;
	created_at: number;
	device_type: string;
	id: string;
	last_used_at: number | null;
	name: string | null;
}

export interface IWebauthnCredentialListData {
	credentials: IWebauthnCredentialSummary[];
	rp_id: string;
}

export interface IAccountWebauthnInitialData extends IWebauthnCredentialListData {
	rendered_at: number;
	user_id: string;
}

export interface IAdminLoginBody {
	password: string;
	username: string;
}

export interface IAdminResetPasswordBody {
	password: string;
}

export interface IAdminSsoClientProfile {
	active_secret_count: number;
	cancel_redirect_uri: string | null;
	created_at: number;
	custom_scheme_redirect_uris: string[];
	disabled_at: number | null;
	https_redirect_uris: string[];
	id: string;
	loopback_redirect_paths: string[];
	name: string;
	status_callback_url: string | null;
	updated_at: number;
}

export interface IAdminSsoClientListRecord extends IAdminSsoClientProfile {
	failed_callback_count: number;
	grant_count: number;
	last_secret_used_at: number | null;
	pending_callback_count: number;
	pending_ticket_count: number;
}

export interface IAdminSsoClientListMetrics {
	active_client_count: number;
	active_grant_count: number;
	disabled_client_count: number;
	failed_callback_count: number;
	pending_callback_count: number;
	pending_ticket_count: number;
}

export interface IAdminSsoClientListData {
	clients: IAdminSsoClientListRecord[];
	metrics: IAdminSsoClientListMetrics;
	page: number;
	page_size: number;
	total_count: number;
	total_pages: number;
}

export interface IAdminSsoClientDetailData {
	client: IAdminSsoClientProfile;
}

export interface IAdminSsoClientCreateBody {
	cancel_redirect_uri: string | null;
	custom_scheme_redirect_uris: string[];
	https_redirect_uris: string[];
	id: string;
	loopback_redirect_paths: string[];
	name: string;
	status_callback_url: string | null;
}

export interface IAdminSsoClientUpdateBody extends IAdminSsoClientCreateBody {
	disabled: boolean;
}

export interface IAdminSsoClientMutationData {
	client: IAdminSsoClientProfile;
	client_secret?: string;
}

export type TAdminSsoClientSecretStatus = 'active' | 'disabled' | 'revoked';

export interface IAdminSsoClientSecretRecord {
	client_id: string;
	created_at: number;
	created_by_admin: string | null;
	disabled_at: number | null;
	id: string;
	label: string | null;
	last_used_at: number | null;
	position: number;
	revoked_at: number | null;
	secret_hash_prefix: string;
	status: TAdminSsoClientSecretStatus;
}

export interface IAdminSsoClientSecretListData {
	client: IAdminSsoClientProfile;
	secrets: IAdminSsoClientSecretRecord[];
}

export interface IAdminSsoClientSecretCreateBody {
	label?: string;
}

export interface IAdminSsoClientSecretUpdateBody {
	disabled?: boolean;
	label?: string | null;
}

export interface IAdminSsoClientSecretMutationData {
	client: IAdminSsoClientProfile;
	client_secret?: string;
	message: string;
	secret: IAdminSsoClientSecretRecord;
}

export interface IAdminSsoClientUserGrant {
	created_at: number;
	updated_at: number;
	user: IAccountUserProfile;
}

export interface IAdminSsoClientUsersData {
	grants: IAdminSsoClientUserGrant[];
	page: number;
	page_size: number;
	total_count: number;
	total_pages: number;
}

export interface IAdminSsoUserClientGrant {
	client: {
		disabled_at: number | null;
		id: string;
		name: string;
		updated_at: number;
	};
	created_at: number;
	updated_at: number;
}

export interface IAdminSsoUserGrantsData {
	grants: IAdminSsoUserClientGrant[];
	page: number;
	page_size: number;
	total_count: number;
	total_pages: number;
}

export interface IAdminSsoGrantRecord {
	client: {
		disabled_at: number | null;
		id: string;
		name: string;
		updated_at: number;
	};
	created_at: number;
	updated_at: number;
	user: IAccountUserProfile;
}

export interface IAdminSsoGrantListData {
	grants: IAdminSsoGrantRecord[];
	page: number;
	page_size: number;
	total_count: number;
	total_pages: number;
}

export interface IAdminSsoGrantRevokeBody {
	reason?: string;
}

export interface IAdminSsoGrantMutationData {
	message: string;
	revoked_count?: number;
}

export type TAdminSsoGrantEvent =
	| 'admin_revoked'
	| 'client_deleted'
	| 'grant_created'
	| 'grant_refreshed'
	| 'user_revoked';

export interface IAdminSsoGrantEventRecord {
	actor_id: string | null;
	actor_type: 'admin' | 'client' | 'system' | 'user';
	client: {
		disabled_at: number | null;
		id: string;
		name: string;
		updated_at: number;
	} | null;
	created_at: number;
	event: TAdminSsoGrantEvent;
	id: number;
	reason: string | null;
	user: IAccountUserProfile | null;
}

export interface IAdminSsoGrantEventListData {
	events: IAdminSsoGrantEventRecord[];
	page: number;
	page_size: number;
	total_count: number;
	total_pages: number;
}

export type TAdminSsoTicketStatus = 'expired' | 'pending' | 'revoked' | 'used';

export interface IAdminSsoTicketRecord {
	client: {
		disabled_at: number | null;
		id: string;
		name: string;
		updated_at: number;
	};
	created_at: number;
	expires_at: number;
	redirect_uri: string;
	revoked_at: number | null;
	revoked_reason: string | null;
	status: TAdminSsoTicketStatus;
	ticket_hash_prefix: string;
	used_at: number | null;
	user: IAccountUserProfile;
}

export interface IAdminSsoTicketListData {
	cleanup_count: number;
	page: number;
	page_size: number;
	tickets: IAdminSsoTicketRecord[];
	total_count: number;
	total_pages: number;
}

export interface IAdminSsoTicketMutationData {
	deleted_count?: number;
	message: string;
	revoked_count?: number;
}

export interface IAdminAuditLogRecord {
	action: string;
	actor_id: string | null;
	actor_type: 'admin' | 'client' | 'system' | 'user';
	created_at: number;
	id: number;
	ip_hash: string | null;
	metadata: Record<string, unknown>;
	scope: string;
	target_id: string | null;
	target_type: string;
	user_agent_hash: string | null;
}

export interface IAdminAuditLogListData {
	logs: IAdminAuditLogRecord[];
	page: number;
	page_size: number;
	total_count: number;
	total_pages: number;
}

export type TAdminSsoCallbackEvent = (typeof SSO_CALLBACK_EVENT_LIST)[number];

export type TAdminSsoCallbackQueueStatus =
	| 'final_failed'
	| 'pending'
	| 'retrying';

export interface IAdminSsoCallbackQueueRecord {
	attempts: number;
	client_id: string;
	created_at: number;
	event: TAdminSsoCallbackEvent;
	id: number;
	last_error: string | null;
	metadata: Record<string, unknown>;
	next_retry_at: number;
	status: TAdminSsoCallbackQueueStatus;
	timestamp: number;
	user_id: string | null;
}

export interface IAdminSsoCallbackQueueListData {
	callbacks: IAdminSsoCallbackQueueRecord[];
	page: number;
	page_size: number;
	total_count: number;
	total_pages: number;
}

export interface IAdminSsoCallbackQueueMutationData {
	callback?: IAdminSsoCallbackQueueRecord;
	message: string;
}

export type TAdminSsoCallbackDeliveryStatus =
	| 'failed'
	| 'final_failed'
	| 'succeeded';

export interface IAdminSsoCallbackDeliveryRecord {
	attempt: number;
	client_id: string;
	created_at: number;
	duration_ms: number | null;
	error: string | null;
	event: TAdminSsoCallbackEvent;
	http_status: number | null;
	id: number;
	metadata: Record<string, unknown>;
	queue_key: string;
	status: TAdminSsoCallbackDeliveryStatus;
	user_id: string | null;
}

export interface IAdminSsoCallbackDeliveryListData {
	cleanup_count: number;
	deliveries: IAdminSsoCallbackDeliveryRecord[];
	page: number;
	page_size: number;
	total_count: number;
	total_pages: number;
}

export interface IAdminSsoCallbackDeliveryCleanupData {
	deleted_by_age: number;
	deleted_by_cap: number;
	deleted_count: number;
	message: string;
}

export interface IAccountUserProfile {
	created_at: number;
	id: string;
	last_login_at: number | null;
	nickname: string | null;
	state_epoch: number;
	status: TUserStatus;
	username: string;
}

export interface IAccountExportData {
	state: Array<{
		data: string;
		namespace: string;
		revision: number;
		schema_version: number;
		updated_at: number;
		user_id: string;
	}>;
	state_epoch: number;
	user: IAccountUserProfile;
}

export interface IAdminMeData {
	csrf_token: string;
	username: string;
}

export interface IAdminUserListData {
	page: number;
	page_size: number;
	total_count: number;
	total_pages: number;
	users: IAccountUserProfile[];
}

export interface IAdminUserDetailData {
	backup_imports: Array<{
		code_hash: string;
		created_at: number;
		file_name: string | null;
		results: Array<{ namespace: string; revision: number; status: 'ok' }>;
		state_epoch: number;
	}>;
	has_password: boolean;
	namespaces: Array<{
		namespace: string;
		revision: number;
		schema_version: number;
		updated_at: number;
	}>;
	passkeys: IWebauthnCredentialSummary[];
	session_count: number;
	user: IAccountUserProfile;
}

export interface IAccountSsoGrantClient {
	id: string;
	name: string;
}

export interface IAccountSsoGrant {
	client: IAccountSsoGrantClient;
	created_at: number;
	updated_at: number;
}

export interface IAccountSsoGrantListData {
	grants: IAccountSsoGrant[];
}

export interface IAccountSsoGrantInitialData extends IAccountSsoGrantListData {
	rendered_at: number;
	user_id: string;
}
