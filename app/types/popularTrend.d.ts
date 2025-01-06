import {type DARK_MATTER_TAG, type TIngredientTag, type TRecipeTag} from '@/data';

export type TPopularTag = Exclude<TIngredientTag | TRecipeTag, '特产' | '天罚' | typeof DARK_MATTER_TAG>;

export interface IPopularTrend {
	isNegative: boolean;
	tag: TPopularTag | null;
}
