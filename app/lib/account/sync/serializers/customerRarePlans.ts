import {
	mergeCustomerRarePlansSnapshots,
	migrateCustomerRarePlansSnapshot,
} from './customerRarePlansMerge';
import {
	checkSnapshotEqual,
	createMergeResult,
	createSerializerConflict,
	hasExactKeys,
	isPlainObject,
} from './utils';
import { ALL_PLACES_SET, type TCustomerRareName, type TPlace } from '@/data';
import {
	type ISyncNamespaceSerializer,
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
} from '@/lib/account/sync';
import { customerRareStore } from '@/stores/customer-rare';
import type {
	ICustomerRarePlan,
	ICustomerRarePlansState,
	TCustomerRarePlanCustomerSort,
	TCustomerRarePlanMealSource,
	TCustomerRarePlanMode,
} from '@/types';
import { cloneJsonObject } from '@/utilities';
import { CustomerRare } from '@/utils';
import { CUSTOMER_RARE_PLAN_MAX_NAME_LENGTH } from '@/utils/customer/shared/customerRarePlanConstants';

export type TCustomerRarePlansSnapshot = ICustomerRarePlansState;

const defaultSnapshot: TCustomerRarePlansSnapshot = {
	activeId: null,
	items: [],
};
const customerRareNames = new Set<string>(
	CustomerRare.getInstance().getNames()
);
const planCustomerSorts = new Set<TCustomerRarePlanCustomerSort>([
	'default',
	'pinyin-asc',
	'pinyin-asc-flat',
	'pinyin-desc',
	'pinyin-desc-flat',
]);
const planModes = new Set<TCustomerRarePlanMode>(['manual', 'region']);
const planMealSources = new Set<TCustomerRarePlanMealSource>([
	'recommended',
	'saved',
]);

function checkCustomerRareName(value: unknown): value is TCustomerRareName {
	return typeof value === 'string' && customerRareNames.has(value);
}

function checkPlace(value: unknown): value is TPlace {
	return typeof value === 'string' && ALL_PLACES_SET.has(value);
}

function checkPlanMode(value: unknown): value is TCustomerRarePlanMode {
	return (
		typeof value === 'string' &&
		planModes.has(value as TCustomerRarePlanMode)
	);
}

function checkPlanCustomerSort(
	value: unknown
): value is TCustomerRarePlanCustomerSort {
	return (
		typeof value === 'string' &&
		planCustomerSorts.has(value as TCustomerRarePlanCustomerSort)
	);
}

function checkPlanMealSource(
	value: unknown
): value is TCustomerRarePlanMealSource {
	return (
		typeof value === 'string' &&
		planMealSources.has(value as TCustomerRarePlanMealSource)
	);
}

function checkPlanTimestamp(value: unknown): value is number {
	return (
		typeof value === 'number' &&
		Number.isSafeInteger(value) &&
		value >= 0 &&
		value < Number.MAX_SAFE_INTEGER
	);
}

function checkStringArrayOf<T extends string>(
	value: unknown,
	checkItem: (item: unknown) => item is T
): value is T[] {
	return Array.isArray(value) && value.every(checkItem);
}

function dedupeValues<T extends string>(values: ReadonlyArray<T>) {
	return [...new Set(values)];
}

function validateCustomerRarePlan(data: unknown): data is ICustomerRarePlan {
	return (
		isPlainObject(data) &&
		hasExactKeys(data, [
			'createdAt',
			'customerSort',
			'excludes',
			'id',
			'includes',
			'manualCustomers',
			'mealSource',
			'mode',
			'name',
			'places',
			'updatedAt',
		]) &&
		checkPlanTimestamp(data['createdAt']) &&
		checkPlanCustomerSort(data['customerSort']) &&
		checkStringArrayOf(data['excludes'], checkCustomerRareName) &&
		typeof data['id'] === 'string' &&
		data['id'].length > 0 &&
		data['id'].length <= 128 &&
		checkStringArrayOf(data['includes'], checkCustomerRareName) &&
		checkStringArrayOf(data['manualCustomers'], checkCustomerRareName) &&
		checkPlanMealSource(data['mealSource']) &&
		checkPlanMode(data['mode']) &&
		typeof data['name'] === 'string' &&
		data['name'].trim().length > 0 &&
		data['name'].length <= CUSTOMER_RARE_PLAN_MAX_NAME_LENGTH &&
		checkStringArrayOf(data['places'], checkPlace) &&
		checkPlanTimestamp(data['updatedAt'])
	);
}

