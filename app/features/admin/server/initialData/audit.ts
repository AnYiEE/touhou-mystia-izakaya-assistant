import type { IAdminAuditLogListData } from '@/features/account/contracts';
import type { IAdminAuditInitialData } from '@/features/admin/contracts';
import { ADMIN_MESSAGE_MAP } from '@/features/admin/copy';
import {
	type IAdminSearchParams,
	getAdminActorTypeFromSearchValue,
	getAdminPageFromSearchValue,
	getAdminSingleSearchValue,
	getAdminTimeFromSearchValue,
	getAdminTrimmedSearchValue,
} from '@/features/admin/searchParams';

import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from './auth';

type TAdminAuditActorType =
	IAdminAuditLogListData['logs'][number]['actor_type'];
type TAdminAuditScope = 'account' | 'sso';

interface IAdminAuditLogInitialOptions {
	action?: string;
	actorId?: string;
	actorType?: TAdminAuditActorType;
	endTime?: number;
	page?: number;
	pageSize?: number;
	query?: string;
	scope?: string;
	startTime?: number;
	targetId?: string;
	targetType?: string;
}

function getAdminAuditScopeFromSearchValue(
	value: string | string[] | undefined
): TAdminAuditScope | undefined {
	const searchValue = getAdminSingleSearchValue(value);
	switch (searchValue) {
		case 'account':
		case 'sso':
			return searchValue;
		default:
			return undefined;
	}
}

async function readAdminAuditLogInitialData(
	options: IAdminAuditLogInitialOptions = {}
): Promise<IAdminAuditLogListData> {
	const serviceModule =
		await import('@/features/account/admin/server/audit/service');
	const result = await serviceModule.listAdminAuditLogs({
		page: options.page ?? 1,
		pageSize: options.pageSize ?? 20,
		...(options.action === undefined ? {} : { action: options.action }),
		...(options.actorId === undefined ? {} : { actorId: options.actorId }),
		...(options.actorType === undefined
			? {}
			: { actorType: options.actorType }),
		...(options.endTime === undefined ? {} : { endTime: options.endTime }),
		...(options.query === undefined ? {} : { query: options.query }),
		...(options.scope === undefined ? {} : { scope: options.scope }),
		...(options.startTime === undefined
			? {}
			: { startTime: options.startTime }),
		...(options.targetId === undefined
			? {}
			: { targetId: options.targetId }),
		...(options.targetType === undefined
			? {}
			: { targetType: options.targetType }),
	});
	if (result.status === 'error') {
		throw new Error(result.error);
	}

	return result.data;
}

export async function readAdminAuditInitialData(
	searchParams: Promise<IAdminSearchParams>
): Promise<IAdminAuditInitialData> {
	const resolvedSearchParams = await searchParams;
	const page = getAdminPageFromSearchValue(resolvedSearchParams.page);
	const action = getAdminTrimmedSearchValue(resolvedSearchParams.action);
	const actorId = getAdminTrimmedSearchValue(resolvedSearchParams.actor_id);
	const actorType = getAdminActorTypeFromSearchValue(
		resolvedSearchParams.actor_type
	);
	const scope = getAdminAuditScopeFromSearchValue(resolvedSearchParams.scope);
	const targetId = getAdminTrimmedSearchValue(resolvedSearchParams.target_id);
	const targetType = getAdminTrimmedSearchValue(
		resolvedSearchParams.target_type
	);
	const query = getAdminTrimmedSearchValue(resolvedSearchParams.query);
	const startTime = getAdminTimeFromSearchValue(
		resolvedSearchParams.start_time
	);
	const endTime = getAdminTimeFromSearchValue(resolvedSearchParams.end_time);
	const authResult = await readAdminAuthInitialData('/admin/audit');
	const initialData: IAdminAuditInitialData = {
		action: action ?? '',
		actorId: actorId ?? '',
		actorType: actorType ?? '',
		admin: authResult.admin,
		isAuthLoading: false,
		logs: null,
		message: getAdminAuthInitialDataMessage(authResult),
		query: query ?? '',
		renderedAt: Date.now(),
		scope: scope ?? '',
		targetId: targetId ?? '',
		targetType: targetType ?? '',
		...(endTime === undefined ? {} : { endTime }),
		...(startTime === undefined ? {} : { startTime }),
	};

	if (authResult.admin === null) {
		return initialData;
	}

	try {
		return {
			...initialData,
			logs: await readAdminAuditLogInitialData({
				page,
				...(action === undefined ? {} : { action }),
				...(actorId === undefined ? {} : { actorId }),
				...(actorType === undefined ? {} : { actorType }),
				...(endTime === undefined ? {} : { endTime }),
				...(query === undefined ? {} : { query }),
				...(scope === undefined ? {} : { scope }),
				...(startTime === undefined ? {} : { startTime }),
				...(targetId === undefined ? {} : { targetId }),
				...(targetType === undefined ? {} : { targetType }),
			}),
		};
	} catch (error) {
		return {
			...initialData,
			message:
				error instanceof Error
					? error.message
					: ADMIN_MESSAGE_MAP.auditLogReadFailed,
		};
	}
}
