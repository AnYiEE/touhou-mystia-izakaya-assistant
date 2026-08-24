import type { State } from '@davstack/store';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { ISpecialGuestSavedMeal } from '@/domain/meals/types';
import { type TRecommendationSortProfile } from '@/domain/recommendations/sortProfiles';
import type { IPopularTrend } from '@/domain/trends/types';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import {
	requestOverlayClose,
	requestOverlayOpen,
} from '@/features/overlays/client';
import { resolveSpecialGuestPlan } from '@/features/specialGuestPlans/client/mealPlanning/resolveSpecialGuestPlan';
import type {
	ISpecialGuestPlansState,
	TSpecialGuestPlanGuestSort,
	TSpecialGuestPlanMealSource,
	TSpecialGuestPlanMode,
} from '@/features/specialGuestPlans/contracts';

import { checkArrayEqualOf } from '@/shared/utilities/collections/check';
import { createComputedAccessor } from '@/shared/utilities/state/createComputedAccessor';

import {
	checkSpecialGuestPlansStateVirtual,
	copySpecialGuestPlan,
	createSpecialGuestPlan,
	dedupeSpecialGuestPlanValues,
	getDisplayedSpecialGuestPlan,
	materializeActiveSpecialGuestPlan,
	normalizeSpecialGuestPlanName,
	removeSpecialGuestPlanFromState,
	updateActiveSpecialGuestPlan,
} from './planState';

export const specialGuestPlansStateDefinition = {
	persistence: {
		plans: { activeId: null, items: [] } as ISpecialGuestPlansState,
	},
	shared: {
		drawer: {
			expandedSpecialGuests: new Set<TSpecialGuestId>(),
			isControlsCollapsed: false,
			isOpen: false,
			sortProfileOverride: null as TRecommendationSortProfile | null,
		},
	},
};

interface ISpecialGuestPlansStoreContext {
	persistence: {
		meals: State<
			Partial<Record<TSpecialGuestId, ISpecialGuestSavedMeal[]>>
		>;
		plans: State<ISpecialGuestPlansState>;
	};
	shared: {
		beverage: { table: { hiddenBeverages: State<Set<TBeverageId>> } };
		drawer: State<
			(typeof specialGuestPlansStateDefinition)['shared']['drawer']
		>;
		guest: {
			famousShop: State<boolean>;
			popularTrend: State<IPopularTrend>;
		};
		hiddenItems: { dlcs: State<Set<TDlc>> };
		recipe: {
			table: {
				hiddenFoods: State<Set<TFoodId>>;
				hiddenIngredients: State<Set<TIngredientId>>;
			};
		};
	};
}

function trackSpecialGuestPlanFilterChange(
	name: 'excludes' | 'includes' | 'manualCustomers' | 'places',
	count: number
) {
	trackEvent(
		trackEvent.category.click,
		'Customer Rare Plan Filter Button',
		`${name}:${count}`
	);
}

function trackSpecialGuestPlanMealSourceChange(
	source: TSpecialGuestPlanMealSource
) {
	trackEvent(
		trackEvent.category.click,
		'Customer Rare Plan Meal Source Button',
		source
	);
}

function trackSpecialGuestPlanGuestSortChange(
	guestSort: TSpecialGuestPlanGuestSort
) {
	trackEvent(
		trackEvent.category.click,
		'Customer Rare Plan Sort Button',
		guestSort
	);
}

