import { specialGuestPersistenceStore } from '@/features/catalog/guests/special/client/state/persistenceStore';

export const specialGuestPlansStore = {
	persistence: { plans: specialGuestPersistenceStore.persistence.plans },
	shared: { drawer: specialGuestPersistenceStore.shared.drawer },

	resolvedGroups: specialGuestPersistenceStore.resolvedGroups,
	summary: specialGuestPersistenceStore.summary,

	closeDrawer: specialGuestPersistenceStore.closeDrawer,
	closeDrawerForNavigation:
		specialGuestPersistenceStore.closeDrawerForNavigation,
	copyPlan: specialGuestPersistenceStore.copyPlan,
	createPlan: specialGuestPersistenceStore.createPlan,
	deletePlan: specialGuestPersistenceStore.deletePlan,
	openDrawer: specialGuestPersistenceStore.openDrawer,
	renamePlan: specialGuestPersistenceStore.renamePlan,
	setActivePlan: specialGuestPersistenceStore.setActivePlan,
	setExcludes: specialGuestPersistenceStore.setExcludes,
	setGuestSort: specialGuestPersistenceStore.setGuestSort,
	setIncludes: specialGuestPersistenceStore.setIncludes,
	setManualGuests: specialGuestPersistenceStore.setManualGuests,
	setMaps: specialGuestPersistenceStore.setMaps,
	setMealSource: specialGuestPersistenceStore.setMealSource,
	setMode: specialGuestPersistenceStore.setMode,
	toggleControlsCollapsed:
		specialGuestPersistenceStore.toggleControlsCollapsed,
	toggleSpecialGuestExpanded:
		specialGuestPersistenceStore.toggleSpecialGuestExpanded,
	trackSpecialGuestNavigation:
		specialGuestPersistenceStore.trackSpecialGuestNavigation,
};
