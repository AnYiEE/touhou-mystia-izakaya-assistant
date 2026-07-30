import { type TUserStatus } from '@/domain/account/contracts';

import type {
	IAdminAuditLogListData,
	IAdminMeData,
	IAdminSsoUserGrantsData,
	IAdminUserDetailData,
	IAdminUserListData,
} from '@/features/account/contracts';

export type TAdminApiResult<TData = Record<string, unknown>> =
	| { data: TData; status: 'ok' }
	| {
			data?: Record<string, unknown>;
			displayMessage: string;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

type TAdminUserDetailRefreshApiResult<TData = Record<string, unknown>> =
	| { data: TData; detail: IAdminUserDetailData; status: 'ok' }
	| Extract<TAdminApiResult, { status: 'error' }>;

export type TAdminUserDetailApiResult<TData = Record<string, unknown>> =
	| TAdminUserDetailRefreshApiResult<TData>
	| {
			data: TData;
			detailError: Extract<TAdminApiResult, { status: 'error' }>;
			status: 'mutation-committed-detail-error';
	  }
	| Extract<TAdminApiResult, { status: 'error' }>;

export type TAdminAuthStatus =
	| 'authenticated'
	| 'checking'
	| 'error'
	| 'unauthenticated';

export interface IAdminPageInitialData {
	admin: IAdminMeData | null;
	authStatus: TAdminAuthStatus;
	credentialLoginEnabled: boolean;
	message: string | null;
	page: number;
	query: string;
	renderedAt: number;
	status: TUserStatus | '';
	users: IAdminUserListData | null;
}

export interface IAdminAuditInitialData {
	action: string;
	actorId: string;
	actorType: '' | IAdminAuditLogListData['logs'][number]['actor_type'];
	admin: IAdminMeData | null;
	endTime?: number;
	isAuthLoading: boolean;
	logs: IAdminAuditLogListData | null;
	message: string | null;
	query: string;
	renderedAt: number;
	scope: '' | 'account' | 'sso';
	startTime?: number;
	targetId: string;
	targetType: string;
}

export interface IAdminUserDetailInitialData {
	admin: IAdminMeData | null;
	detail: IAdminUserDetailData | null;
	isAuthLoading: boolean;
	isDetailServerLoaded: boolean;
	listHref: string;
	message: string | null;
	renderedAt: number;
	ssoGrants: IAdminSsoUserGrantsData | null;
	userId: string;
}

export interface IAdminListLocationState {
	page: number;
	query: string;
	status: TUserStatus | '';
}
