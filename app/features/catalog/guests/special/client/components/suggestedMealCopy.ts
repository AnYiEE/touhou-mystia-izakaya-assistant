import { type TCatalogGuestsMessageKey } from '@/features/catalog/guests/shared/messages';

export const SUGGESTED_MEAL_STATUS_MESSAGE_KEYS = {
	failed: 'guests.suggestedMeal.status.failed',
	loading: 'guests.suggestedMeal.status.loading',
	noMatch: 'guests.suggestedMeal.status.noMatch',
	refreshFailed: 'guests.suggestedMeal.status.refreshFailed',
	refreshing: 'guests.suggestedMeal.status.refreshing',
} as const satisfies Record<string, TCatalogGuestsMessageKey>;

export const SUGGESTED_MEAL_ALTERNATIVE_STATUS_LABEL_KEYS = {
	empty: 'guests.suggestedMeal.alternative.empty',
	failed: 'guests.suggestedMeal.alternative.failed',
	loading: 'guests.suggestedMeal.alternative.loading',
	ready: 'guests.suggestedMeal.alternative.ready',
} as const satisfies Record<string, TCatalogGuestsMessageKey>;
