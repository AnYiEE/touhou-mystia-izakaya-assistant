import { globalStore } from './state/globalPersistenceStore';

export const recommendationPreferencesFacade = {
	enabled: globalStore.persistence.suggestMeals.enabled,
	maxExtraIngredients:
		globalStore.persistence.suggestMeals.maxExtraIngredients,
	maxRating: globalStore.persistence.suggestMeals.maxRating,
	maxResults: globalStore.persistence.suggestMeals.maxResults,
	version: globalStore.persistence.version,
};
