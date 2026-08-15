export function normalizePositiveInteger(value: number) {
	return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

export function buildPaginateRows<T>(
	rows: T[],
	page: number,
	rowsPerPage: number,
	totalPages: number
) {
	const currentPage = Math.min(normalizePositiveInteger(page), totalPages);
	const normalizedRowsPerPage = normalizePositiveInteger(rowsPerPage);
	const start = (currentPage - 1) * normalizedRowsPerPage;
	const end = start + normalizedRowsPerPage;

	return rows.slice(start, end);
}

export function getTotalPages(totalRows: number, rowsPerPage: number) {
	return Math.max(
		1,
		Math.ceil(totalRows / normalizePositiveInteger(rowsPerPage))
	);
}
