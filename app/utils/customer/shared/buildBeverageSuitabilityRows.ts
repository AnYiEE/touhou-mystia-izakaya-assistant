import { type TBeverageTag } from '@/data';
import {
	checkArraySubsetOf,
	checkLengthEmpty,
	copyArray,
	numberSort,
	pinyinSort,
} from '@/utilities';
import type { Beverage } from '@/utils';
import type { TBeverage } from '@/utils/types';

import type {
	IBeverageSuitabilityRowsResult,
	ITableSortDescriptor,
	TBeverageSuitabilityRow,
	TBeverageTableSortKey,
	TSearchMatcher,
} from './types';

export interface IBuildBeverageSuitabilityRowsArgs {
	beverageInstance: Beverage;
	customerBeverageTags?: ReadonlyArray<TBeverageTag> | null;
	hiddenBeverages: ReadonlySet<TBeverage['name']>;
	hiddenDlcs: ReadonlySet<TBeverage['dlc']>;
	matchSearch: TSearchMatcher;
	page: number;
	rowsPerPage: number;
	searchValue?: string;
	selectedBeverageTags?: ReadonlyArray<TBeverageTag>;
	selectedDlcs?: ReadonlyArray<string>;
	sortDescriptor: ITableSortDescriptor<TBeverageTableSortKey>;
}

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

function paginateRows<T>(rows: T[], page: number, rowsPerPage: number) {
	const start = (page - 1) * rowsPerPage;
	const end = start + rowsPerPage;

	return rows.slice(start, end);
}

/**
 * 从 beverage 原始数据构建表格需要的 suitability 行数据，并保留现有过滤与排序顺序。
 */
export function buildBeverageSuitabilityRows({
	beverageInstance,
	customerBeverageTags,
	hiddenBeverages,
	hiddenDlcs,
	matchSearch,
	page,
	rowsPerPage,
	searchValue = '',
	selectedBeverageTags = [],
	selectedDlcs = [],
	sortDescriptor,
}: IBuildBeverageSuitabilityRowsArgs): IBeverageSuitabilityRowsResult {
	const data: TBeverageSuitabilityRow[] = beverageInstance
		.buildBeverageSuitabilityRows(customerBeverageTags)
		.filter(({ dlc }) => !hiddenDlcs.has(dlc));

	let filteredRows: TBeverageSuitabilityRow[];

	if (customerBeverageTags === null || customerBeverageTags === undefined) {
		filteredRows = data;
	} else {
		const dataWithRealSuitability = data.filter(
			({ name }) => !hiddenBeverages.has(name)
		);

		const hasNameFilter = Boolean(searchValue);
		const shouldFilterByTableOptions =
			hasNameFilter ||
			!checkLengthEmpty(selectedBeverageTags) ||
			!checkLengthEmpty(selectedDlcs);

		filteredRows = shouldFilterByTableOptions
			? dataWithRealSuitability.filter(({ dlc, name, pinyin, tags }) => {
					const isNameMatched = hasNameFilter
						? matchSearch(searchValue, { name, pinyin })
						: true;
					const isDlcMatched =
						checkLengthEmpty(selectedDlcs) ||
						selectedDlcs.includes(dlc.toString());
					const isTagsMatched =
						checkLengthEmpty(selectedBeverageTags) ||
						checkArraySubsetOf(selectedBeverageTags, tags);

					return isNameMatched && isDlcMatched && isTagsMatched;
				})
			: dataWithRealSuitability;
	}

	const sortedRows = sortBeverageRows(filteredRows, sortDescriptor);
	const pagedRows = paginateRows(sortedRows, page, rowsPerPage);

	return {
		filteredRows,
		pagedRows,
		sortedRows,
		totalPages: Math.ceil(filteredRows.length / rowsPerPage),
	};
}
