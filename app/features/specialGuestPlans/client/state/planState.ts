import { createAccountClientId } from '@/features/account/client/clientId';
import { resolveEffectiveLocale } from '@/features/preferences/client/state/localeMirror';
import { getLocalePreference } from '@/features/preferences/client/state/localeRuntime';
import { specialGuestPlansMessages } from '@/features/specialGuestPlans/client/messages';
import { SPECIAL_GUEST_PLAN_MAX_NAME_LENGTH } from '@/features/specialGuestPlans/constants';
import type {
	ISpecialGuestPlan,
	ISpecialGuestPlansState,
} from '@/features/specialGuestPlans/contracts';

import { translate } from '@/shared/i18n/messages';

function getSpecialGuestPlanDefaultName() {
	return translate(
		specialGuestPlansMessages,
		resolveEffectiveLocale(getLocalePreference()),
		'plans.defaultName'
	);
}

function getSpecialGuestPlanCopySuffix() {
	return translate(
		specialGuestPlansMessages,
		resolveEffectiveLocale(getLocalePreference()),
		'plans.copySuffix'
	);
}

const SPECIAL_GUEST_VIRTUAL_PLAN_ID = '__virtual_default__';

function createSpecialGuestVirtualPlan(): ISpecialGuestPlan {
	return {
		createdAt: 0,
		excludes: [],
		guestSort: 'default',
		id: SPECIAL_GUEST_VIRTUAL_PLAN_ID,
		includes: [],
		manualGuests: [],
		maps: [],
		mealSource: 'saved',
		mode: 'region',
		name: getSpecialGuestPlanDefaultName(),
		updatedAt: 0,
	};
}

export function normalizeSpecialGuestPlanName(name: string) {
	const trimmedName = name
		.trim()
		.slice(0, SPECIAL_GUEST_PLAN_MAX_NAME_LENGTH);

	return trimmedName.length === 0
		? getSpecialGuestPlanDefaultName()
		: trimmedName;
}

export function createSpecialGuestPlan(
	overrides: Partial<ISpecialGuestPlan> = {}
): ISpecialGuestPlan {
	const now = Date.now();

	return {
		createdAt: now,
		excludes: [],
		guestSort: 'default',
		id: createAccountClientId(),
		includes: [],
		manualGuests: [],
		maps: [],
		mealSource: 'saved',
		mode: 'region',
		name: getSpecialGuestPlanDefaultName(),
		updatedAt: now,
		...overrides,
	};
}

export function copySpecialGuestPlan(
	plan: ISpecialGuestPlan
): ISpecialGuestPlan {
	const now = Date.now();

	return {
		...plan,
		createdAt: now,
		excludes: [...plan.excludes],
		guestSort: plan.guestSort,
		id: createAccountClientId(),
		includes: [...plan.includes],
		manualGuests: [...plan.manualGuests],
		maps: [...plan.maps],
		mealSource: plan.mealSource,
		name: normalizeSpecialGuestPlanName(
			`${plan.name}${getSpecialGuestPlanCopySuffix()}`
		),
		updatedAt: now,
	};
}

export function dedupeSpecialGuestPlanValues<T extends number | string>(
	values: ReadonlyArray<T>
) {
	return [...new Set(values)];
}

function getActiveSpecialGuestPlanFromState({
	activeId,
	items,
}: ISpecialGuestPlansState) {
	return items.find(({ id }) => id === activeId) ?? null;
}

export function checkSpecialGuestPlansStateVirtual(
	plans: ISpecialGuestPlansState
) {
	return plans.items.length === 0;
}

export function getDisplayedSpecialGuestPlan(plans: ISpecialGuestPlansState) {
	return (
		getActiveSpecialGuestPlanFromState(plans) ??
		plans.items[0] ??
		createSpecialGuestVirtualPlan()
	);
}

export function updateActiveSpecialGuestPlan(
	plans: ISpecialGuestPlansState,
	callback: (plan: ISpecialGuestPlan) => boolean | undefined
) {
	const plan = getActiveSpecialGuestPlanFromState(plans);
	if (plan === null) {
		return;
	}

	if (callback(plan) === false) {
		return;
	}
	plan.updatedAt = Date.now();
}

export function materializeActiveSpecialGuestPlan(
	plans: ISpecialGuestPlansState
) {
	const activePlan = getActiveSpecialGuestPlanFromState(plans);
	if (activePlan !== null) {
		return activePlan;
	}

	const [fallbackPlan] = plans.items;
	if (fallbackPlan !== undefined) {
		plans.activeId = fallbackPlan.id;
		return fallbackPlan;
	}

	const plan = createSpecialGuestPlan();
	plans.items.push(plan);
	plans.activeId = plan.id;
	return plan;
}

export function removeSpecialGuestPlanFromState(
	plans: ISpecialGuestPlansState,
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
