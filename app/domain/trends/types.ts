import { type DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';
import type { TIngredientTag, TRecipeTag } from '@/domain/data/tags/types';

export type TPopularTag = Exclude<
	TIngredientTag | TRecipeTag,
	'特产' | '天罚' | (typeof DARK_MATTER_META_MAP)['positiveTag']
>;

export interface IPopularTrend {
	isNegative: boolean;
	tag: TPopularTag | null;
}
