import {
	type DARK_MATTER_META_MAP,
	type TIngredientTag,
	type TRecipeTag,
} from '@/data';

export type TPopularTag = Exclude<
	TIngredientTag | TRecipeTag,
	'特产' | '天罚' | (typeof DARK_MATTER_META_MAP)['positiveTag']
>;

export interface IPopularTrend {
	isNegative: boolean;
	tag: TPopularTag | null;
}
