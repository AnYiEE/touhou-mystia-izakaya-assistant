import type {
	IAdminSsoClientCreateBody,
	IAdminSsoClientDetailData,
	IAdminSsoClientListData,
	IAdminSsoClientMutationData,
	IAdminSsoClientSecretCreateBody,
	IAdminSsoClientSecretListData,
	IAdminSsoClientSecretMutationData,
	IAdminSsoClientSecretUpdateBody,
	IAdminSsoClientUpdateBody,
} from '@/features/account/contracts';
import {
	createAdminCsrfRequestInit,
	fetchAdminApiResult,
} from '@/features/admin/client/api';
import {
	appendAdminNumberSearchParam,
	appendAdminStringSearchParam,
	createAdminSearchSuffix,
} from '@/features/admin/client/searchParams';

import { createJsonRequestInit } from '@/infrastructure/http/client/createJsonRequestInit';

export function listAdminSsoClients(
	options: {
		callback?: 'configured' | 'missing';
		hasGrants?: boolean;
		page?: number;
		pageSize?: number;
		query?: string;
		status?: 'active' | 'disabled';
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'status', options.status);
	appendAdminStringSearchParam(searchParams, 'callback', options.callback);
	if (typeof options.hasGrants === 'boolean') {
		searchParams.set('has_grants', options.hasGrants ? '1' : '0');
	}

	return fetchAdminApiResult<IAdminSsoClientListData>(
		`/api/v1/admin/sso/clients${createAdminSearchSuffix(searchParams)}`
	);
}

export function fetchAdminSsoClient(id: string) {
	return fetchAdminApiResult<IAdminSsoClientDetailData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(id)}`
	);
}

export function createAdminSsoClient(
	body: IAdminSsoClientCreateBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminSsoClientMutationData>(
		'/api/v1/admin/sso/clients',
		createJsonRequestInit('POST', body, csrfToken)
	);
}

export function updateAdminSsoClient(
	id: string,
	body: IAdminSsoClientUpdateBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminSsoClientMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(id)}`,
		createJsonRequestInit('PUT', body, csrfToken)
	);
}

export function toggleAdminSsoClientDisabled(
	id: string,
	body: IAdminSsoClientUpdateBody,
	disabled: boolean,
	csrfToken: string
) {
	return updateAdminSsoClient(id, { ...body, disabled }, csrfToken);
}

export function listAdminSsoClientSecrets(clientId: string) {
	return fetchAdminApiResult<IAdminSsoClientSecretListData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(clientId)}/secrets`
	);
}

export function createAdminSsoClientSecret(
	clientId: string,
	body: IAdminSsoClientSecretCreateBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminSsoClientSecretMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(clientId)}/secrets`,
		createJsonRequestInit('POST', body, csrfToken)
	);
}

export function updateAdminSsoClientSecret(
	clientId: string,
	secretId: string,
	body: IAdminSsoClientSecretUpdateBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminSsoClientSecretMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(
			clientId
		)}/secrets/${encodeURIComponent(secretId)}`,
		createJsonRequestInit('PATCH', body, csrfToken)
	);
}

export function revokeAdminSsoClientSecret(
	clientId: string,
	secretId: string,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminSsoClientSecretMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(
			clientId
		)}/secrets/${encodeURIComponent(secretId)}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function deleteAdminSsoClient(id: string, csrfToken: string) {
	return fetchAdminApiResult<{ message: 'sso-client-deleted' }>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(id)}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}
