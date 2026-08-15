import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { ALL_MAP_LABELS_SET } from '@/domain/data/places/placeFacts';
import type { TMapLabel } from '@/domain/data/places/types';

import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	readSpecialGuestPlansPersistenceSnapshot,
	replaceSpecialGuestPlansPersistenceSnapshot,
} from '@/features/specialGuestPlans/client/state/accountSync';
import { SPECIAL_GUEST_PLAN_MAX_NAME_LENGTH } from '@/features/specialGuestPlans/constants';
import type {
	ISpecialGuestPlan,
	ISpecialGuestPlansState,
	TSpecialGuestPlanGuestSort,
	TSpecialGuestPlanMealSource,
	TSpecialGuestPlanMode,
} from '@/features/specialGuestPlans/contracts';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import {
	mergeSpecialGuestPlansSnapshots,
	migrateSpecialGuestPlansSnapshot,
} from './specialGuestPlansMerge';
import {
	checkSnapshotEqual,
	createMergeResult,
	createSerializerConflict,
	hasExactKeys,
} from './utils';

const defaultSnapshot: ISpecialGuestPlansState = { activeId: null, items: [] };
const specialGuests = new Set<number>(
	SpecialGuestCatalog.getInstance().getValuesByProp('id')
);
const planGuestSorts = new Set<TSpecialGuestPlanGuestSort>([
	'default',
	'pinyin-asc',
	'pinyin-asc-flat',
	'pinyin-desc',
	'pinyin-desc-flat',
]);
const planModes = new Set<TSpecialGuestPlanMode>(['manual', 'region']);
const planMealSources = new Set<TSpecialGuestPlanMealSource>([
	'recommended',
	'saved',
]);

function checkSpecialGuest(value: unknown): value is TSpecialGuestId {
	return typeof value === 'number' && specialGuests.has(value);
}

function checkMap(value: unknown): value is TMapLabel {
	return typeof value === 'string' && ALL_MAP_LABELS_SET.has(value);
}

function checkPlanMode(value: unknown): value is TSpecialGuestPlanMode {
	return (
		typeof value === 'string' &&
		planModes.has(value as TSpecialGuestPlanMode)
	);
}

function checkPlanGuestSort(
	value: unknown
): value is TSpecialGuestPlanGuestSort {
	return (
		typeof value === 'string' &&
		planGuestSorts.has(value as TSpecialGuestPlanGuestSort)
	);
}

function checkPlanMealSource(
	value: unknown
): value is TSpecialGuestPlanMealSource {
	return (
		typeof value === 'string' &&
		planMealSources.has(value as TSpecialGuestPlanMealSource)
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

function checkNumberArrayOf<T extends number>(
	value: unknown,
	checkItem: (item: unknown) => item is T
): value is T[] {
	return Array.isArray(value) && value.every(checkItem);
}

function dedupeValues<T extends number | string>(values: ReadonlyArray<T>) {
	return [...new Set(values)];
}

function validateSpecialGuestPlan(data: unknown): data is ISpecialGuestPlan {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, [
			'createdAt',
			'excludes',
			'guestSort',
			'id',
			'includes',
			'manualGuests',
			'maps',
			'mealSource',
			'mode',
			'name',
			'updatedAt',
		]) &&
		checkPlanTimestamp(data['createdAt']) &&
		checkNumberArrayOf(data['excludes'], checkSpecialGuest) &&
		checkPlanGuestSort(data['guestSort']) &&
		typeof data['id'] === 'string' &&
		data['id'].length > 0 &&
		data['id'].length <= 128 &&
		checkNumberArrayOf(data['includes'], checkSpecialGuest) &&
		checkNumberArrayOf(data['manualGuests'], checkSpecialGuest) &&
		checkStringArrayOf(data['maps'], checkMap) &&
		checkPlanMealSource(data['mealSource']) &&
		checkPlanMode(data['mode']) &&
		typeof data['name'] === 'string' &&
		data['name'].trim().length > 0 &&
		data['name'].length <= SPECIAL_GUEST_PLAN_MAX_NAME_LENGTH &&
		checkPlanTimestamp(data['updatedAt'])
	);
}

