import type {
	IAdminFeatureAccessGroupBody,
	IAdminFeatureAccessGroupDetailData,
	IAdminFeatureAccessGroupListData,
	IAdminFeatureAccessUserData,
	IAdminFeatureAccessUserUpdateBody,
	IAdminFeatureModuleListData,
	IAdminFeatureModulePolicyUpdateBody,
} from '@/features/featureAccess/contracts';
import type { IAdminUserListData } from '@/features/account/contracts';
import {
	createAdminCsrfRequestInit,
	fetchAdminApiResult,
} from '@/features/admin/client/api';

import { createJsonRequestInit } from '@/infrastructure/http/client/createJsonRequestInit';

export function fetchAdminFeatureModules() {
	return fetchAdminApiResult<IAdminFeatureModuleListData>(
		'/api/v1/admin/access/modules'
	);
}

export function updateAdminFeatureModulePolicy(
	body: IAdminFeatureModulePolicyUpdateBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminFeatureModuleListData>(
		'/api/v1/admin/access/modules',
		createJsonRequestInit('PATCH', body, csrfToken)
	);
}

export function fetchAdminFeatureGroups() {
	return fetchAdminApiResult<IAdminFeatureAccessGroupListData>(
		'/api/v1/admin/access/groups'
	);
}

export function createAdminFeatureGroup(
	body: IAdminFeatureAccessGroupBody,
	csrfToken: string
) {
	return fetchAdminApiResult<{ id: string }>(
		'/api/v1/admin/access/groups',
		createJsonRequestInit('POST', body, csrfToken)
	);
}

export function fetchAdminFeatureGroup(id: string) {
	return fetchAdminApiResult<IAdminFeatureAccessGroupDetailData>(
		`/api/v1/admin/access/groups/${encodeURIComponent(id)}`
	);
}

export function updateAdminFeatureGroup(
	id: string,
	body: IAdminFeatureAccessGroupBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminFeatureAccessGroupDetailData>(
		`/api/v1/admin/access/groups/${encodeURIComponent(id)}`,
		createJsonRequestInit('PATCH', body, csrfToken)
	);
}

export function deleteAdminFeatureGroup(id: string, csrfToken: string) {
	return fetchAdminApiResult<{ id: string }>(
		`/api/v1/admin/access/groups/${encodeURIComponent(id)}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function fetchAdminFeatureAccessUsers(query: {
	page?: number;
	query?: string;
}) {
	const searchParams = new URLSearchParams();
	if (query.page !== undefined) {
		searchParams.set('page', String(query.page));
	}
	if (query.query !== undefined && query.query.trim() !== '') {
		searchParams.set('query', query.query.trim());
	}
	const suffix = searchParams.toString();
	return fetchAdminApiResult<IAdminUserListData>(
		`/api/v1/admin/access/users${suffix === '' ? '' : `?${suffix}`}`
	);
}

export function fetchAdminFeatureAccessUser(id: string) {
	return fetchAdminApiResult<IAdminFeatureAccessUserData>(
		`/api/v1/admin/access/users/${encodeURIComponent(id)}`
	);
}

export function updateAdminFeatureAccessUser(
	id: string,
	body: IAdminFeatureAccessUserUpdateBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminFeatureAccessUserData>(
		`/api/v1/admin/access/users/${encodeURIComponent(id)}`,
		createJsonRequestInit('PUT', body, csrfToken)
	);
}
