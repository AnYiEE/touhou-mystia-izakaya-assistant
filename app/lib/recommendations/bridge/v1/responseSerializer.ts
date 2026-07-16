import { type ISuggestedMeal } from '@/utils/customer/customer_rare/suggestMeals';

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
		meals: meals.map(({ beverage, price, rating, recipe }) => ({
			beverage,
			price,
			rating,
			recipe: {
				extra_ingredients: [...recipe.extraIngredients],
				name: recipe.name,
			},
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
