import {
	DARK_MATTER_META_MAP,
	DYNAMIC_TAG_MAP,
	type TCustomerNormalName,
	type TCustomerRareName,
	type TIngredientName,
	type TIngredientTag,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import type { IPopularTrend } from '@/types';
import { toArray, union } from '@/utilities';
import { CustomerRare, Recipe } from '@/utils';

interface IFullIngredientScoreBaseParams {
	ingredientTags: TIngredientTag[];
	currentRecipeTagsWithTrend: TRecipeTag[];
	customerPositiveTags: ReadonlyArray<TRecipeTag>;
	customerNegativeTags?: ReadonlyArray<TRecipeTag>;
	candidateIngredientName: TIngredientName;
	currentIngredients: TIngredientName[];
	currentRecipeName: TRecipeName;
	popularTrend: IPopularTrend;
	isDarkMatter: boolean;
	isDarkIngredient: boolean;
	isLargePartitionTagNext: boolean;
	shouldCalculateLargePartitionTag: boolean;
	composeRecipeTagsWithPopularTrend: (tags: TIngredientTag[]) => TRecipeTag[];
}

interface IFullIngredientScoreRareParams extends IFullIngredientScoreBaseParams {
	customerName: TCustomerRareName;
	customerType: 'rare';
}

interface IFullIngredientScoreNormalParams extends IFullIngredientScoreBaseParams {
	customerName: TCustomerNormalName;
	customerType: 'normal';
}

export interface IFullIngredientScoreResult {
	scoreChange: number;
	easterEggIngredient: TIngredientName | null;
	tagsWithTrend: TRecipeTag[];
	before: TRecipeTag[];
	after: TRecipeTag[];
}

export function getFullIngredientScoreChange({
	candidateIngredientName,
	composeRecipeTagsWithPopularTrend,
	currentIngredients,
	currentRecipeName,
	currentRecipeTagsWithTrend,
	customerName,
	customerNegativeTags = [],
	customerPositiveTags,
	customerType,
	ingredientTags,
	isDarkIngredient,
	isDarkMatter,
	isLargePartitionTagNext,
	popularTrend,
	shouldCalculateLargePartitionTag,
}: IFullIngredientScoreRareParams | IFullIngredientScoreNormalParams): IFullIngredientScoreResult {
	const instance_recipe = Recipe.getInstance();

	const tagsWithTrend = ingredientTags as TRecipeTag[];
	const allTagsWithTrend = union(currentRecipeTagsWithTrend, tagsWithTrend);

	const before = composeRecipeTagsWithPopularTrend(
		currentRecipeTagsWithTrend as TIngredientTag[]
	);
	const after = composeRecipeTagsWithPopularTrend(
		allTagsWithTrend as TIngredientTag[]
	);

	let scoreChange = instance_recipe.getIngredientScoreChange(
		before,
		after,
		customerPositiveTags,
		customerNegativeTags
	);

	scoreChange -= Number(
		isLargePartitionTagNext &&
			customerNegativeTags.includes(
				DYNAMIC_TAG_MAP.largePartition
			) &&
			!before.includes(DYNAMIC_TAG_MAP.largePartition)
	);
	scoreChange += Number(
		isLargePartitionTagNext &&
			customerPositiveTags.includes(
				DYNAMIC_TAG_MAP.largePartition
			) &&
			!before.includes(DYNAMIC_TAG_MAP.largePartition)
	);

	scoreChange -= Number(
		shouldCalculateLargePartitionTag &&
			customerNegativeTags.includes(
				DYNAMIC_TAG_MAP.popularNegative
			) &&
			popularTrend.isNegative
	);
	scoreChange -= Number(
		shouldCalculateLargePartitionTag &&
			customerNegativeTags.includes(
				DYNAMIC_TAG_MAP.popularPositive
			) &&
			!popularTrend.isNegative
	);
	scoreChange += Number(
		shouldCalculateLargePartitionTag &&
			customerPositiveTags.includes(
				DYNAMIC_TAG_MAP.popularNegative
			) &&
			popularTrend.isNegative
	);
	scoreChange += Number(
		shouldCalculateLargePartitionTag &&
			customerPositiveTags.includes(
				DYNAMIC_TAG_MAP.popularPositive
			) &&
			!popularTrend.isNegative
	);

	let easterEggIngredient: TIngredientName | null = null;

	if (customerType === 'rare') {
		const instance_customer = CustomerRare.getInstance();
		const ingredientsWithCandidate = union(
			toArray(currentIngredients, candidateIngredientName)
		);
		const easterEggResult = instance_customer.checkIngredientEasterEgg({
			currentCustomerName: customerName,
			currentIngredients: ingredientsWithCandidate,
			currentRecipeName:
				isDarkIngredient || isDarkMatter
					? DARK_MATTER_META_MAP.name
					: currentRecipeName,
		});
		if (
			candidateIngredientName === easterEggResult.ingredient &&
			!currentIngredients.includes(easterEggResult.ingredient)
		) {
			easterEggIngredient = easterEggResult.ingredient;
			scoreChange = easterEggResult.score === 0 ? -Infinity : Infinity;
		}
	}

	if (isDarkIngredient) {
		scoreChange = -Infinity;
	}

	if (isDarkMatter) {
		scoreChange = 0;
	}

	return { after, before, easterEggIngredient, scoreChange, tagsWithTrend };
}
