import type {
	IAdminSsoCallbackDeliveryCleanupData,
	IAdminSsoCallbackDeliveryListData,
	IAdminSsoCallbackQueueListData,
	IAdminSsoCallbackQueueMutationData,
	TAdminSsoCallbackDeliveryStatus,
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
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

export function listAdminSsoCallbacks(
	options: {
		clientId?: string;
		endTime?: number;
		event?: TAdminSsoCallbackEvent;
		page?: number;
		pageSize?: number;
		query?: string;
		startTime?: number;
		status?: TAdminSsoCallbackQueueStatus;
		userId?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'client_id', options.clientId);
	appendAdminStringSearchParam(searchParams, 'event', options.event);
	appendAdminNumberSearchParam(searchParams, 'start_time', options.startTime);
	appendAdminNumberSearchParam(searchParams, 'end_time', options.endTime);
	appendAdminStringSearchParam(searchParams, 'status', options.status);
	appendAdminStringSearchParam(searchParams, 'user_id', options.userId);

	return fetchAdminApiResult<IAdminSsoCallbackQueueListData>(
		`/api/v1/admin/sso/callbacks${createAdminSearchSuffix(searchParams)}`
	);
}

export function retryAdminSsoCallback(callbackId: number, csrfToken: string) {
	return fetchAdminApiResult<IAdminSsoCallbackQueueMutationData>(
		`/api/v1/admin/sso/callbacks/${encodeURIComponent(
			String(callbackId)
		)}/retry`,
		createAdminCsrfRequestInit('POST', csrfToken)
	);
}

export function discardAdminSsoCallback(callbackId: number, csrfToken: string) {
	return fetchAdminApiResult<IAdminSsoCallbackQueueMutationData>(
		`/api/v1/admin/sso/callbacks/${encodeURIComponent(String(callbackId))}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function dispatchAdminSsoCallbacks(csrfToken: string) {
	return fetchAdminApiResult<{
		deleted_expired_tickets: number;
		deleted_final_failed_callbacks: number;
		failed: number;
		final_failed: number;
		message: string;
		succeeded: number;
	}>(
		'/api/v1/admin/sso/callbacks/dispatch',
		createAdminCsrfRequestInit('POST', csrfToken)
	);
}

export function listAdminSsoCallbackDeliveries(
	options: {
		clientId?: string;
		endTime?: number;
		event?: TAdminSsoCallbackEvent;
		page?: number;
		pageSize?: number;
		query?: string;
		startTime?: number;
		status?: TAdminSsoCallbackDeliveryStatus;
		userId?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'client_id', options.clientId);
	appendAdminStringSearchParam(searchParams, 'event', options.event);
	appendAdminNumberSearchParam(searchParams, 'start_time', options.startTime);
	appendAdminNumberSearchParam(searchParams, 'end_time', options.endTime);
	appendAdminStringSearchParam(searchParams, 'status', options.status);
	appendAdminStringSearchParam(searchParams, 'user_id', options.userId);

	return fetchAdminApiResult<IAdminSsoCallbackDeliveryListData>(
		`/api/v1/admin/sso/callbacks/history${createAdminSearchSuffix(
			searchParams
		)}`
	);
}

export function cleanupAdminSsoCallbackDeliveries(
	csrfToken: string,
	options: { before?: number; maxRows?: number } = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'before', options.before);
	appendAdminNumberSearchParam(searchParams, 'max_rows', options.maxRows);

	return fetchAdminApiResult<IAdminSsoCallbackDeliveryCleanupData>(
		`/api/v1/admin/sso/callbacks/history${createAdminSearchSuffix(
			searchParams
		)}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}
