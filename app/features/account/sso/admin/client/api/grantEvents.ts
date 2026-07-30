import type {
	IAdminAuditLogListData,
	IAdminSsoGrantEventListData,
	TAdminSsoGrantEvent,
} from '@/features/account/contracts';
import { fetchAdminApiResult } from '@/features/admin/client/api';
import {
	appendAdminNumberSearchParam,
	appendAdminStringSearchParam,
	createAdminSearchSuffix,
} from '@/features/admin/client/searchParams';

type TAdminAuditActorType =
	IAdminAuditLogListData['logs'][number]['actor_type'];

export function listAdminSsoGrantEvents(
	options: {
		actorId?: string;
		actorType?: TAdminAuditActorType;
		clientId?: string;
		endTime?: number;
		event?: TAdminSsoGrantEvent;
		page?: number;
		pageSize?: number;
		query?: string;
		startTime?: number;
		userId?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'event', options.event);
	appendAdminStringSearchParam(searchParams, 'client_id', options.clientId);
	appendAdminStringSearchParam(searchParams, 'user_id', options.userId);
	appendAdminStringSearchParam(searchParams, 'actor_type', options.actorType);
	appendAdminStringSearchParam(searchParams, 'actor_id', options.actorId);
	appendAdminNumberSearchParam(searchParams, 'start_time', options.startTime);
	appendAdminNumberSearchParam(searchParams, 'end_time', options.endTime);

	return fetchAdminApiResult<IAdminSsoGrantEventListData>(
		`/api/v1/admin/sso/grant-events${createAdminSearchSuffix(searchParams)}`
	);
}
