import {isNil} from 'lodash';

type TRemString = `${number}rem`;
type TResult<T> = T extends TRemString ? number : T;

export function remToPx<T extends number | TRemString | null | undefined>(rem: T, rootFontSize = 16): TResult<T> {
	if (isNil(rem)) {
		return rem as TResult<T>;
	}

	const numericValue = typeof rem === 'number' ? rem : Number(rem.slice(0, -3));

	return (numericValue * rootFontSize) as TResult<T>;
}
