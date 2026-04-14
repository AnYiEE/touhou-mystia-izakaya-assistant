import type { TIngredientName, TPlace, TRecipeName, TRecipeTag } from '@/data';
import type { IPopularTrend } from '@/types';
import { intersection } from '@/utilities';
import { CustomerNormal } from '.';
import { Ingredient } from '../../food/ingredients';
import { Recipe } from '../../food/recipes';
import {
	MAP_DLC,
	buildEaseMap,
	getRecipeAcquisitionWeight,
} from '../acquisitionWeight';

interface ICoverageParams {
	place: TPlace;
	popularTrend: IPopularTrend;
	isFamousShop: boolean;
	hiddenDlcs: ReadonlySet<number>;
	hiddenRecipes: ReadonlySet<TRecipeName>;
	hiddenIngredients: ReadonlySet<TIngredientName>;
	rareOnlyRecipes: ReadonlySet<TRecipeName>;
	rareOnlyIngredients: ReadonlySet<TIngredientName>;
}

interface ICustomerScore {
	name: string;
	score: number;
	matchedTags: TRecipeTag[];
}

export interface ICoverageResult {
	recipeName: TRecipeName;
	totalCoverage: number;
	goodCount: number;
	acquisitionWeight: number;
	customerScores: ICustomerScore[];
}

export function computeCoverageForPlace(
	params: ICoverageParams
): ICoverageResult[] {
	const {
		hiddenDlcs,
		hiddenIngredients,
		hiddenRecipes,
		isFamousShop,
		place,
		popularTrend,
		rareOnlyIngredients,
		rareOnlyRecipes,
	} = params;

	const instance_customer = CustomerNormal.getInstance();
	const instance_ingredient = Ingredient.getInstance();
	const instance_recipe = Recipe.getInstance();

	const customers = instance_customer.data.filter(
		(c) =>
			(c.places as ReadonlyArray<TPlace>).includes(place) &&
			!hiddenDlcs.has(c.dlc)
	);
	if (customers.length === 0) {
		return [];
	}

	const recipes = instance_recipe.data.filter(
		(r) =>
			!hiddenDlcs.has(r.dlc) &&
			!hiddenRecipes.has(r.name) &&
			!rareOnlyRecipes.has(r.name) &&
			!instance_recipe.blockedRecipes.has(r.name)
	);

	const customerDlc = MAP_DLC[place];
	const availableIngredients = instance_ingredient.data.filter(
		({ dlc, name }) =>
			!hiddenDlcs.has(dlc) &&
			!hiddenIngredients.has(name) &&
			!rareOnlyIngredients.has(name) &&
			!instance_ingredient.blockedIngredients.has(name)
	);
	const { easeMap: ingredientEaseMap, maxEase: maxIngredientEase } =
		buildEaseMap(availableIngredients, customerDlc, place);

	return recipes
		.map((recipe) => {
			const hasHiddenIngredient = recipe.ingredients.some(
				(ing) =>
					hiddenIngredients.has(ing) || rareOnlyIngredients.has(ing)
			);
			if (hasHiddenIngredient) {
				return null;
			}

			const composedTags = instance_recipe.composeTagsWithPopularTrend(
				recipe.ingredients,
				[],
				recipe.positiveTags,
				[],
				popularTrend
			);
			const tagsWithTrend = instance_recipe.calculateTagsWithTrend(
				composedTags,
				popularTrend,
				isFamousShop
			);

			const customerScores: ICustomerScore[] = customers.map(
				(customer) => {
					const matchedTags = intersection(
						tagsWithTrend,
						customer.positiveTags
					);
					return {
						matchedTags,
						name: customer.name,
						score: matchedTags.length,
					};
				}
			);

			const totalCoverage = customerScores.reduce(
				(sum, s) => sum + s.score,
				0
			);
			const goodCount = customerScores.filter((s) => s.score >= 3).length;

			const acquisitionWeight = getRecipeAcquisitionWeight(
				recipe.ingredients,
				ingredientEaseMap,
				maxIngredientEase
			);

			return {
				acquisitionWeight,
				customerScores,
				goodCount,
				recipeName: recipe.name,
				totalCoverage,
			};
		})
		.filter(
			Boolean as unknown as (
				v: ICoverageResult | null
			) => v is ICoverageResult
		)
		.sort(
			(a, b) =>
				b.totalCoverage - a.totalCoverage ||
				b.acquisitionWeight - a.acquisitionWeight
		);
}
