import type { ITableSortDescriptor } from '@/utils/customer/shared';

import { reverseDirection } from './reverseDirection';

export function applyTableSortChange<T extends string>(
	config: Required<ITableSortDescriptor<T>>,
	previous: ITableSortDescriptor<T>
) {
	const { column, direction } = config;
	const { lastColumn, time } = previous;
	const isSameColumn = column === lastColumn;

	if (time !== undefined && isSameColumn && time % 2 === 0) {
		return {} as ITableSortDescriptor<T>;
	}

	return {
		column,
		direction:
			(column === 'price' || column === 'suitability') && !isSameColumn
				? reverseDirection(direction)
				: direction,
		lastColumn: column,
		time: time === undefined || !isSameColumn ? 1 : time + 1,
	};
}
