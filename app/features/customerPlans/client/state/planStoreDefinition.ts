import type { State } from '@davstack/store';

import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TPlace } from '@/domain/data/places/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { IPopularTrend } from '@/domain/trends/types';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { resolveCustomerRarePlan } from '@/features/customerPlans/client/mealPlanning/resolveCustomerRarePlan';
import type {
	ICustomerRareMeal,
	ICustomerRarePlansState,
	TCustomerRarePlanCustomerSort,
	TCustomerRarePlanMealSource,
	TCustomerRarePlanMode,
} from '@/features/customerPlans/contracts';
import {
	requestOverlayClose,
	requestOverlayOpen,
} from '@/features/overlays/client';

import { checkArrayEqualOf } from '@/shared/utilities/collections/check';
import { createComputedAccessor } from '@/shared/utilities/state/createComputedAccessor';

import {
	checkCustomerRarePlansStateVirtual,
	copyCustomerRarePlan,
	createCustomerRarePlan,
	dedupeCustomerRarePlanValues,
	getDisplayedCustomerRarePlan,
	materializeActiveCustomerRarePlan,
	normalizeCustomerRarePlanName,
	removeCustomerRarePlanFromState,
	updateActiveCustomerRarePlan,
} from './planState';

export const customerPlansStateDefinition = {
	persistence: {
		plans: { activeId: null, items: [] } as ICustomerRarePlansState,
	},
	shared: {
		drawer: {
			expandedCustomerNames: new Set<TCustomerRareName>(),
			isControlsCollapsed: false,
			isOpen: false,
		},
	},
};

interface ICustomerPlansStoreContext {
	persistence: {
		meals: State<Partial<Record<TCustomerRareName, ICustomerRareMeal[]>>>;
		plans: State<ICustomerRarePlansState>;
	};
	shared: {
		beverage: { table: { hiddenBeverages: State<Set<TBeverageName>> } };
		customer: {
			famousShop: State<boolean>;
			popularTrend: State<IPopularTrend>;
		};
		drawer: State<
			(typeof customerPlansStateDefinition)['shared']['drawer']
		>;
		hiddenItems: { dlcs: State<Set<TDlc>> };
		recipe: {
			table: {
				hiddenIngredients: State<Set<TIngredientName>>;
				hiddenRecipes: State<Set<TRecipeName>>;
			};
		};
	};
}

function trackCustomerRarePlanFilterChange(
	name: 'excludes' | 'includes' | 'manualCustomers' | 'places',
	count: number
) {
	trackEvent(
		trackEvent.category.click,
		'Customer Rare Plan Filter Button',
		`${name}:${count}`
	);
}

function trackCustomerRarePlanMealSourceChange(
	source: TCustomerRarePlanMealSource
) {
	trackEvent(
		trackEvent.category.click,
		'Customer Rare Plan Meal Source Button',
		source
	);
}

function trackCustomerRarePlanCustomerSortChange(
	customerSort: TCustomerRarePlanCustomerSort
) {
	trackEvent(
		trackEvent.category.click,
		'Customer Rare Plan Sort Button',
		customerSort
	);
}

export function createCustomerPlansComputedDefinition(
	currentStore: ICustomerPlansStoreContext
) {
	const resolvedGroups = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const plans = shouldGet
			? currentStore.persistence.plans.get()
			: currentStore.persistence.plans.use();
		const activePlan = getDisplayedCustomerRarePlan(plans);

		return resolveCustomerRarePlan({
			hiddenBeverages: shouldGet
				? currentStore.shared.beverage.table.hiddenBeverages.get()
				: currentStore.shared.beverage.table.hiddenBeverages.use(),
			hiddenDlcs: shouldGet
				? currentStore.shared.hiddenItems.dlcs.get()
				: currentStore.shared.hiddenItems.dlcs.use(),
			hiddenIngredients: shouldGet
				? currentStore.shared.recipe.table.hiddenIngredients.get()
				: currentStore.shared.recipe.table.hiddenIngredients.use(),
			hiddenRecipes: shouldGet
				? currentStore.shared.recipe.table.hiddenRecipes.get()
				: currentStore.shared.recipe.table.hiddenRecipes.use(),
			isFamousShop: shouldGet
				? currentStore.shared.customer.famousShop.get()
				: currentStore.shared.customer.famousShop.use(),
			meals: shouldGet
				? currentStore.persistence.meals.get()
				: currentStore.persistence.meals.use(),
			plan: activePlan,
			popularTrend: shouldGet
				? currentStore.shared.customer.popularTrend.get()
				: currentStore.shared.customer.popularTrend.use(),
		});
	});

	const summary = createComputedAccessor((getOrUse) => {
		const groups =
			getOrUse === 'get' ? resolvedGroups.get() : resolvedGroups.use();

		return {
			customerCount: groups.length,
			mealCount: groups.reduce(
				(total, group) => total + group.visibleMealCount,
				0
			),
		};
	});

	return {
		resolvedGroups: () => resolvedGroups.use(),
		summary: () => summary.use(),
	};
}

