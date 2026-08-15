import { store } from '@davstack/store';

import type { TCookerId } from '@/domain/data/cookers/types';

export const suggestedMealsUiStore = store({
	cooker: null as TCookerId | null,
	visibility: false,
});
