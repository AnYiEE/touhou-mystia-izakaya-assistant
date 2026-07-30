import { type TUserStatus } from '@/domain/account/contracts';

import type { IAdminListLocationState } from './contracts';

export interface IAdminLocationState {
	action?: string;
	actorId?: string;
	actorType?: string;
	callback?: string;
	clientId?: string;
	clientStatus?: string;
	endTime?: number;
	event?: string;
	grant?: '' | 'has' | 'none';
	page?: number;
	query?: string;
	scope?: string;
	startTime?: number;
	status?: string;
	targetId?: string;
	targetType?: string;
	userId?: string;
	userStatus?: string;
}

interface ISearchParamSource {
	toString: () => string;
}

export function getAdminListPageFromSearchValue(value: string | null) {
	const page = Number.parseInt(value ?? '', 10);

	return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function getAdminListStatusFromSearchValue(
	value: string | null
): TUserStatus | '' {
	switch (value) {
		case 'active':
		case 'deleted':
		case 'disabled':
			return value;
		default:
			return '';
	}
}

function createAdminListSearchParams({
	page,
	query,
	status,
}: IAdminListLocationState) {
	const params = new URLSearchParams();

	if (page > 1) {
		params.set('page', String(page));
	}
	if (query.length > 0) {
		params.set('query', query);
	}
	if (status !== '') {
		params.set('status', status);
	}

	return params;
}

export function getAdminListHref(state: IAdminListLocationState) {
	const search = createAdminListSearchParams(state).toString();

	return search.length === 0 ? '/admin' : `/admin?${search}`;
}

export function getAdminUserDetailHref(
	userId: string,
	state: IAdminListLocationState
) {
	const search = createAdminListSearchParams(state).toString();
	const pathname = `/admin/users/${encodeURIComponent(userId)}`;

	return search.length === 0 ? pathname : `${pathname}?${search}`;
}

function setTrimmedSearchParam(
	params: URLSearchParams,
	name: string,
	value: string | undefined
) {
	const trimmedValue = value?.trim() ?? '';

	if (trimmedValue.length > 0) {
		params.set(name, trimmedValue);
	}
}

function setTimestampSearchParam(
	params: URLSearchParams,
	name: string,
	value: number | undefined
) {
	if (value !== undefined && Number.isSafeInteger(value) && value >= 0) {
		params.set(name, String(value));
	}
}

function createAdminSearchParams(state: IAdminLocationState) {
	const params = new URLSearchParams();

	if (state.page !== undefined && state.page > 1) {
		params.set('page', String(state.page));
	}
	setTrimmedSearchParam(params, 'query', state.query);
	setTrimmedSearchParam(params, 'status', state.status);
	setTrimmedSearchParam(params, 'callback', state.callback);
	if (state.grant === 'has') {
		params.set('has_grants', '1');
	} else if (state.grant === 'none') {
		params.set('has_grants', '0');
	}
	setTrimmedSearchParam(params, 'client_id', state.clientId);
	setTrimmedSearchParam(params, 'user_id', state.userId);
	setTrimmedSearchParam(params, 'client_status', state.clientStatus);
	setTrimmedSearchParam(params, 'user_status', state.userStatus);
	setTrimmedSearchParam(params, 'event', state.event);
	setTimestampSearchParam(params, 'start_time', state.startTime);
	setTimestampSearchParam(params, 'end_time', state.endTime);
	setTrimmedSearchParam(params, 'scope', state.scope);
	setTrimmedSearchParam(params, 'action', state.action);
	setTrimmedSearchParam(params, 'actor_id', state.actorId);
	setTrimmedSearchParam(params, 'actor_type', state.actorType);
	setTrimmedSearchParam(params, 'target_id', state.targetId);
	setTrimmedSearchParam(params, 'target_type', state.targetType);

	return params;
}

export function createAdminHref(
	pathname: string,
	state: IAdminLocationState = {}
) {
	const search = createAdminSearchParams(state).toString();

	return search.length === 0 ? pathname : `${pathname}?${search}`;
}

export function createAdminHrefFromSearchParams(
	pathname: string,
	searchParams: ISearchParamSource
) {
	const search = searchParams.toString();

	return search.length === 0 ? pathname : `${pathname}?${search}`;
}