export function createSpecialGuestPlansComputedDefinition(
	currentStore: ISpecialGuestPlansStoreContext
) {
	const resolvedGroups = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const plans = shouldGet
			? currentStore.persistence.plans.get()
			: currentStore.persistence.plans.use();
		const activePlan = getDisplayedSpecialGuestPlan(plans);

		return resolveSpecialGuestPlan({
			hiddenBeverages: shouldGet
				? currentStore.shared.beverage.table.hiddenBeverages.get()
				: currentStore.shared.beverage.table.hiddenBeverages.use(),
			hiddenDlcs: shouldGet
				? currentStore.shared.hiddenItems.dlcs.get()
				: currentStore.shared.hiddenItems.dlcs.use(),
			hiddenFoods: shouldGet
				? currentStore.shared.recipe.table.hiddenFoods.get()
				: currentStore.shared.recipe.table.hiddenFoods.use(),
			hiddenIngredients: shouldGet
				? currentStore.shared.recipe.table.hiddenIngredients.get()
				: currentStore.shared.recipe.table.hiddenIngredients.use(),
			isFamousShop: shouldGet
				? currentStore.shared.guest.famousShop.get()
				: currentStore.shared.guest.famousShop.use(),
			meals: shouldGet
				? currentStore.persistence.meals.get()
				: currentStore.persistence.meals.use(),
			plan: activePlan,
			popularTrend: shouldGet
				? currentStore.shared.guest.popularTrend.get()
				: currentStore.shared.guest.popularTrend.use(),
		});
	});

	const summary = createComputedAccessor((getOrUse) => {
		const groups =
			getOrUse === 'get' ? resolvedGroups.get() : resolvedGroups.use();

		return {
			guestCount: groups.length,
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

export function createSpecialGuestPlansActionsDefinition(
	currentStore: ISpecialGuestPlansStoreContext
) {
	const specialGuestCatalog = SpecialGuestCatalog.getInstance();

	function closeDrawerForNavigation() {
		currentStore.shared.drawer.isOpen.set(false);
		requestOverlayClose('special-guest.plan-drawer');
	}

	return {
		closeDrawer() {
			if (!currentStore.shared.drawer.isOpen.get()) {
				requestOverlayClose('special-guest.plan-drawer');
				return;
			}
			currentStore.shared.drawer.isOpen.set(false);
			requestOverlayClose('special-guest.plan-drawer');
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Drawer Button',
				'Close'
			);
		},
		closeDrawerForNavigation,
		copyPlan(planId: string) {
			const plans = currentStore.persistence.plans.get();
			if (checkSpecialGuestPlansStateVirtual(plans)) {
				return;
			}
			const sourcePlan = plans.items.find(({ id }) => id === planId);
			if (sourcePlan === undefined) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				const copiedPlan = copySpecialGuestPlan(sourcePlan);
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
				const plan = createSpecialGuestPlan();
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
				checkSpecialGuestPlansStateVirtual(plans) ||
				!plans.items.some(({ id }) => id === planId)
			) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				removeSpecialGuestPlanFromState(prev, planId);
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
			requestOverlayOpen('special-guest.plan-drawer', {
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
			const nextName = normalizeSpecialGuestPlanName(name);
			const plans = currentStore.persistence.plans.get();
			const displayedPlan = getDisplayedSpecialGuestPlan(plans);
			if (
				displayedPlan.id !== planId ||
				displayedPlan.name === nextName
			) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				const plan = materializeActiveSpecialGuestPlan(prev);
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
				checkSpecialGuestPlansStateVirtual(plans) ||
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
		setExcludes(values: ReadonlyArray<TSpecialGuestId>) {
			const nextValues = dedupeSpecialGuestPlanValues(values);
			const activePlan = getDisplayedSpecialGuestPlan(
				currentStore.persistence.plans.get()
			);
			if (checkArrayEqualOf(activePlan.excludes, nextValues)) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveSpecialGuestPlan(prev);
				updateActiveSpecialGuestPlan(prev, (plan) => {
					plan.excludes = nextValues;
					return true;
				});
			});
			trackSpecialGuestPlanFilterChange('excludes', nextValues.length);
		},
		setGuestSort(guestSort: TSpecialGuestPlanGuestSort) {
			const activePlan = getDisplayedSpecialGuestPlan(
				currentStore.persistence.plans.get()
			);
			if (activePlan.guestSort === guestSort) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveSpecialGuestPlan(prev);
				updateActiveSpecialGuestPlan(prev, (plan) => {
					plan.guestSort = guestSort;
					return true;
				});
			});
			trackSpecialGuestPlanGuestSortChange(guestSort);
		},
		setIncludes(values: ReadonlyArray<TSpecialGuestId>) {
			const nextValues = dedupeSpecialGuestPlanValues(values);
			const activePlan = getDisplayedSpecialGuestPlan(
				currentStore.persistence.plans.get()
			);
			if (checkArrayEqualOf(activePlan.includes, nextValues)) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveSpecialGuestPlan(prev);
				updateActiveSpecialGuestPlan(prev, (plan) => {
					plan.includes = nextValues;
					return true;
				});
			});
			trackSpecialGuestPlanFilterChange('includes', nextValues.length);
		},
		setManualGuests(values: ReadonlyArray<TSpecialGuestId>) {
			const nextValues = dedupeSpecialGuestPlanValues(values);
			const activePlan = getDisplayedSpecialGuestPlan(
				currentStore.persistence.plans.get()
			);
			if (checkArrayEqualOf(activePlan.manualGuests, nextValues)) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveSpecialGuestPlan(prev);
				updateActiveSpecialGuestPlan(prev, (plan) => {
					plan.manualGuests = nextValues;
					return true;
				});
			});
			trackSpecialGuestPlanFilterChange(
				'manualCustomers',
				nextValues.length
			);
		},
		setMaps(values: ReadonlyArray<TMapLabel>) {
			const nextValues = dedupeSpecialGuestPlanValues(values);
			const activePlan = getDisplayedSpecialGuestPlan(
				currentStore.persistence.plans.get()
			);
			if (checkArrayEqualOf(activePlan.maps, nextValues)) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveSpecialGuestPlan(prev);
				updateActiveSpecialGuestPlan(prev, (plan) => {
					plan.maps = nextValues;
					return true;
				});
			});
			trackSpecialGuestPlanFilterChange('places', nextValues.length);
		},
		setMealSource(source: TSpecialGuestPlanMealSource) {
			const activePlan = getDisplayedSpecialGuestPlan(
				currentStore.persistence.plans.get()
			);
			if (activePlan.mealSource === source) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveSpecialGuestPlan(prev);
				updateActiveSpecialGuestPlan(prev, (plan) => {
					plan.mealSource = source;
					return true;
				});
			});
			trackSpecialGuestPlanMealSourceChange(source);
		},
		setMode(mode: TSpecialGuestPlanMode) {
			const activePlan = getDisplayedSpecialGuestPlan(
				currentStore.persistence.plans.get()
			);
			if (activePlan.mode === mode) {
				return;
			}
			currentStore.persistence.plans.set((prev) => {
				materializeActiveSpecialGuestPlan(prev);
				updateActiveSpecialGuestPlan(prev, (plan) => {
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
		toggleSpecialGuestExpanded(specialGuest: TSpecialGuestId) {
			const wasExpanded = currentStore.shared.drawer.expandedSpecialGuests
				.get()
				.has(specialGuest);
			currentStore.shared.drawer.expandedSpecialGuests.set((prev) => {
				if (prev.has(specialGuest)) {
					prev.delete(specialGuest);
				} else {
					prev.add(specialGuest);
				}
			});
			const specialGuestName = specialGuestCatalog.getPropsById(
				specialGuest,
				'name'
			);
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Group Button',
				`${wasExpanded ? 'Collapse' : 'Expand'}:${specialGuestName}`
			);
		},
		trackSpecialGuestNavigation(
			specialGuest: TSpecialGuestId,
			label: 'Create Meal' | 'Open Customer'
		) {
			const specialGuestName = specialGuestCatalog.getPropsById(
				specialGuest,
				'name'
			);
			trackEvent(
				trackEvent.category.click,
				'Customer Rare Plan Navigation Button',
				`${label}:${specialGuestName}`
			);
		},
	};
}
