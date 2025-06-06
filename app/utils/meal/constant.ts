import type {IMeal} from './types';

export const DEFAULT_MEAL = {
	beverageName: null,
	customerName: null,
	customerOrder: {
		beverageTag: null,
		recipeTag: null,
	},
	hasMystiaCooker: false,
	isDarkMatter: false,
	isFamousShop: false,
	popularTrend: {
		isNegative: false,
		tag: null,
	},
	rating: null,
	recipeData: null,
} as const satisfies IMeal;
