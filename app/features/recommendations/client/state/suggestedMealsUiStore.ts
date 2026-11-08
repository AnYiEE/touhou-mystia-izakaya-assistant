import { store } from '@davstack/store';

import type { TCookerId } from '@/domain/data/cookers/types';
import { type TRecommendationSortProfile } from '@/domain/recommendations/sortProfiles';

export type TSuggestedMealsUiStatus =
	'error' | 'idle' | 'pending' | 'refreshing' | 'success';

export const suggestedMealsUiStore = store({
	cooker: null as TCookerId | null,
	resultCount: 0,
	sortProfileOverride: null as TRecommendationSortProfile | null,
	status: 'idle' as TSuggestedMealsUiStatus,
	visibility: false,
});