export function createCustomerPlansActionsDefinition(
	currentStore: ICustomerPlansStoreContext
) {
	function closeDrawerForNavigation() {
		currentStore.shared.drawer.isOpen.set(false);
		requestOverlayClose('customer-rare.plan-drawer');
	}

	return {
		closeDrawer() {
			if (!currentStore.shared.drawer.isOpen.get()) {
				requestOverlayClose('customer-rare.plan-drawer');
				return;
			}
			currentStore.shared.drawer.isOpen.set(false);
			requestOverlayClose('customer-rare.plan-drawer');
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Drawer Button',
				'Close'
			);
		},
		closeDrawerForNavigation,
		copyPlan(planId: string) {
			const plans = currentStore.persistence.plans.get();
			if (checkCustomerRarePlansStateVirtual(plans)) {
				return;
			}
			const sourcePlan = plans.items.find(({ id }) => id === planId);
			if (sourcePlan === undefined) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				const copiedPlan = copyCustomerRarePlan(sourcePlan);
				prev.items.push(copiedPlan);
				prev.activeId = copiedPlan.id;
			});
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Button',
				'Copy'
			);
		},
		createPlan() {
			let createdPlanId: string | null = null;
			currentStore.persistence.plans.set((prev) => {
				const plan = createCustomerRarePlan();
				prev.items.push(plan);
				prev.activeId = plan.id;
				createdPlanId = plan.id;
			});
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Button',
				'Create'
			);
			return createdPlanId;
		},
		deletePlan(planId: string) {
			const plans = currentStore.persistence.plans.get();
			if (
				checkCustomerRarePlansStateVirtual(plans) ||
				!plans.items.some(({ id }) => id === planId)
			) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				removeCustomerRarePlanFromState(prev, planId);
			});
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Button',
				'Delete'
			);
		},
		openDrawer() {
			if (currentStore.shared.drawer.isOpen.get()) {
				return;
			}
			requestOverlayOpen('customer-rare.plan-drawer', {
				onActivate: () => {
					currentStore.shared.drawer.isOpen.set(true);
					trackEvent(
						trackEvent.category.click,
						'Customer Rare Plan Drawer Button',
						'Open'
					);
				},
			});
		},
		renamePlan(planId: string, name: string) {
			const nextName = normalizeCustomerRarePlanName(name);
			const plans = currentStore.persistence.plans.get();
			const displayedPlan = getDisplayedCustomerRarePlan(plans);
			if (
				displayedPlan.id !== planId ||
				displayedPlan.name === nextName
			) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				const plan = materializeActiveCustomerRarePlan(prev);
				plan.name = nextName;
				plan.updatedAt = Date.now();
			});
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Button',
				'Rename'
			);
		},
		setActivePlan(planId: string) {
			const plans = currentStore.persistence.plans.get();
			if (
				checkCustomerRarePlansStateVirtual(plans) ||
				plans.activeId === planId ||
				!plans.items.some(({ id }) => id === planId)
			) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				prev.activeId = planId;
			});
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Button',
				`Switch:${planId}`
			);
		},
		setCustomerSort(customerSort: TCustomerRarePlanCustomerSort) {
			const activePlan = getDisplayedCustomerRarePlan(
				currentStore.persistence.plans.get()
			);
			if (activePlan.customerSort === customerSort) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveCustomerRarePlan(prev);
				updateActiveCustomerRarePlan(prev, (plan) => {
					plan.customerSort = customerSort;
					return true;
				});
			});
			trackCustomerRarePlanCustomerSortChange(customerSort);
		},
		setExcludes(values: ReadonlyArray<TCustomerRareName>) {
			const nextValues = dedupeCustomerRarePlanValues(values);
			const activePlan = getDisplayedCustomerRarePlan(
				currentStore.persistence.plans.get()
			);
			if (checkArrayEqualOf(activePlan.excludes, nextValues)) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveCustomerRarePlan(prev);
				updateActiveCustomerRarePlan(prev, (plan) => {
					plan.excludes = nextValues;
					return true;
				});
			});
			trackCustomerRarePlanFilterChange('excludes', nextValues.length);
		},
		setIncludes(values: ReadonlyArray<TCustomerRareName>) {
			const nextValues = dedupeCustomerRarePlanValues(values);
			const activePlan = getDisplayedCustomerRarePlan(
				currentStore.persistence.plans.get()
			);
			if (checkArrayEqualOf(activePlan.includes, nextValues)) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveCustomerRarePlan(prev);
				updateActiveCustomerRarePlan(prev, (plan) => {
					plan.includes = nextValues;
					return true;
				});
			});
			trackCustomerRarePlanFilterChange('includes', nextValues.length);
		},
		setManualCustomers(values: ReadonlyArray<TCustomerRareName>) {
			const nextValues = dedupeCustomerRarePlanValues(values);
			const activePlan = getDisplayedCustomerRarePlan(
				currentStore.persistence.plans.get()
			);
			if (checkArrayEqualOf(activePlan.manualCustomers, nextValues)) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveCustomerRarePlan(prev);
				updateActiveCustomerRarePlan(prev, (plan) => {
					plan.manualCustomers = nextValues;
					return true;
				});
			});
			trackCustomerRarePlanFilterChange(
				'manualCustomers',
				nextValues.length
			);
		},
		setMealSource(source: TCustomerRarePlanMealSource) {
			const activePlan = getDisplayedCustomerRarePlan(
				currentStore.persistence.plans.get()
			);
			if (activePlan.mealSource === source) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveCustomerRarePlan(prev);
				updateActiveCustomerRarePlan(prev, (plan) => {
					plan.mealSource = source;
					return true;
				});
			});
			trackCustomerRarePlanMealSourceChange(source);
		},
		setMode(mode: TCustomerRarePlanMode) {
			const activePlan = getDisplayedCustomerRarePlan(
				currentStore.persistence.plans.get()
			);
			if (activePlan.mode === mode) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveCustomerRarePlan(prev);
				updateActiveCustomerRarePlan(prev, (plan) => {
					plan.mode = mode;
					return true;
				});
			});
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Mode Button',
				mode
			);
		},
		setPlaces(values: ReadonlyArray<TPlace>) {
			const nextValues = dedupeCustomerRarePlanValues(values);
			const activePlan = getDisplayedCustomerRarePlan(
				currentStore.persistence.plans.get()
			);
			if (checkArrayEqualOf(activePlan.places, nextValues)) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveCustomerRarePlan(prev);
				updateActiveCustomerRarePlan(prev, (plan) => {
					plan.places = nextValues;
					return true;
				});
			});
			trackCustomerRarePlanFilterChange('places', nextValues.length);
		},
		toggleControlsCollapsed() {
			currentStore.shared.drawer.isControlsCollapsed.set(
				(isCollapsed) => !isCollapsed
			);
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Drawer Button',
				'Controls Toggle'
			);
		},
		toggleCustomerExpanded(customerName: TCustomerRareName) {
			const wasExpanded = currentStore.shared.drawer.expandedCustomerNames
				.get()
				.has(customerName);
			currentStore.shared.drawer.expandedCustomerNames.set((prev) => {
				if (prev.has(customerName)) {
					prev.delete(customerName);
				} else {
					prev.add(customerName);
				}
			});
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Group Button',
				`${wasExpanded ? 'Collapse' : 'Expand'}:${customerName}`
			);
		},
		trackCustomerNavigation(
			customerName: TCustomerRareName,
			label: 'Create Meal' | 'Open Customer'
		) {
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Navigation Button',
				`${label}:${customerName}`
			);
		},
	};
}
