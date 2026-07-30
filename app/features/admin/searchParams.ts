export type TAdminSearchParamValue = string | string[] | undefined;

export interface IAdminSearchParams {
	[key: string]: TAdminSearchParamValue;

	action?: TAdminSearchParamValue;
	actor_id?: TAdminSearchParamValue;
	actor_type?: TAdminSearchParamValue;
	end_time?: TAdminSearchParamValue;
	page?: TAdminSearchParamValue;
	query?: TAdminSearchParamValue;
	scope?: TAdminSearchParamValue;
	start_time?: TAdminSearchParamValue;
	status?: TAdminSearchParamValue;
	target_id?: TAdminSearchParamValue;
	target_type?: TAdminSearchParamValue;
}

export type TAdminActorType = 'admin' | 'client' | 'system' | 'user';

export function getAdminSingleSearchValue(value: TAdminSearchParamValue) {
	return Array.isArray(value) ? value[0] : value;
}

export function getAdminPageFromSearchValue(value: TAdminSearchParamValue) {
	const page = Number.parseInt(getAdminSingleSearchValue(value) ?? '', 10);

	return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10_000) : 1;
}

export function getAdminTrimmedSearchValue(value: TAdminSearchParamValue) {
	const trimmedValue = getAdminSingleSearchValue(value)?.trim() ?? '';

	return trimmedValue === '' ? undefined : trimmedValue;
}

export function getAdminActorTypeFromSearchValue(
	value: TAdminSearchParamValue
): TAdminActorType | undefined {
	const searchValue = getAdminSingleSearchValue(value);
	switch (searchValue) {
		case 'admin':
		case 'client':
		case 'system':
		case 'user':
			return searchValue;
		default:
			return undefined;
	}
}

export function getAdminTimeFromSearchValue(value: TAdminSearchParamValue) {
	const timestamp = Number.parseInt(
		getAdminSingleSearchValue(value) ?? '',
		10
	);

	return Number.isSafeInteger(timestamp) && timestamp >= 0
		? timestamp
		: undefined;
}
