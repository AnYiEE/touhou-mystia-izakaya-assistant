import { store } from '@davstack/store';

import type { TCookerId } from '@/domain/data/cookers/types';
import { type TRecommendationSortProfile } from '@/domain/recommendations/sortProfiles';

export const suggestedMealsUiStore = store({
	cooker: null as TCookerId | null,
	sortProfileOverride: null as TRecommendationSortProfile | null,
	visibility: false,
});