function normalizeSpecialGuestPlan(plan: ISpecialGuestPlan) {
	return {
		createdAt: plan.createdAt,
		excludes: dedupeValues(plan.excludes),
		guestSort: plan.guestSort,
		id: plan.id,
		includes: dedupeValues(plan.includes),
		manualGuests: dedupeValues(plan.manualGuests),
		maps: dedupeValues(plan.maps),
		mealSource: plan.mealSource,
		mode: plan.mode,
		name: plan.name.trim().slice(0, SPECIAL_GUEST_PLAN_MAX_NAME_LENGTH),
		updatedAt: plan.updatedAt,
	} satisfies ISpecialGuestPlan;
}

function normalizeSpecialGuestPlansSnapshot(data: ISpecialGuestPlansState) {
	const seenIds = new Set<string>();
	const items = data.items.reduce<ISpecialGuestPlan[]>((result, plan) => {
		if (seenIds.has(plan.id)) {
			return result;
		}
		seenIds.add(plan.id);
		result.push(normalizeSpecialGuestPlan(plan));

		return result;
	}, []);
	const activeId =
		data.activeId !== null && seenIds.has(data.activeId)
			? data.activeId
			: (items[0]?.id ?? null);

	return { activeId, items } satisfies ISpecialGuestPlansState;
}

function sanitizeSpecialGuestPlansSnapshot(data: unknown) {
	if (
		!isObjectTagRecord(data) ||
		(data['activeId'] !== null && typeof data['activeId'] !== 'string') ||
		!Array.isArray(data['items'])
	) {
		return defaultSnapshot;
	}

	const items = data['items'].filter(validateSpecialGuestPlan);

	return normalizeSpecialGuestPlansSnapshot({
		activeId: data['activeId'],
		items,
	});
}

export const specialGuestPlansSerializer = {
	deserialize(data) {
		return this.migrate(
			data,
			SYNC_SCHEMA_VERSION_MAP[SYNC_NAMESPACE_MAP.specialGuestPlans]
		);
	},
	getDefaultSnapshot() {
		return defaultSnapshot;
	},
	getLocalSnapshot() {
		return sanitizeSpecialGuestPlansSnapshot(
			structuredClone(readSpecialGuestPlansPersistenceSnapshot())
		);
	},
	merge({ base, cloud, local, namespace }) {
		const localSnapshot = normalizeSpecialGuestPlansSnapshot(local);

		if (cloud === null) {
			return createMergeResult({
				data: localSnapshot,
				shouldUpload: !checkSnapshotEqual(
					localSnapshot,
					defaultSnapshot
				),
			});
		}

		const cloudSnapshot = normalizeSpecialGuestPlansSnapshot(cloud);
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
			base === null ? null : normalizeSpecialGuestPlansSnapshot(base);
		const merged = mergeSpecialGuestPlansSnapshots({
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
		const migratedData = migrateSpecialGuestPlansSnapshot(data, version);

		if (!this.validate(migratedData)) {
			throw new Error('invalid-special-guest-plans');
		}

		return normalizeSpecialGuestPlansSnapshot(migratedData);
	},
	serialize(data) {
		return normalizeSpecialGuestPlansSnapshot(data);
	},
	setLocalSnapshot(data) {
		replaceSpecialGuestPlansPersistenceSnapshot(
			normalizeSpecialGuestPlansSnapshot(data)
		);
	},
	validate(data): data is ISpecialGuestPlansState {
		if (
			!isObjectTagRecord(data) ||
			!hasExactKeys(data, ['activeId', 'items']) ||
			(data['activeId'] !== null &&
				typeof data['activeId'] !== 'string') ||
			!Array.isArray(data['items']) ||
			!data['items'].every(validateSpecialGuestPlan)
		) {
			return false;
		}

		return (
			data['activeId'] === null ||
			data['items'].some(({ id }) => id === data['activeId'])
		);
	},
} satisfies ISyncNamespaceSerializer<ISpecialGuestPlansState>;