function normalizeCustomerRarePlan(plan: ICustomerRarePlan) {
	return {
		createdAt: plan.createdAt,
		customerSort: plan.customerSort,
		excludes: dedupeValues(plan.excludes),
		id: plan.id,
		includes: dedupeValues(plan.includes),
		manualCustomers: dedupeValues(plan.manualCustomers),
		mealSource: plan.mealSource,
		mode: plan.mode,
		name: plan.name.trim().slice(0, CUSTOMER_RARE_PLAN_MAX_NAME_LENGTH),
		places: dedupeValues(plan.places),
		updatedAt: plan.updatedAt,
	} satisfies ICustomerRarePlan;
}

function normalizeCustomerRarePlansSnapshot(data: TCustomerRarePlansSnapshot) {
	const seenIds = new Set<string>();
	const items = data.items.reduce<ICustomerRarePlan[]>((result, plan) => {
		if (seenIds.has(plan.id)) {
			return result;
		}
		seenIds.add(plan.id);
		result.push(normalizeCustomerRarePlan(plan));

		return result;
	}, []);
	const activeId =
		data.activeId !== null && seenIds.has(data.activeId)
			? data.activeId
			: (items[0]?.id ?? null);

	return { activeId, items } satisfies TCustomerRarePlansSnapshot;
}

function sanitizeCustomerRarePlansSnapshot(data: unknown) {
	if (
		!isPlainObject(data) ||
		(data['activeId'] !== null && typeof data['activeId'] !== 'string') ||
		!Array.isArray(data['items'])
	) {
		return defaultSnapshot;
	}

	const items = data['items'].filter(validateCustomerRarePlan);

	return normalizeCustomerRarePlansSnapshot({
		activeId: data['activeId'],
		items,
	});
}

export const customerRarePlansSerializer = {
	deserialize(data) {
		return this.migrate(
			data,
			SYNC_SCHEMA_VERSION_MAP[SYNC_NAMESPACE_MAP.customerRarePlans]
		);
	},
	getDefaultSnapshot() {
		return defaultSnapshot;
	},
	getLocalSnapshot() {
		return sanitizeCustomerRarePlansSnapshot(
			cloneJsonObject(customerRareStore.persistence.plans.get())
		);
	},
	merge({ base, cloud, local, namespace }) {
		const localSnapshot = normalizeCustomerRarePlansSnapshot(local);

		if (cloud === null) {
			return createMergeResult({
				data: localSnapshot,
				shouldUpload: !checkSnapshotEqual(
					localSnapshot,
					defaultSnapshot
				),
			});
		}

		const cloudSnapshot = normalizeCustomerRarePlansSnapshot(cloud);
		if (base === null) {
			if (
				checkSnapshotEqual(localSnapshot, cloudSnapshot) ||
				checkSnapshotEqual(localSnapshot, defaultSnapshot)
			) {
				return createMergeResult({
					data: cloudSnapshot,
					shouldUpload: false,
				});
			}
			if (checkSnapshotEqual(cloudSnapshot, defaultSnapshot)) {
				return createMergeResult({
					data: localSnapshot,
					shouldUpload: true,
				});
			}
		}

		const baseSnapshot =
			base === null ? null : normalizeCustomerRarePlansSnapshot(base);
		const merged = mergeCustomerRarePlansSnapshots({
			base: baseSnapshot,
			cloud: cloudSnapshot,
			local: localSnapshot,
		});

		if (merged.hasConflict) {
			return createMergeResult({
				conflict: createSerializerConflict({
					cloud: cloudSnapshot,
					local: localSnapshot,
					namespace,
					userId: '',
				}),
				data: cloudSnapshot,
				shouldUpload: false,
			});
		}

		return createMergeResult({
			data: merged.data,
			requiresConfirmation: merged.requiresConfirmation,
			shouldUpload: !checkSnapshotEqual(merged.data, cloudSnapshot),
		});
	},
	migrate(data, version) {
		const migratedData = migrateCustomerRarePlansSnapshot(data, version);

		if (!this.validate(migratedData)) {
			throw new Error('invalid-customer-rare-plans');
		}

		return normalizeCustomerRarePlansSnapshot(migratedData);
	},
	serialize(data) {
		return normalizeCustomerRarePlansSnapshot(data);
	},
	setLocalSnapshot(data) {
		customerRareStore.persistence.plans.set(
			normalizeCustomerRarePlansSnapshot(data)
		);
	},
	validate(data): data is TCustomerRarePlansSnapshot {
		if (
			!isPlainObject(data) ||
			!hasExactKeys(data, ['activeId', 'items']) ||
			(data['activeId'] !== null &&
				typeof data['activeId'] !== 'string') ||
			!Array.isArray(data['items']) ||
			!data['items'].every(validateCustomerRarePlan)
		) {
			return false;
		}

		return (
			data['activeId'] === null ||
			data['items'].some(({ id }) => id === data['activeId'])
		);
	},
} satisfies ISyncNamespaceSerializer<TCustomerRarePlansSnapshot>;
