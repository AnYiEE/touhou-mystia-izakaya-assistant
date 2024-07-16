import {isNil, isNumber} from 'lodash';

type TRemString = `${string}rem`;

export function remToPx<T extends number | TRemString | null | undefined>(
	rem: T,
	rootFontSize = 16
): T extends TRemString ? number : T {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (isNil(rem)) {
		return rem as T extends TRemString ? number : T;
	}

	const numericValue = isNumber(rem) ? rem : Number(rem.slice(0, -3));

	return (numericValue * rootFontSize) as T extends TRemString ? number : T;
}
