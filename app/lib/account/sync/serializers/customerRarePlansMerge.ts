import type { ICustomerRarePlan, ICustomerRarePlansState } from '@/types';

const LEGACY_PLAN_KEYS = [
	'createdAt',
	'excludes',
	'id',
	'includes',
	'manualCustomers',
	'mealSource',
	'mode',
	'name',
	'places',
	'updatedAt',
] as const;
const PLAN_KEYS = [...LEGACY_PLAN_KEYS, 'customerSort'] as const;

function checkPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && !Array.isArray(value) && typeof value === 'object';
}

function checkExactKeys(
	value: Record<string, unknown>,
	keys: ReadonlyArray<string>
) {
	const expectedKeys = new Set(keys);
	const actualKeys = Object.keys(value);
	return (
		actualKeys.length === expectedKeys.size &&
		actualKeys.every((key) => expectedKeys.has(key))
	);
}

function checkEmptyArray(value: unknown) {
	return Array.isArray(value) && value.length === 0;
}

function checkSnapshotEqual(left: unknown, right: unknown) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function checkPlanTimestamp(value: unknown): value is number {
	return (
		typeof value === 'number' &&
		Number.isSafeInteger(value) &&
		value >= 0 &&
		value < Number.MAX_SAFE_INTEGER
	);
}

export function checkLegacyPristineDefaultPlan(
	value: unknown,
	schemaVersion: number
) {
	if (
		(schemaVersion !== 1 && schemaVersion !== 2) ||
		!checkPlainObject(value) ||
		!checkExactKeys(
			value,
			schemaVersion === 1 ? LEGACY_PLAN_KEYS : PLAN_KEYS
		) ||
		!checkPlanTimestamp(value['createdAt']) ||
		!checkPlanTimestamp(value['updatedAt'])
	) {
		return false;
	}

	return (
		value['createdAt'] === value['updatedAt'] &&
		(schemaVersion === 1 || value['customerSort'] === 'default') &&
		checkEmptyArray(value['excludes']) &&
		checkEmptyArray(value['includes']) &&
		checkEmptyArray(value['manualCustomers']) &&
		value['mealSource'] === 'saved' &&
		value['mode'] === 'region' &&
		value['name'] === '默认预设' &&
		checkEmptyArray(value['places'])
	);
}

export function migrateCustomerRarePlansSnapshot(
	data: unknown,
	schemaVersion: number
) {
	if (schemaVersion !== 1 && schemaVersion !== 2 && schemaVersion !== 3) {
		throw new Error('unsupported-customer-rare-plans-schema-version');
	}
	if (
		schemaVersion === 3 ||
		!checkPlainObject(data) ||
		!Array.isArray(data['items'])
	) {
		return data;
	}

	const items = data['items']
		.filter((item) => !checkLegacyPristineDefaultPlan(item, schemaVersion))
		.map((item) =>
			schemaVersion === 1 &&
			checkPlainObject(item) &&
			!('customerSort' in item)
				? { ...item, customerSort: 'default' }
				: item
		);
	const itemIds = new Set(
		items.flatMap((item) =>
			checkPlainObject(item) && typeof item['id'] === 'string'
				? [item['id']]
				: []
		)
	);
	const currentActiveId = data['activeId'];
	const activeId =
		typeof currentActiveId === 'string' && itemIds.has(currentActiveId)
			? currentActiveId
			: (itemIds.values().next().value ?? null);

	return { ...data, activeId, items };
}

const CUSTOMER_RARE_PLAN_ATOMIC_GROUPS = [
	['name'],
	['customerSort'],
	['mealSource'],
	['mode', 'places', 'manualCustomers', 'includes', 'excludes'],
] as const satisfies ReadonlyArray<ReadonlyArray<keyof ICustomerRarePlan>>;

function createPlanMap(snapshot: ICustomerRarePlansState) {
	return new Map(snapshot.items.map((plan) => [plan.id, plan]));
}

function checkPlanContentEqual(
	left: ICustomerRarePlan | undefined,
	right: ICustomerRarePlan | undefined
) {
	if (left === undefined || right === undefined) {
		return left === right;
	}

	return CUSTOMER_RARE_PLAN_ATOMIC_GROUPS.every((group) =>
		group.every((key) => checkSnapshotEqual(left[key], right[key]))
	);
}

