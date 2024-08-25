export type TCustomerRating = '普通' | '满意';

export interface ICustomerRatingMap {
	[key in TCustomerRating]: AvatarProps['color'];
}

export type {
	ICustomerTabStyle,
	TBeverageWithSuitability,
	TBeveragesWithSuitability,
	TRecipe,
	TRecipeWithSuitability,
	TRecipesWithSuitability,
	TTab,
} from '@/(pages)/customer-rare/types';
