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

export interface IAccountUserProfile {
	created_at: number;
	id: string;
	last_login_at: number | null;
	state_epoch: number;
	status: TUserStatus;
	username: string;
}
