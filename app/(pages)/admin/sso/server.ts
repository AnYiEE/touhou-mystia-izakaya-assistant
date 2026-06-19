import { cookies } from 'next/headers';

import { createAdminCsrfToken } from '@/lib/account/server/admin';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	authenticateAdminSessionToken,
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
	checkAdminFeatureGuard,
} from '@/lib/account/server/guards';
import { ACCOUNT_COOKIE_NAME_MAP } from '@/lib/account/shared/constants';
import {
	type IAdminAuditLogListData,
	type IAdminMeData,
	type IAdminSsoCallbackDeliveryListData,
	type IAdminSsoCallbackQueueListData,
	type IAdminSsoClientDetailData,
	type IAdminSsoClientListData,
	type IAdminSsoClientUsersData,
	type IAdminSsoGrantListData,
	type IAdminSsoTicketListData,
	type TAdminSsoCallbackDeliveryStatus,
	type TAdminSsoCallbackEvent,
	type TAdminSsoCallbackQueueStatus,
	type TAdminSsoTicketStatus,
	type TUserStatus,
} from '@/lib/account/shared/types';

type TAdminSsoClientCallbackFilter = 'configured' | 'missing';
type TAdminSsoClientStatusFilter = 'active' | 'disabled';

type TAdminAuditActorType =
	IAdminAuditLogListData['logs'][number]['actor_type'];

interface IAdminSsoPageListOptions {
	page?: number;
	pageSize?: number;
	query?: string;
}

interface IAdminSsoClientListInitialOptions extends IAdminSsoPageListOptions {
	callback?: TAdminSsoClientCallbackFilter;
	hasGrants?: boolean;
	status?: TAdminSsoClientStatusFilter;
}

interface IAdminSsoGrantListInitialOptions extends IAdminSsoPageListOptions {
	clientId?: string;
	clientStatus?: 'active' | 'disabled';
	userId?: string;
	userStatus?: TUserStatus;
}

interface IAdminSsoCallbackQueueInitialOptions extends IAdminSsoPageListOptions {
	clientId?: string;
	endTime?: number;
	event?: TAdminSsoCallbackEvent;
	startTime?: number;
	status?: TAdminSsoCallbackQueueStatus;
	userId?: string;
}

interface IAdminSsoCallbackDeliveryInitialOptions extends IAdminSsoPageListOptions {
	clientId?: string;
	endTime?: number;
	event?: TAdminSsoCallbackEvent;
	startTime?: number;
	status?: TAdminSsoCallbackDeliveryStatus;
	userId?: string;
}

interface IAdminSsoTicketListInitialOptions extends IAdminSsoPageListOptions {
	clientId?: string;
	status?: TAdminSsoTicketStatus;
	userId?: string;
}

interface IAdminAuditLogInitialOptions extends IAdminSsoPageListOptions {
	action?: string;
	actorId?: string;
	actorType?: TAdminAuditActorType;
	endTime?: number;
	scope?: string;
	startTime?: number;
	targetId?: string;
	targetType?: string;
}

function createInitialPageOptions(options: IAdminSsoPageListOptions) {
	return {
		page: options.page ?? 1,
		pageSize: options.pageSize ?? 20,
		...(options.query === undefined ? {} : { query: options.query }),
	};
}

export interface IAdminSsoAuthInitialData {
	admin: IAdminMeData | null;
	message: string | null;
}

export async function readAdminSsoAuthInitialData(
	pathname: string
): Promise<IAdminSsoAuthInitialData> {
	const accountFeatureResult = await checkAccountFeatureGuard();
	if (accountFeatureResult.status === 'error') {
		return { admin: null, message: accountFeatureResult.message };
	}

	const adminFeatureResult = checkAdminFeatureGuard();
	if (adminFeatureResult.status === 'error') {
		return { admin: null, message: adminFeatureResult.message };
	}

	const request = await createCurrentRequest(pathname);
	const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
	if (cookieSecurityResult.status === 'error') {
		return { admin: null, message: cookieSecurityResult.message };
	}

	const cookieStore = await cookies();
	const adminSessionToken =
		cookieStore.get(ACCOUNT_COOKIE_NAME_MAP.adminSession)?.value ?? null;
	const adminAuthResult = authenticateAdminSessionToken(adminSessionToken);
	if (adminAuthResult.status === 'error') {
		return {
			admin: null,
			message:
				adminAuthResult.message === 'unauthorized'
					? null
					: adminAuthResult.message,
		};
	}

	return {
		admin: {
			csrf_token: createAdminCsrfToken(adminAuthResult.data.token),
			username: adminAuthResult.data.payload.username,
		},
		message: null,
	};
}

