import { customerRarePersistenceStore } from '@/features/catalog/customers/rare/client/state/persistenceStore';

export const customerPlansStore = {
	persistence: { plans: customerRarePersistenceStore.persistence.plans },
	shared: { drawer: customerRarePersistenceStore.shared.drawer },

	resolvedGroups: customerRarePersistenceStore.resolvedGroups,
	summary: customerRarePersistenceStore.summary,

	closeDrawer: customerRarePersistenceStore.closeDrawer,
	closeDrawerForNavigation:
		customerRarePersistenceStore.closeDrawerForNavigation,
	copyPlan: customerRarePersistenceStore.copyPlan,
	createPlan: customerRarePersistenceStore.createPlan,
	deletePlan: customerRarePersistenceStore.deletePlan,
	openDrawer: customerRarePersistenceStore.openDrawer,
	renamePlan: customerRarePersistenceStore.renamePlan,
	setActivePlan: customerRarePersistenceStore.setActivePlan,
	setCustomerSort: customerRarePersistenceStore.setCustomerSort,
	setExcludes: customerRarePersistenceStore.setExcludes,
	setIncludes: customerRarePersistenceStore.setIncludes,
	setManualCustomers: customerRarePersistenceStore.setManualCustomers,
	setMealSource: customerRarePersistenceStore.setMealSource,
	setMode: customerRarePersistenceStore.setMode,
	setPlaces: customerRarePersistenceStore.setPlaces,
	toggleControlsCollapsed:
		customerRarePersistenceStore.toggleControlsCollapsed,
	toggleCustomerExpanded: customerRarePersistenceStore.toggleCustomerExpanded,
	trackCustomerNavigation:
		customerRarePersistenceStore.trackCustomerNavigation,
};
