type PxString = `${string}px`;

export function pxToRem<T extends number | PxString | null | undefined>(
	px: T,
	rootFontSize = 16
): T extends PxString ? number : T {
	if (px === null || px === undefined) {
		return px as T extends PxString ? number : T;
	}

	const numericValue = typeof px === 'number' ? px : Number(px.slice(0, -2));

	return (numericValue / rootFontSize) as T extends PxString ? number : T;
}
