import type { ISuggestedMeal } from '@/domain/recommendations/types';

export type TV1RecommendationErrorCode =
	| 'busy'
	| 'invalid-request'
	| 'recommendation-failed'
	| 'request-not-found';

export function serializeV1RecommendationResult(
	requestId: string,
	meals: ReadonlyArray<ISuggestedMeal>
) {
	return {
		meals: meals.map(({ beverage, food, price, rating }) => ({
			beverage_id: beverage,
			food: {
				extra_ingredient_ids: [...food.extraIngredients],
				recipe_id: food.recipeId,
			},
			price,
			rating,
		})),
		request_id: requestId,
		type: 'recommendation.result',
	} as const;
}

export function serializeV1RecommendationError(
	requestId: string,
	code: TV1RecommendationErrorCode,
	details?: { readonly path?: string; readonly reason?: string }
) {
	return {
		code,
		...(details === undefined ? {} : { details }),
		request_id: requestId,
		type: 'recommendation.error',
	} as const;
}
