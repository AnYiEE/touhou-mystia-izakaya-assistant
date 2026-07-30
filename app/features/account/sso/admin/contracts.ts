import { type TUserStatus } from '@/domain/account/contracts';

import type {
	IAdminMeData,
	IAdminSsoCallbackDeliveryListData,
	IAdminSsoCallbackQueueListData,
	IAdminSsoClientListData,
	IAdminSsoClientProfile,
	IAdminSsoClientUsersData,
	IAdminSsoGrantListData,
	IAdminSsoTicketListData,
	TAdminSsoCallbackDeliveryStatus,
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
	TAdminSsoTicketStatus,
} from '@/features/account/contracts';
import type { TAdminApiResult } from '@/features/admin/contracts';

export type TAdminSsoClientApiResult<TData = Record<string, unknown>> =
	TAdminApiResult<TData>;

export interface IAdminSsoClientsInitialData {
	admin: IAdminMeData | null;
	callback: '' | 'configured' | 'missing';
	clients: IAdminSsoClientListData | null;
	grant: '' | 'has' | 'none';
	isAuthLoading: boolean;
	message: string | null;
	query: string;
	renderedAt: number;
	status: '' | 'active' | 'disabled';
}

export interface IAdminSsoClientFormInitialData {
	admin: IAdminMeData | null;
	client: IAdminSsoClientProfile | null;
	clientUsers: IAdminSsoClientUsersData | null;
	isAuthLoading: boolean;
	isClientServerLoaded: boolean;
	loadError: string | null;
	message: string | null;
}

export interface IAdminSsoCallbacksInitialData {
	admin: IAdminMeData | null;
	callbacks: IAdminSsoCallbackQueueListData | null;
	clientId: string;
	endTime?: number;
	event: '' | TAdminSsoCallbackEvent;
	isAuthLoading: boolean;
	message: string | null;
	query: string;
	renderedAt: number;
	startTime?: number;
	status: '' | TAdminSsoCallbackQueueStatus;
	userId: string;
}

export interface IAdminSsoCallbackHistoryInitialData {
	admin: IAdminMeData | null;
	clientId: string;
	deliveries: IAdminSsoCallbackDeliveryListData | null;
	endTime?: number;
	event: '' | TAdminSsoCallbackEvent;
	isAuthLoading: boolean;
	message: string | null;
	query: string;
	renderedAt: number;
	startTime?: number;
	status: '' | TAdminSsoCallbackDeliveryStatus;
	userId: string;
}

export interface IAdminSsoGrantsInitialData {
	admin: IAdminMeData | null;
	clientId: string;
	clientStatus: '' | 'active' | 'disabled';
	grants: IAdminSsoGrantListData | null;
	isAuthLoading: boolean;
	message: string | null;
	query: string;
	renderedAt: number;
	userId: string;
	userStatus: '' | TUserStatus;
}

export interface IAdminSsoTicketsInitialData {
	admin: IAdminMeData | null;
	clientId: string;
	isAuthLoading: boolean;
	message: string | null;
	query: string;
	renderedAt: number;
	status: '' | TAdminSsoTicketStatus;
	tickets: IAdminSsoTicketListData | null;
	userId: string;
}
