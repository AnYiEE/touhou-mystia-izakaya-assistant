export function migrateLegacyFoodTableColumnKeys(
	value: ReadonlyArray<string>
): string[] {
	return value.map((item) => {
		if (item === 'recipe') {
			return 'food';
		}
		return item === 'cooker' ? 'cookerType' : item;
	});
}

export function migrateLegacyFoodTableSortDescriptor(
	value: Record<string, unknown>
): Record<string, unknown> {
	return {
		...value,
		...(value['column'] === 'recipe' ? { column: 'food' } : {}),
		...(value['lastColumn'] === 'recipe' ? { lastColumn: 'food' } : {}),
	};
}
