import {isNil, isNumber} from 'lodash';

type TPxString = `${string}px`;

export function pxToRem<T extends number | TPxString | null | undefined>(
	px: T,
	rootFontSize = 16
): T extends TPxString ? number : T {
	if (isNil(px)) {
		return px as T extends TPxString ? number : T;
	}

	const numericValue = isNumber(px) ? px : Number(px.slice(0, -2));

	return (numericValue / rootFontSize) as T extends TPxString ? number : T;
}
