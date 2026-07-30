import { type TUserStatus } from '@/domain/account/contracts';

import type {
	IAdminSsoClientUsersData,
	IAdminSsoGrantListData,
	IAdminSsoGrantMutationData,
	IAdminSsoUserGrantsData,
} from '@/features/account/contracts';
import { fetchAdminApiResult } from '@/features/admin/client/api';
import {
	appendAdminNumberSearchParam,
	appendAdminStringSearchParam,
	createAdminSearchSuffix,
} from '@/features/admin/client/searchParams';

import { createJsonRequestInit } from '@/infrastructure/http/client/createJsonRequestInit';

function createAdminPaginationSearchParams(
	options: { page?: number; pageSize?: number; query?: string } = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);

	return createAdminSearchSuffix(searchParams);
}

export function listAdminSsoGrants(
	options: {
		clientId?: string;
		clientStatus?: 'active' | 'disabled';
		page?: number;
		pageSize?: number;
		query?: string;
		userId?: string;
		userStatus?: TUserStatus;
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'client_id', options.clientId);
	appendAdminStringSearchParam(
		searchParams,
		'client_status',
		options.clientStatus
	);
	appendAdminStringSearchParam(searchParams, 'user_id', options.userId);
	appendAdminStringSearchParam(
		searchParams,
		'user_status',
		options.userStatus
	);

	return fetchAdminApiResult<IAdminSsoGrantListData>(
		`/api/v1/admin/sso/grants${createAdminSearchSuffix(searchParams)}`
	);
}

export function revokeAdminSsoGrant(
	clientId: string,
	userId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoGrantMutationData>(
		`/api/v1/admin/sso/grants/${encodeURIComponent(
			clientId
		)}/${encodeURIComponent(userId)}`,
		createJsonRequestInit(
			'DELETE',
			reason === undefined ? {} : { reason },
			csrfToken
		)
	);
}

export function revokeAdminSsoClientGrants(
	clientId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoGrantMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(clientId)}/grants`,
		createJsonRequestInit(
			'DELETE',
			reason === undefined ? {} : { reason },
			csrfToken
		)
	);
}

export function revokeAdminUserSsoGrants(
	userId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoGrantMutationData>(
		`/api/v1/admin/users/${encodeURIComponent(userId)}/sso/grants`,
		createJsonRequestInit(
			'DELETE',
			reason === undefined ? {} : { reason },
			csrfToken
		)
	);
}

export function listAdminSsoClientUsers(
	clientId: string,
	options: { page?: number; pageSize?: number; query?: string } = {}
) {
	return fetchAdminApiResult<IAdminSsoClientUsersData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(
			clientId
		)}/users${createAdminPaginationSearchParams(options)}`
	);
}

export function revokeAdminSsoClientUserGrant(
	clientId: string,
	userId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoGrantMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(
			clientId
		)}/users/${encodeURIComponent(userId)}`,
		createJsonRequestInit(
			'DELETE',
			reason === undefined ? {} : { reason },
			csrfToken
		)
	);
}

export function listAdminUserSsoGrants(
	userId: string,
	options: { page?: number; pageSize?: number; query?: string } = {}
) {
	return fetchAdminApiResult<IAdminSsoUserGrantsData>(
		`/api/v1/admin/users/${encodeURIComponent(
			userId
		)}/sso/grants${createAdminPaginationSearchParams(options)}`
	);
}

export function revokeAdminUserSsoGrant(
	userId: string,
	clientId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoGrantMutationData>(
		`/api/v1/admin/users/${encodeURIComponent(
			userId
		)}/sso/grants/${encodeURIComponent(clientId)}`,
		createJsonRequestInit(
			'DELETE',
			reason === undefined ? {} : { reason },
			csrfToken
		)
	);
}
