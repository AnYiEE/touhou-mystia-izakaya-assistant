export const RECOMMENDATION_SORT_PROFILES = [
	'material-cost-first',
	'availability-first',
	'low-price',
	'high-price',
] as const;

export type TRecommendationSortProfile =
	(typeof RECOMMENDATION_SORT_PROFILES)[number];

export interface IRecommendationSortProfileMetrics {
	readonly acquisitionEase: number;
	readonly extraIngredientPenalty: number;
	readonly isOverSoftBudget: boolean;
	readonly materialCost: number;
	readonly price: number;
}

function compareAcquisitionAndExtraIngredientPenalty(
	left: IRecommendationSortProfileMetrics,
	right: IRecommendationSortProfileMetrics
) {
	return (
		right.acquisitionEase - left.acquisitionEase ||
		left.extraIngredientPenalty - right.extraIngredientPenalty
	);
}

export function compareRecommendationSortProfileMetrics(
	profile: TRecommendationSortProfile,
	left: IRecommendationSortProfileMetrics,
	right: IRecommendationSortProfileMetrics,
	strictComparison: number
) {
	switch (profile) {
		case 'availability-first':
			return (
				strictComparison ||
				Number(left.isOverSoftBudget) -
					Number(right.isOverSoftBudget) ||
				compareAcquisitionAndExtraIngredientPenalty(left, right)
			);
		case 'low-price':
			return (
				left.price - right.price ||
				strictComparison ||
				compareAcquisitionAndExtraIngredientPenalty(left, right)
			);
		case 'high-price':
			return (
				right.price - left.price ||
				strictComparison ||
				compareAcquisitionAndExtraIngredientPenalty(left, right)
			);
		case 'material-cost-first':
			return (
				left.materialCost - right.materialCost ||
				strictComparison ||
				Number(left.isOverSoftBudget) -
					Number(right.isOverSoftBudget) ||
				compareAcquisitionAndExtraIngredientPenalty(left, right)
			);
	}
}
