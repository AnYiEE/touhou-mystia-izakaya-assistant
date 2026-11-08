import { globalPreferencesShape } from '@/features/account/sync/shapes/globalPreferences';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { suggestedMealsUiStore } from '@/features/recommendations/client/state/suggestedMealsUiStore';

import { resetSpecialGuestTutorial } from './tutorialProgress';

export function resetSpecialGuestTutorialExperience() {
	const defaultSuggestMeals =
		globalPreferencesShape.createDefault().suggestMeals;

	specialGuestStore.persistence.guest.filters.set((previous) => {
		Object.keys(previous).forEach((key) => {
			previous[key] = [];
		});
	});
	specialGuestStore.persistence.guest.orderLinkedFilter.set(true);
	specialGuestStore.persistence.recipe.table.cookerTypes.set([]);
	specialGuestStore.persistence.recipe.table.availabilityDlcs.set([]);
	specialGuestStore.persistence.recipe.table.sortDescriptor.set({});
	specialGuestStore.persistence.beverage.table.availabilityDlcs.set([]);
	specialGuestStore.persistence.beverage.table.sortDescriptor.set({});
	specialGuestStore.persistence.ingredient.filters.set((previous) => {
		Object.keys(previous).forEach((key) => {
			previous[key] = [];
		});
	});

	globalStore.persistence.suggestMeals.set(defaultSuggestMeals);

	suggestedMealsUiStore.cooker.set(null);
	suggestedMealsUiStore.resultCount.set(0);
	suggestedMealsUiStore.sortProfileOverride.set(null);
	suggestedMealsUiStore.status.set('idle');
	suggestedMealsUiStore.visibility.set(false);

	specialGuestStore.shared.tutorial.isOrderLinkedNavigationSuspended.set(
		false
	);
	specialGuestStore.shared.guest.id.set(null);
	specialGuestStore.shared.tab.set('guest');
	specialGuestStore.refreshGuestSelectedItems();

	resetSpecialGuestTutorial();
}
