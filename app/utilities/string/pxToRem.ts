import { isNil } from 'lodash';

import { memoize } from '@/utilities/memoize';

type TPxString = `${number}px`;
type TResult<T> = T extends TPxString ? number : T;

export const pxToRem = memoize(function pxToRem<
	T extends number | TPxString | null | undefined,
>(px: T): TResult<T> {
	if (isNil(px)) {
		return px as TResult<T>;
	}

	const numericValue = typeof px === 'number' ? px : Number(px.slice(0, -2));

	return (numericValue / 16) as TResult<T>;
});
