import { filterItems } from '@/utilities';

interface IFilterableIngredient {
	dlc: number;
	level: number;
	name: string;
	tags: ReadonlyArray<string>;
}

type TIngredientWithTrendTags<TIngredient extends IFilterableIngredient> =
	TIngredient & { _tagsWithTrend: ReadonlyArray<string> };

export interface IFilterIngredientDataArgs<
	TIngredient extends IFilterableIngredient,
> {
	blockedIngredientNames: ReadonlySet<string>;
	calculateTagsWithTrend: (
		tags: ReadonlyArray<string>
	) => ReadonlyArray<string>;
	filterDlcs: ReadonlyArray<string>;
	filterLevels: ReadonlyArray<string>;
	filterNoTags: ReadonlyArray<string>;
	filterTags: ReadonlyArray<string>;
	hiddenIngredientNames: ReadonlySet<string>;
	ingredientData: ReadonlyArray<TIngredient>;
}

/**
 * 对食材数据应用纯过滤规则，并保留原始数据顺序作为返回顺序。
 */
export function filterIngredientData<
	TIngredient extends IFilterableIngredient,
>({
	blockedIngredientNames,
	calculateTagsWithTrend,
	filterDlcs,
	filterLevels,
	filterNoTags,
	filterTags,
	hiddenIngredientNames,
	ingredientData,
}: IFilterIngredientDataArgs<TIngredient>): TIngredient[] {
	const augmented = ingredientData
		.filter(
			({ name }) =>
				!blockedIngredientNames.has(name) &&
				!hiddenIngredientNames.has(name)
		)
		.map<
			TIngredientWithTrendTags<TIngredient>
		>((item) => ({ ...item, _tagsWithTrend: calculateTagsWithTrend(item.tags) }));

	const filtered = filterItems(augmented, [
		{ field: 'dlc', match: 'in', values: filterDlcs },
		{ field: '_tagsWithTrend', match: 'all', values: filterTags },
		{ field: '_tagsWithTrend', match: 'excludeAny', values: filterNoTags },
		{ field: 'level', match: 'in', values: filterLevels },
	]);
	const filteredNames = new Set(filtered.map(({ name }) => name));

	return ingredientData.filter(({ name }) => filteredNames.has(name));
}
