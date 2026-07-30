import {
	type IAdminLocationState,
	createAdminHref,
	createAdminHrefFromSearchParams,
} from '@/features/admin/navigation';

export type TAdminSsoClientStatusLocationFilter = '' | 'active' | 'disabled';
export type TAdminSsoCallbackConfigLocationFilter =
	| ''
	| 'configured'
	| 'missing';
export type TAdminSsoGrantPresenceLocationFilter = '' | 'has' | 'none';

export interface IAdminSsoLocationState extends IAdminLocationState {
	callback?: TAdminSsoCallbackConfigLocationFilter;
	grant?: TAdminSsoGrantPresenceLocationFilter;
}

interface ISearchParamSource {
	toString: () => string;
}

export function createAdminSsoClientDetailHref(
	clientId: string,
	state: IAdminSsoLocationState
) {
	return createAdminHref(`/admin/sso/${encodeURIComponent(clientId)}`, state);
}

export function createAdminSsoClientListHrefFromSearchParams(
	searchParams: ISearchParamSource
) {
	return createAdminHrefFromSearchParams('/admin/sso', searchParams);
}
