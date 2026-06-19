export const ADMIN_SSO_LIST_MAX_OFFSET = 5000;

export interface IAdminSsoPaginationInput {
	page: number;
	pageSize: number;
}

export function checkAdminSsoPagination({
	page,
	pageSize,
}: IAdminSsoPaginationInput) {
	return (
		Number.isSafeInteger(page) &&
		page >= 1 &&
		Number.isSafeInteger(pageSize) &&
		pageSize >= 1 &&
		pageSize <= 100 &&
		(page - 1) * pageSize <= ADMIN_SSO_LIST_MAX_OFFSET
	);
}

export function getReachableAdminSsoTotalCount(
	totalCount: number,
	pageSize: number
) {
	return Math.min(totalCount, ADMIN_SSO_LIST_MAX_OFFSET + pageSize);
}
