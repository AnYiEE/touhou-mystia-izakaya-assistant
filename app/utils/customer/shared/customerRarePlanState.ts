import {
	CUSTOMER_RARE_PLAN_DEFAULT_NAME,
	CUSTOMER_RARE_PLAN_MAX_NAME_LENGTH,
} from './customerRarePlanConstants';
import { createAccountClientId } from '@/lib/account/client/random';
import type { ICustomerRarePlan, ICustomerRarePlansState } from '@/types';

export const CUSTOMER_RARE_VIRTUAL_PLAN_ID = '__virtual_default__';

export function createCustomerRareVirtualPlan(): ICustomerRarePlan {
	return {
		createdAt: 0,
		customerSort: 'default',
		excludes: [],
		id: CUSTOMER_RARE_VIRTUAL_PLAN_ID,
		includes: [],
		manualCustomers: [],
		mealSource: 'saved',
		mode: 'region',
		name: CUSTOMER_RARE_PLAN_DEFAULT_NAME,
		places: [],
		updatedAt: 0,
	};
}

export function normalizeCustomerRarePlanName(name: string) {
	const trimmedName = name
		.trim()
		.slice(0, CUSTOMER_RARE_PLAN_MAX_NAME_LENGTH);

	return trimmedName.length === 0
		? CUSTOMER_RARE_PLAN_DEFAULT_NAME
		: trimmedName;
}

export function createCustomerRarePlan(
	overrides: Partial<ICustomerRarePlan> = {}
): ICustomerRarePlan {
	const now = Date.now();

	return {
		createdAt: now,
		customerSort: 'default',
		excludes: [],
		id: createAccountClientId(),
		includes: [],
		manualCustomers: [],
		mealSource: 'saved',
		mode: 'region',
		name: CUSTOMER_RARE_PLAN_DEFAULT_NAME,
		places: [],
		updatedAt: now,
		...overrides,
	};
}

export function copyCustomerRarePlan(
	plan: ICustomerRarePlan
): ICustomerRarePlan {
	const now = Date.now();

	return {
		...plan,
		createdAt: now,
		customerSort: plan.customerSort,
		excludes: [...plan.excludes],
		id: createAccountClientId(),
		includes: [...plan.includes],
		manualCustomers: [...plan.manualCustomers],
		mealSource: plan.mealSource,
		name: normalizeCustomerRarePlanName(`${plan.name} 副本`),
		places: [...plan.places],
		updatedAt: now,
	};
}

export function dedupeCustomerRarePlanValues<T extends string>(
	values: ReadonlyArray<T>
) {
	return [...new Set(values)];
}

export function getActiveCustomerRarePlanFromState({
	activeId,
	items,
}: ICustomerRarePlansState) {
	return items.find(({ id }) => id === activeId) ?? null;
}

export function checkCustomerRarePlansStateVirtual(
	plans: ICustomerRarePlansState
) {
	return plans.items.length === 0;
}

export function getDisplayedCustomerRarePlan(plans: ICustomerRarePlansState) {
	return (
		getActiveCustomerRarePlanFromState(plans) ??
		plans.items[0] ??
		createCustomerRareVirtualPlan()
	);
}

export function updateActiveCustomerRarePlan(
	plans: ICustomerRarePlansState,
	callback: (plan: ICustomerRarePlan) => boolean | undefined
) {
	const plan = getActiveCustomerRarePlanFromState(plans);
	if (plan === null) {
		return;
	}

	if (callback(plan) === false) {
		return;
	}
	plan.updatedAt = Date.now();
}

export function materializeActiveCustomerRarePlan(
	plans: ICustomerRarePlansState
) {
	const activePlan = getActiveCustomerRarePlanFromState(plans);
	if (activePlan !== null) {
		return activePlan;
	}

	const [fallbackPlan] = plans.items;
	if (fallbackPlan !== undefined) {
		plans.activeId = fallbackPlan.id;
		return fallbackPlan;
	}

	const plan = createCustomerRarePlan();
	plans.items.push(plan);
	plans.activeId = plan.id;
	return plan;
}

export function removeCustomerRarePlanFromState(
	plans: ICustomerRarePlansState,
	planId: string
) {
	plans.items = plans.items.filter(({ id }) => id !== planId);
	if (
		plans.activeId === planId ||
		!plans.items.some(({ id }) => id === plans.activeId)
	) {
		plans.activeId = plans.items[0]?.id ?? null;
	}
}
