import { isNil } from 'lodash';

type TPxString = `${number}px`;
type TResult<T> = T extends TPxString ? number : T;

export function pxToRem<T extends number | TPxString | null | undefined>(
	px: T,
	rootFontSize = 16
): TResult<T> {
	if (isNil(px)) {
		return px as TResult<T>;
	}

	const numericValue = typeof px === 'number' ? px : Number(px.slice(0, -2));

	return (numericValue / rootFontSize) as TResult<T>;
}
