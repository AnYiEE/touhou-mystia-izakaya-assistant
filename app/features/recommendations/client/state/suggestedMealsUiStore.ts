import { store } from '@davstack/store';

import type { TCookerName } from '@/domain/data/cookers/types';

export const suggestedMealsUiStore = store({
	cooker: null as TCookerName | null,
	visibility: false,
});
