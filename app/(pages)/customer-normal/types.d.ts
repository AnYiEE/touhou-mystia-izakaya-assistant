export type TCustomerRating = '极度不满' | '普通' | '满意';
export type TCustomerRatingColor = 'exbad' | 'norm' | 'good';
export type TCustomerRatingMap = Record<TCustomerRating, TCustomerRatingColor>;

export type {
	ICustomerTabStyle,
	TBeverageWithSuitability,
	TBeveragesWithSuitability,
	TRecipe,
	TRecipeWithSuitability,
	TRecipesWithSuitability,
	TTab,
} from '@/(pages)/customer-rare/types';