export async function readAdminSsoClientsInitialData(
	options: IAdminSsoClientListInitialOptions = {}
): Promise<IAdminSsoClientListData> {
	const serviceModule =
		await import('@/lib/account/server/adminSsoClientService');
	const result = await serviceModule.listAdminSsoClients({
		...createInitialPageOptions(options),
		...(options.callback === undefined
			? {}
			: { callback: options.callback }),
		...(options.hasGrants === undefined
			? {}
			: { hasGrants: options.hasGrants }),
		...(options.status === undefined ? {} : { status: options.status }),
	});
	if (result.status === 'error') {
		throw new Error(result.error);
	}

	return result.data;
}

export async function readAdminSsoGrantListInitialData(
	options: IAdminSsoGrantListInitialOptions = {}
): Promise<IAdminSsoGrantListData> {
	const serviceModule =
		await import('@/lib/account/server/adminSsoGrantService');
	const result = await serviceModule.listAdminSsoGrantRelations({
		...createInitialPageOptions(options),
		...(options.clientId === undefined
			? {}
			: { clientId: options.clientId }),
		...(options.clientStatus === undefined
			? {}
			: { clientStatus: options.clientStatus }),
		...(options.userId === undefined ? {} : { userId: options.userId }),
		...(options.userStatus === undefined
			? {}
			: { userStatus: options.userStatus }),
	});
	if (result.status === 'error') {
		throw new Error(result.error);
	}

	return result.data;
}

export async function readAdminSsoCallbackQueueInitialData(
	options: IAdminSsoCallbackQueueInitialOptions = {}
): Promise<IAdminSsoCallbackQueueListData> {
	const serviceModule =
		await import('@/lib/account/server/adminSsoCallbackService');
	const result = await serviceModule.listAdminSsoCallbackQueueRecords({
		...createInitialPageOptions(options),
		...(options.clientId === undefined
			? {}
			: { clientId: options.clientId }),
		...(options.endTime === undefined ? {} : { endTime: options.endTime }),
		...(options.event === undefined ? {} : { event: options.event }),
		...(options.startTime === undefined
			? {}
			: { startTime: options.startTime }),
		...(options.status === undefined ? {} : { status: options.status }),
		...(options.userId === undefined ? {} : { userId: options.userId }),
	});
	if (result.status === 'error') {
		throw new Error(result.error);
	}

	return result.data;
}

export async function readAdminSsoCallbackDeliveryInitialData(
	options: IAdminSsoCallbackDeliveryInitialOptions = {}
): Promise<IAdminSsoCallbackDeliveryListData> {
	const serviceModule =
		await import('@/lib/account/server/adminSsoCallbackService');
	const result = await serviceModule.listAdminSsoCallbackDeliveries({
		...createInitialPageOptions(options),
		...(options.clientId === undefined
			? {}
			: { clientId: options.clientId }),
		...(options.endTime === undefined ? {} : { endTime: options.endTime }),
		...(options.event === undefined ? {} : { event: options.event }),
		...(options.startTime === undefined
			? {}
			: { startTime: options.startTime }),
		...(options.status === undefined ? {} : { status: options.status }),
		...(options.userId === undefined ? {} : { userId: options.userId }),
	});
	if (result.status === 'error') {
		throw new Error(result.error);
	}

	return result.data;
}

export async function readAdminSsoTicketListInitialData(
	options: IAdminSsoTicketListInitialOptions = {}
): Promise<IAdminSsoTicketListData> {
	const serviceModule =
		await import('@/lib/account/server/adminSsoTicketService');
	const result = await serviceModule.listAdminSsoTicketRecords({
		...createInitialPageOptions(options),
		...(options.clientId === undefined
			? {}
			: { clientId: options.clientId }),
		...(options.status === undefined ? {} : { status: options.status }),
		...(options.userId === undefined ? {} : { userId: options.userId }),
	});
	if (result.status === 'error') {
		throw new Error(result.error);
	}

	return result.data;
}

export async function readAdminAuditLogInitialData(
	options: IAdminAuditLogInitialOptions = {}
): Promise<IAdminAuditLogListData> {
	const serviceModule =
		await import('@/lib/account/server/adminAuditService');
	const result = await serviceModule.listAdminAuditLogs({
		...createInitialPageOptions(options),
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

export async function readAdminSsoClientInitialData(
	id: string
): Promise<IAdminSsoClientDetailData | null> {
	const serviceModule =
		await import('@/lib/account/server/adminSsoClientService');
	const result = await serviceModule.getAdminSsoClient(id);

	return result.status === 'error' ? null : result.data;
}

export async function readAdminSsoClientUsersInitialData(
	id: string
): Promise<IAdminSsoClientUsersData> {
	const serviceModule =
		await import('@/lib/account/server/adminSsoGrantService');
	const result = await serviceModule.listAdminSsoClientUsers(id, {
		page: 1,
		pageSize: 20,
	});
	if (result.status === 'error') {
		throw new Error(result.error);
	}

	return result.data;
}
