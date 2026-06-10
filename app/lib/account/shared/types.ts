import {
	type ACCOUNT_COOKIE_NAME_MAP,
	type USER_STATUS_MAP,
} from './constants';
import { type IAccountSyncMeta } from '../sync';

export type TUserStatus =
	(typeof USER_STATUS_MAP)[keyof typeof USER_STATUS_MAP];

export type TAccountCookieNameMap = typeof ACCOUNT_COOKIE_NAME_MAP;

export interface IAuthRegisterBody {
	password: string;
	username: string;
}

export interface IAuthLoginBody {
	password: string;
	username: string;
}

export interface IAuthLoginSuccessResponse {
	csrf_token: string;
	password_must_change: boolean;
	user: IAccountUserProfile;
}

export interface IAccountMeSuccessResponse {
	csrf_token: string;
	featureEnabled: true;
	isLoggedIn: true;
	password_must_change: boolean;
	state_epoch: number;
	syncMeta: IAccountSyncMeta;
	user: IAccountUserProfile;
}

export interface IAccountMeAnonymousResponse {
	csrf_token: null;
	featureEnabled: true;
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

export interface IAdminLoginBody {
	password: string;
	username: string;
}

export interface IAdminResetPasswordBody {
	password: string;
}

export interface IAdminSsoClientProfile {
	cancel_redirect_uri: string | null;
	created_at: number;
	custom_scheme_redirect_uris: string[];
	id: string;
	loopback_redirect_paths: string[];
	name: string;
	secret_hashes: string[];
	status_callback_url: string | null;
	updated_at: number;
}

export interface IAdminSsoClientListData {
	clients: IAdminSsoClientProfile[];
}

export interface IAdminSsoClientDetailData {
	client: IAdminSsoClientProfile;
}

export interface IAdminSsoClientCreateBody {
	cancel_redirect_uri: string | null;
	custom_scheme_redirect_uris: string[];
	id: string;
	loopback_redirect_paths: string[];
	name: string;
	status_callback_url: string | null;
}

export interface IAdminSsoClientUpdateBody extends IAdminSsoClientCreateBody {
	generate_secret?: boolean;
	secret_hashes: string[];
}

export interface IAdminSsoClientMutationData {
	client: IAdminSsoClientProfile;
	client_secret?: string;
}

export interface IAccountUserProfile {
	created_at: number;
	id: string;
	last_login_at: number | null;
	state_epoch: number;
	status: TUserStatus;
	username: string;
}
