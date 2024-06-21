type RemString = `${string}rem`;

export function remToPx<T extends number | RemString | null | undefined>(
	rem: T,
	rootFontSize = 16
): T extends RemString ? number : T {
	if (rem === null || rem === undefined) {
		return rem as T extends RemString ? number : T;
	}

	const numericValue = typeof rem === 'number' ? rem : Number(rem.slice(0, -3));

	return (numericValue * rootFontSize) as T extends RemString ? number : T;
}
