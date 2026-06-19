export type TAdminSsoClientStatusLocationFilter = '' | 'active' | 'disabled';
export type TAdminSsoCallbackConfigLocationFilter =
	| ''
	| 'configured'
	| 'missing';
export type TAdminSsoGrantPresenceLocationFilter = '' | 'has' | 'none';

export interface IAdminSsoLocationState {
	action?: string;
	actorId?: string;
	actorType?: string;
	callback?: TAdminSsoCallbackConfigLocationFilter;
	clientId?: string;
	clientStatus?: string;
	endTime?: number;
	event?: string;
	grant?: TAdminSsoGrantPresenceLocationFilter;
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

export function createAdminSsoSearchParams(state: IAdminSsoLocationState) {
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

export function createAdminSsoHref(
	pathname: string,
	state: IAdminSsoLocationState = {}
) {
	const search = createAdminSsoSearchParams(state).toString();

	return search.length === 0 ? pathname : `${pathname}?${search}`;
}

export function createAdminSsoClientDetailHref(
	clientId: string,
	state: IAdminSsoLocationState
) {
	return createAdminSsoHref(
		`/admin/sso/${encodeURIComponent(clientId)}`,
		state
	);
}

export function createAdminSsoClientListHrefFromSearchParams(
	searchParams: ISearchParamSource
) {
	const search = searchParams.toString();

	return search.length === 0 ? '/admin/sso' : `/admin/sso?${search}`;
}
