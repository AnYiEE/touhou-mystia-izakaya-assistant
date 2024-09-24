export type TCustomerRating = '极度不满' | '普通' | '满意';

export interface ICustomerRatingMap {
	[key in TCustomerRating]: AvatarProps['color'];
}

export type TTab = 'customer' | 'ingredient' | 'recipe';

export type {
	ICustomerTabStyle,
	TRecipe,
	TRecipeWithSuitability,
	TRecipesWithSuitability,
} from '@/(pages)/customer-rare/types';
