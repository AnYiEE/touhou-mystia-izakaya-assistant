import {isNil, isNumber} from 'lodash';

type TRemString = `${string}rem`;
type TResult<T> = T extends TRemString ? number : T;

export function remToPx<T extends number | TRemString | null | undefined>(rem: T, rootFontSize = 16): TResult<T> {
	if (isNil(rem)) {
		return rem as TResult<T>;
	}

	const numericValue = isNumber(rem) ? rem : Number(rem.slice(0, -3));

	return (numericValue * rootFontSize) as TResult<T>;
}
