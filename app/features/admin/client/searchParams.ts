export function appendAdminNumberSearchParam(
	searchParams: URLSearchParams,
	name: string,
	value: number | undefined
) {
	if (typeof value === 'number') {
		searchParams.set(name, String(value));
	}
}

export function appendAdminStringSearchParam(
	searchParams: URLSearchParams,
	name: string,
	value: string | undefined
) {
	if (typeof value === 'string' && value !== '') {
		searchParams.set(name, value);
	}
}

export function createAdminSearchSuffix(searchParams: URLSearchParams) {
	const queryString = searchParams.toString();

	return queryString === '' ? '' : `?${queryString}`;
}
