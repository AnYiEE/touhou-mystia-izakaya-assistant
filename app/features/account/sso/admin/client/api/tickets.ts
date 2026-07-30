import type {
	IAdminSsoTicketListData,
	IAdminSsoTicketMutationData,
	TAdminSsoTicketStatus,
} from '@/features/account/contracts';
import { fetchAdminApiResult } from '@/features/admin/client/api';
import {
	appendAdminNumberSearchParam,
	appendAdminStringSearchParam,
	createAdminSearchSuffix,
} from '@/features/admin/client/searchParams';

import { createJsonRequestInit } from '@/infrastructure/http/client/createJsonRequestInit';

export function listAdminSsoTickets(
	options: {
		clientId?: string;
		page?: number;
		pageSize?: number;
		query?: string;
		status?: TAdminSsoTicketStatus;
		userId?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'client_id', options.clientId);
	appendAdminStringSearchParam(searchParams, 'status', options.status);
	appendAdminStringSearchParam(searchParams, 'user_id', options.userId);

	return fetchAdminApiResult<IAdminSsoTicketListData>(
		`/api/v1/admin/sso/tickets${createAdminSearchSuffix(searchParams)}`
	);
}

export function cleanupAdminSsoTickets(csrfToken: string, expiredAt?: number) {
	return fetchAdminApiResult<IAdminSsoTicketMutationData>(
		'/api/v1/admin/sso/tickets',
		createJsonRequestInit(
			'DELETE',
			expiredAt === undefined
				? { mode: 'cleanup-expired' }
				: { expired_at: expiredAt, mode: 'cleanup-expired' },
			csrfToken
		)
	);
}

export function revokeAdminSsoClientTickets(
	clientId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoTicketMutationData>(
		`/api/v1/admin/sso/tickets?client_id=${encodeURIComponent(clientId)}`,
		createJsonRequestInit(
			'DELETE',
			reason === undefined
				? { mode: 'revoke-client' }
				: { mode: 'revoke-client', reason },
			csrfToken
		)
	);
}

export function revokeAdminUserSsoTickets(
	userId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoTicketMutationData>(
		`/api/v1/admin/sso/tickets?user_id=${encodeURIComponent(userId)}`,
		createJsonRequestInit(
			'DELETE',
			reason === undefined
				? { mode: 'revoke-user' }
				: { mode: 'revoke-user', reason },
			csrfToken
		)
	);
}
