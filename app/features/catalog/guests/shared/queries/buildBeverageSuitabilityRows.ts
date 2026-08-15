import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import { type BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import type { TBeverage } from '@/domain/catalog/food/types';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TBeverageTagId } from '@/domain/data/tags/types';

import type {
	IBeverageSuitabilityRowsResult,
	TBeverageSuitabilityRow,
} from '@/features/catalog/guests/shared/contracts';
import {
	type ITableSortDescriptor,
	type TBeverageTableSortKey,
} from '@/features/catalog/guests/shared/state/tableDescriptors';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { type TSearchMatcher } from '@/shared/utilities/search/matchPinyinName';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import {
	buildPaginateRows,
	getTotalPages,
	normalizePositiveInteger,
} from './pagination';

function sortBeverageRows(
	rows: TBeverageSuitabilityRow[],
	sortDescriptor: ITableSortDescriptor<TBeverageTableSortKey>
) {
	const { column, direction } = sortDescriptor;
	const isAscending = direction === 'ascending';

	switch (column) {
		case 'beverage':
			return rows.toSorted(({ name: a }, { name: b }) =>
				isAscending ? pinyinSort(a, b) : pinyinSort(b, a)
			);
		case 'price':
			return rows.toSorted(({ price: a }, { price: b }) =>
				isAscending ? numberSort(a, b) : numberSort(b, a)
			);
		case 'suitability':
			return rows.toSorted(({ suitability: a }, { suitability: b }) =>
				isAscending ? numberSort(a, b) : numberSort(b, a)
			);
		default:
			return rows;
	}
}

export function buildBeverageSuitabilityRows({
	beverageCatalog,
	guestBeverageTags,
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
	beverageCatalog: BeverageCatalog;
	guestBeverageTags?: ReadonlyArray<TBeverageTagId> | null;
	hiddenBeverages: ReadonlySet<TBeverageId>;
	hiddenDlcs: ReadonlySet<TBeverage['dlc']>;
	matchSearch: TSearchMatcher;
	page: number;
	rowsPerPage: number;
	searchValue?: string;
	selectedAvailabilityDlcs?: ReadonlyArray<string>;
	selectedBeverageTags?: ReadonlyArray<TBeverageTagId>;
	sortDescriptor: ITableSortDescriptor<TBeverageTableSortKey>;
}): IBeverageSuitabilityRowsResult {
	const data: TBeverageSuitabilityRow[] = beverageCatalog
		.buildBeverageSuitabilityRows(guestBeverageTags)
		.filter(({ availabilityPaths }) =>
			isAvailableWithHiddenDlcs(availabilityPaths, hiddenDlcs)
		);
	const dataWithVisibleRows = data.filter(
		({ id }) => !hiddenBeverages.has(id)
	);

	const hasNameFilter = Boolean(searchValue);
	const shouldFilterByTableOptions =
		hasNameFilter ||
		!checkLengthEmpty(selectedAvailabilityDlcs) ||
		!checkLengthEmpty(selectedBeverageTags);

	const filteredRows = shouldFilterByTableOptions
		? dataWithVisibleRows.filter(
				({ availabilityDlcs, name, pinyin, tags }) => {
					const beverageTags: ReadonlyArray<TBeverageTagId> = tags;
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
						selectedBeverageTags.every((tag) =>
							beverageTags.includes(tag)
						);

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
