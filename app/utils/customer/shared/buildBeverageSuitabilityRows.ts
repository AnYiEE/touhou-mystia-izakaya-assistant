import { type TBeverageTag } from '@/data';
import {
	type TSearchMatcher,
	checkArraySubsetOf,
	checkLengthEmpty,
	copyArray,
	numberSort,
	pinyinSort,
} from '@/utilities';
import { type Beverage } from '@/utils';
import { isAvailableWithHiddenDlcs } from '@/utils/availability';
import type { TBeverage } from '@/utils/types';

import {
	buildPaginateRows,
	getTotalPages,
	normalizePositiveInteger,
} from './getPaginateMeta';
import type {
	IBeverageSuitabilityRowsResult,
	ITableSortDescriptor,
	TBeverageSuitabilityRow,
	TBeverageTableSortKey,
} from './types';

function sortBeverageRows(
	rows: TBeverageSuitabilityRow[],
	sortDescriptor: ITableSortDescriptor<TBeverageTableSortKey>
) {
	const { column, direction } = sortDescriptor;
	const isAscending = direction === 'ascending';

	switch (column) {
		case 'beverage':
			return copyArray(rows).sort(({ name: a }, { name: b }) =>
				isAscending ? pinyinSort(a, b) : pinyinSort(b, a)
			);
		case 'price':
			return copyArray(rows).sort(({ price: a }, { price: b }) =>
				isAscending ? numberSort(a, b) : numberSort(b, a)
			);
		case 'suitability':
			return copyArray(rows).sort(
				({ suitability: a }, { suitability: b }) =>
					isAscending ? numberSort(a, b) : numberSort(b, a)
			);
		default:
			return rows;
	}
}

export function buildBeverageSuitabilityRows({
	beverageInstance,
	customerBeverageTags,
	hiddenBeverages,
	hiddenDlcs,
	matchSearch,
	page,
	rowsPerPage,
	searchValue = '',
	selectedAvailabilityDlcs = [],
	selectedBeverageTags = [],
	sortDescriptor,
}: {
	beverageInstance: Beverage;
	customerBeverageTags?: ReadonlyArray<TBeverageTag> | null;
	hiddenBeverages: ReadonlySet<TBeverage['name']>;
	hiddenDlcs: ReadonlySet<TBeverage['dlc']>;
	matchSearch: TSearchMatcher;
	page: number;
	rowsPerPage: number;
	searchValue?: string;
	selectedAvailabilityDlcs?: ReadonlyArray<string>;
	selectedBeverageTags?: ReadonlyArray<TBeverageTag>;
	sortDescriptor: ITableSortDescriptor<TBeverageTableSortKey>;
}): IBeverageSuitabilityRowsResult {
	const data: TBeverageSuitabilityRow[] = beverageInstance
		.buildBeverageSuitabilityRows(customerBeverageTags)
		.filter(({ availabilityPaths }) =>
			isAvailableWithHiddenDlcs(availabilityPaths, hiddenDlcs)
		);
	const dataWithVisibleRows = data.filter(
		({ name }) => !hiddenBeverages.has(name)
	);

	const hasNameFilter = Boolean(searchValue);
	const shouldFilterByTableOptions =
		hasNameFilter ||
		!checkLengthEmpty(selectedAvailabilityDlcs) ||
		!checkLengthEmpty(selectedBeverageTags);

	const filteredRows = shouldFilterByTableOptions
		? dataWithVisibleRows.filter(
				({ availabilityDlcs, name, pinyin, tags }) => {
					const isNameMatched = hasNameFilter
						? matchSearch(searchValue, { name, pinyin })
						: true;
					const isAvailabilityDlcMatched =
						checkLengthEmpty(selectedAvailabilityDlcs) ||
						availabilityDlcs.some((value) =>
							selectedAvailabilityDlcs.includes(value.toString())
						);
					const isTagsMatched =
						checkLengthEmpty(selectedBeverageTags) ||
						checkArraySubsetOf(selectedBeverageTags, tags);

					return (
						isNameMatched &&
						isAvailabilityDlcMatched &&
						isTagsMatched
					);
				}
			)
		: dataWithVisibleRows;

	const sortedRows = sortBeverageRows(filteredRows, sortDescriptor);
	const normalizedRowsPerPage = normalizePositiveInteger(rowsPerPage);
	const totalPages = getTotalPages(
		filteredRows.length,
		normalizedRowsPerPage
	);
	const pagedRows = buildPaginateRows(
		sortedRows,
		page,
		normalizedRowsPerPage,
		totalPages
	);

	return { filteredRows, pagedRows, sortedRows, totalPages };
}
