import {isNil, isNumber} from 'lodash';

type TPxString = `${string}px`;
type TResult<T> = T extends TPxString ? number : T;

export function pxToRem<T extends number | TPxString | null | undefined>(px: T, rootFontSize = 16): TResult<T> {
	if (isNil(px)) {
		return px as TResult<T>;
	}

	const numericValue = isNumber(px) ? px : Number(px.slice(0, -2));

	return (numericValue / rootFontSize) as TResult<T>;
}