function mergeExistingPlan({
	base,
	cloud,
	local,
}: {
	base: ICustomerRarePlan;
	cloud: ICustomerRarePlan;
	local: ICustomerRarePlan;
}) {
	const data = { ...base };
	let requiresConfirmation = false;

	for (const group of CUSTOMER_RARE_PLAN_ATOMIC_GROUPS) {
		const hasCloudChange = group.some(
			(key) => !checkSnapshotEqual(cloud[key], base[key])
		);
		const hasLocalChange = group.some(
			(key) => !checkSnapshotEqual(local[key], base[key])
		);
		const hasEqualResult = group.every((key) =>
			checkSnapshotEqual(cloud[key], local[key])
		);
		const source = hasLocalChange
			? hasCloudChange
				? cloud
				: local
			: cloud;

		requiresConfirmation ||=
			hasCloudChange && hasLocalChange && !hasEqualResult;
		for (const key of group) {
			Object.assign(data, { [key]: source[key] });
		}
	}

	data.updatedAt = Math.max(base.updatedAt, cloud.updatedAt, local.updatedAt);

	return { data, requiresConfirmation };
}

function resolveActiveId(
	cloud: ICustomerRarePlansState,
	local: ICustomerRarePlansState,
	items: ReadonlyArray<ICustomerRarePlan>
) {
	const itemIds = new Set(items.map(({ id }) => id));

	return cloud.activeId !== null && itemIds.has(cloud.activeId)
		? cloud.activeId
		: local.activeId !== null && itemIds.has(local.activeId)
			? local.activeId
			: (items[0]?.id ?? null);
}

export function mergeCustomerRarePlansSnapshots({
	base,
	cloud,
	local,
}: {
	base: ICustomerRarePlansState | null;
	cloud: ICustomerRarePlansState;
	local: ICustomerRarePlansState;
}) {
	if (base === null) {
		if (checkSnapshotEqual(cloud, local)) {
			return {
				data: cloud,
				hasConflict: false,
				requiresConfirmation: false,
			};
		}
		if (local.items.length === 0) {
			return {
				data: cloud,
				hasConflict: false,
				requiresConfirmation: false,
			};
		}
		if (cloud.items.length === 0) {
			return {
				data: local,
				hasConflict: false,
				requiresConfirmation: false,
			};
		}
	}

	const baseMap =
		base === null
			? new Map<string, ICustomerRarePlan>()
			: createPlanMap(base);
	const cloudMap = createPlanMap(cloud);
	const localMap = createPlanMap(local);
	const planIds = new Set([
		...baseMap.keys(),
		...cloudMap.keys(),
		...localMap.keys(),
	]);
	const items: ICustomerRarePlan[] = [];
	let hasConflict = false;
	let requiresConfirmation = base === null;

	for (const planId of planIds) {
		const basePlan = baseMap.get(planId);
		const cloudPlan = cloudMap.get(planId);
		const localPlan = localMap.get(planId);

		if (cloudPlan === undefined && localPlan === undefined) {
			continue;
		}
		if (basePlan === undefined) {
			if (cloudPlan === undefined) {
				items.push(localPlan as ICustomerRarePlan);
			} else if (localPlan === undefined) {
				items.push(cloudPlan);
			} else if (checkSnapshotEqual(cloudPlan, localPlan)) {
				items.push(cloudPlan);
			} else {
				items.push(cloudPlan);
				requiresConfirmation = true;
			}
			continue;
		}

		if (cloudPlan === undefined || localPlan === undefined) {
			const remainingPlan = cloudPlan ?? localPlan;
			if (checkPlanContentEqual(remainingPlan, basePlan)) {
				continue;
			}
			hasConflict = true;
			if (remainingPlan !== undefined) {
				items.push(remainingPlan);
			}
			continue;
		}
		if (
			cloudPlan.createdAt !== basePlan.createdAt ||
			localPlan.createdAt !== basePlan.createdAt
		) {
			hasConflict = true;
			items.push(cloudPlan);
			continue;
		}

		const mergedPlan = mergeExistingPlan({
			base: basePlan,
			cloud: cloudPlan,
			local: localPlan,
		});
		items.push(mergedPlan.data);
		requiresConfirmation ||= mergedPlan.requiresConfirmation;
	}

	items.sort(
		(left, right) =>
			left.createdAt - right.createdAt || left.id.localeCompare(right.id)
	);

	return {
		data: {
			activeId: resolveActiveId(cloud, local, items),
			items,
		} satisfies ICustomerRarePlansState,
		hasConflict,
		requiresConfirmation,
	};
}
