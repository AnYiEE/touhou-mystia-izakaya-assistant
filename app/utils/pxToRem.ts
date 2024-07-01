type TPxString = `${string}px`;

export function pxToRem<T extends number | TPxString | null | undefined>(
	px: T,
	rootFontSize = 16
): T extends TPxString ? number : T {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (px === null || px === undefined) {
		return px as T extends TPxString ? number : T;
	}

	const numericValue = typeof px === 'number' ? px : Number(px.slice(0, -2));

	return (numericValue / rootFontSize) as T extends TPxString ? number : T;
}
