export const ADMIN_LIST_MAX_OFFSET = 5000;

export interface IAdminPaginationInput {
	page: number;
	pageSize: number;
}

export function checkAdminPagination({
	page,
	pageSize,
}: IAdminPaginationInput) {
	return (
		Number.isSafeInteger(page) &&
		page >= 1 &&
		Number.isSafeInteger(pageSize) &&
		pageSize >= 1 &&
		pageSize <= 100 &&
		(page - 1) * pageSize <= ADMIN_LIST_MAX_OFFSET
	);
}

export function getReachableAdminTotalCount(
	totalCount: number,
	pageSize: number
) {
	return Math.min(totalCount, ADMIN_LIST_MAX_OFFSET + pageSize);
}
