import type { TEvaluationKeySchema } from '@/domain/data/customers/rare/schema';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TIngredientTag } from '@/domain/data/tags/types';

export type TEvaluation =
	| '极度不满'
	| '不满'
	| '普通'
	| '满意'
	| '完美'
	| '小额超支'
	| '大额超支'
	| '被驱赶'
	| '评价驱赶行为';
export type TEvaluationKey = TEvaluationKeySchema;

export type TRating = Exclude<
	TEvaluation,
	'小额超支' | '大额超支' | '被驱赶' | '评价驱赶行为'
>;
export type TRatingKey = Exclude<
	TEvaluationKey,
	'lackmoneynormal' | 'lackmoneyangry' | 'repell' | 'seenRepell'
>;

export type TEvaluationKeyMap = Record<TEvaluation, TEvaluationKey>;
export type TEvaluationMap = Record<TEvaluationKey, TEvaluation>;

export type TRatingKeyMap = Record<TRating, TRatingKey>;
export type TRatingMap = Record<TRatingKey, TRating>;

export interface IIngredientScoreCandidate {
	name: TIngredientName;
	tags: ReadonlyArray<TIngredientTag>;
}

export type TIngredientScoreRestriction =
	| 'darkIngredient'
	| 'darkMatterOverride'
	| 'highestRestricted'
	| 'lowestRestricted'
	| 'none';

export interface IIngredientScoreChangesResult {
	changesByName: Partial<
		Record<
			TIngredientName,
			{
				isDarkIngredient: boolean;
				isOrderTag: boolean;
				restriction: TIngredientScoreRestriction;
				scoreChange: number;
			}
		>
	>;
	darkIngredientNames: TIngredientName[];
}
