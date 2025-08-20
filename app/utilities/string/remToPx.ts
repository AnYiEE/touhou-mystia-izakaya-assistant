import { isNil } from 'lodash';

import { memoize } from '@/utilities/memoize';

type TRemString = `${number}rem`;
type TResult<T> = T extends TRemString ? number : T;

export const remToPx = memoize(function remToPx<
	T extends number | TRemString | null | undefined,
>(rem: T): TResult<T> {
	if (isNil(rem)) {
		return rem as TResult<T>;
	}

	const numericValue =
		typeof rem === 'number' ? rem : Number(rem.slice(0, -3));

	return (numericValue * 16) as TResult<T>;
});
