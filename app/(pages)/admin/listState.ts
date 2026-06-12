import { type TUserStatus } from '@/lib/account/shared/types';

export interface IAdminListLocationState {
	page: number;
	query: string;
	status: TUserStatus | '';
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
