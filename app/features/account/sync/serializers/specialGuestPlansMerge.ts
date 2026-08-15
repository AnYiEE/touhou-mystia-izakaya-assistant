import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { resolveLegacyMapLabel } from '@/domain/catalog/legacy/resolveLegacyMapLabel';
import {
	LegacyRecordNameResolutionError,
	resolveLegacyRecordName,
} from '@/domain/catalog/legacy/resolveLegacyRecordName';
import type {
	TSpecialGuestId,
	TSpecialGuestName,
} from '@/domain/data/guests/special/types';
import { ALL_MAP_LABELS_SET, MAP_FACTS } from '@/domain/data/places/placeFacts';

import { SPECIAL_GUEST_PLAN_MAX_NAME_LENGTH } from '@/features/specialGuestPlans/constants';
import type {
	ISpecialGuestPlan,
	ISpecialGuestPlansState,
	TSpecialGuestPlanGuestSort,
	TSpecialGuestPlanMealSource,
	TSpecialGuestPlanMode,
} from '@/features/specialGuestPlans/contracts';

import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

import { isAllowedStringArray, isStringArray } from './utils';

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
const LEGACY_SORTED_PLAN_KEYS = [...LEGACY_PLAN_KEYS, 'customerSort'] as const;
const CURRENT_PLAN_KEYS = [
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
] as const;
const specialGuestCatalog = SpecialGuestCatalog.getInstance();
const legacyMapDisplayLabels = new Set<string>(
	Object.values(MAP_FACTS).map(({ label }) => label)
);
const specialGuestNames = new Set<string>(specialGuestCatalog.getNames());
const specialGuests = new Set<number>(
	specialGuestCatalog.getValuesByProp('id')
);
const specialGuestPlanSortValues = new Set<string>([
	'default',
	'pinyin-asc',
	'pinyin-asc-flat',
	'pinyin-desc',
	'pinyin-desc-flat',
]);

interface ILegacySpecialGuestPlanBase extends Record<string, unknown> {
	createdAt: number;
	excludes: string[];
	id: string;
	includes: string[];
	manualCustomers: string[];
	mealSource: TSpecialGuestPlanMealSource;
	mode: TSpecialGuestPlanMode;
	name: string;
	places: string[];
	updatedAt: number;
}

type ILegacySpecialGuestPlanV1 = ILegacySpecialGuestPlanBase;

interface ILegacySpecialGuestPlanV2 extends ILegacySpecialGuestPlanBase {
	customerSort: TSpecialGuestPlanGuestSort;
}

interface ILegacySpecialGuestPlansSnapshot<TPlan> extends Record<
	string,
	unknown
> {
	activeId: string | null;
	items: TPlan[];
}

type TSpecialGuestPlanSchema =
	| ILegacySpecialGuestPlanV1
	| ILegacySpecialGuestPlanV2
	| ISpecialGuestPlan;

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

function validateSpecialGuestPlan(
	data: unknown,
	schemaVersion: number,
	shouldValidateLegacyIdentities: boolean
): data is TSpecialGuestPlanSchema {
	if (
		!checkIsRecord(data) ||
		(schemaVersion !== 1 &&
			schemaVersion !== 2 &&
			schemaVersion !== 3 &&
			schemaVersion !== 4)
	) {
		return false;
	}

	const isLegacy = schemaVersion <= 3;
	const planSort = data[schemaVersion === 4 ? 'guestSort' : 'customerSort'];
	const manualGuests =
		data[schemaVersion === 4 ? 'manualGuests' : 'manualCustomers'];
	const checkSpecialGuests = (value: unknown) =>
		isLegacy
			? shouldValidateLegacyIdentities
				? isAllowedStringArray(value, specialGuestNames)
				: isStringArray(value)
			: Array.isArray(value) &&
				value.every(
					(specialGuest) =>
						typeof specialGuest === 'number' &&
						specialGuests.has(specialGuest)
				);

	return (
		checkExactKeys(
			data,
			schemaVersion === 1
				? LEGACY_PLAN_KEYS
				: isLegacy
					? LEGACY_SORTED_PLAN_KEYS
					: CURRENT_PLAN_KEYS
		) &&
		checkPlanTimestamp(data['createdAt']) &&
		(schemaVersion === 1 ||
			(typeof planSort === 'string' &&
				specialGuestPlanSortValues.has(planSort))) &&
		checkSpecialGuests(data['excludes']) &&
		typeof data['id'] === 'string' &&
		data['id'].length > 0 &&
		data['id'].length <= 128 &&
		checkSpecialGuests(data['includes']) &&
		checkSpecialGuests(manualGuests) &&
		(data['mealSource'] === 'recommended' ||
			data['mealSource'] === 'saved') &&
		(data['mode'] === 'manual' || data['mode'] === 'region') &&
		typeof data['name'] === 'string' &&
		data['name'].trim().length > 0 &&
		data['name'].length <= SPECIAL_GUEST_PLAN_MAX_NAME_LENGTH &&
		(isLegacy
			? shouldValidateLegacyIdentities
				? isAllowedStringArray(data['places'], legacyMapDisplayLabels)
				: isStringArray(data['places'])
			: isAllowedStringArray(data['maps'], ALL_MAP_LABELS_SET)) &&
		checkPlanTimestamp(data['updatedAt'])
	);
}

function checkSpecialGuestPlansData(
	data: unknown,
	schemaVersion: 1,
	shouldValidateLegacyIdentities: boolean,
	shouldValidateActivePlan: boolean
): data is ILegacySpecialGuestPlansSnapshot<ILegacySpecialGuestPlanV1>;
function checkSpecialGuestPlansData(
	data: unknown,
	schemaVersion: 2 | 3,
	shouldValidateLegacyIdentities: boolean,
	shouldValidateActivePlan: boolean
): data is ILegacySpecialGuestPlansSnapshot<ILegacySpecialGuestPlanV2>;
function checkSpecialGuestPlansData(
	data: unknown,
	schemaVersion: number,
	shouldValidateLegacyIdentities: boolean,
	shouldValidateActivePlan: boolean
): data is
	| ILegacySpecialGuestPlansSnapshot<TSpecialGuestPlanSchema>
	| ISpecialGuestPlansState;
function checkSpecialGuestPlansData(
	data: unknown,
	schemaVersion: number,
	shouldValidateLegacyIdentities: boolean,
	shouldValidateActivePlan: boolean
) {
	if (
		!checkIsRecord(data) ||
		!checkExactKeys(data, ['activeId', 'items']) ||
		(data['activeId'] !== null && typeof data['activeId'] !== 'string') ||
		!Array.isArray(data['items'])
	) {
		return false;
	}

	const planIds = new Set<string>();
	for (const plan of data['items']) {
		if (
			!validateSpecialGuestPlan(
				plan,
				schemaVersion,
				shouldValidateLegacyIdentities
			)
		) {
			return false;
		}
		planIds.add(plan.id);
	}

	return (
		!shouldValidateActivePlan ||
		data['activeId'] === null ||
		planIds.has(data['activeId'])
	);
}

export function validateSpecialGuestPlansData(
	data: unknown,
	schemaVersion: 1
): data is ILegacySpecialGuestPlansSnapshot<ILegacySpecialGuestPlanV1>;
export function validateSpecialGuestPlansData(
	data: unknown,
	schemaVersion: 2 | 3
): data is ILegacySpecialGuestPlansSnapshot<ILegacySpecialGuestPlanV2>;
export function validateSpecialGuestPlansData(
	data: unknown,
	schemaVersion: 4
): data is ISpecialGuestPlansState;
export function validateSpecialGuestPlansData(
	data: unknown,
	schemaVersion: number
): data is
	| ILegacySpecialGuestPlansSnapshot<TSpecialGuestPlanSchema>
	| ISpecialGuestPlansState;
export function validateSpecialGuestPlansData(
	data: unknown,
	schemaVersion: number
) {
	return checkSpecialGuestPlansData(data, schemaVersion, true, true);
}

export function checkLegacyPristineDefaultPlan(
	value: unknown,
	schemaVersion: number
) {
	if (
		(schemaVersion !== 1 && schemaVersion !== 2) ||
		!checkIsRecord(value) ||
		!checkExactKeys(
			value,
			schemaVersion === 1 ? LEGACY_PLAN_KEYS : LEGACY_SORTED_PLAN_KEYS
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

function resolveLegacyPlanMaps(values: ReadonlyArray<string>) {
	return values.map((legacyMap) =>
		resolveLegacyMapLabel({
			errorCode: 'ambiguous-legacy-special-guest-plan-map',
			label: legacyMap,
		})
	);
}

function checkIsSpecialGuestName(value: string): value is TSpecialGuestName {
	return specialGuestNames.has(value);
}

function resolveLegacyPlanSpecialGuests(
	values: ReadonlyArray<string>
): TSpecialGuestId[] {
	return values.map((legacySpecialGuest) => {
		if (!checkIsSpecialGuestName(legacySpecialGuest)) {
			throw new LegacyRecordNameResolutionError(
				'legacy-record-name-not-found'
			);
		}

		return resolveLegacyRecordName({
			catalog: specialGuestCatalog,
			category: 'specialGuest',
			name: legacySpecialGuest,
		});
	});
}

export function migrateLegacySpecialGuestPlansSnapshotV1ToV2(
	data: ILegacySpecialGuestPlansSnapshot<ILegacySpecialGuestPlanV1>
): ILegacySpecialGuestPlansSnapshot<ILegacySpecialGuestPlanV2> {
	return {
		...data,
		items: data.items.map((item) => ({ ...item, customerSort: 'default' })),
	};
}

export function migrateLegacySpecialGuestPlansSnapshotV2ToV3(
	data: ILegacySpecialGuestPlansSnapshot<ILegacySpecialGuestPlanV2>
): ILegacySpecialGuestPlansSnapshot<ILegacySpecialGuestPlanV2> {
	const items = data.items.filter(
		(item) => !checkLegacyPristineDefaultPlan(item, 2)
	);
	const itemIds = new Set(items.map((item) => item.id));
	const currentActiveId = data.activeId;
	const activeId =
		currentActiveId !== null && itemIds.has(currentActiveId)
			? currentActiveId
			: (itemIds.values().next().value ?? null);

	return { ...data, activeId, items };
}

export function migrateLegacySpecialGuestPlansSnapshotV3ToV4(
	data: ILegacySpecialGuestPlansSnapshot<ILegacySpecialGuestPlanV2>
): ISpecialGuestPlansState {
	const items = data.items.map((item) => {
		const {
			customerSort: guestSort,
			manualCustomers: manualGuests,
			places,
			...plan
		} = item;

		return {
			...plan,
			excludes: resolveLegacyPlanSpecialGuests(item.excludes),
			guestSort,
			includes: resolveLegacyPlanSpecialGuests(item.includes),
			manualGuests: resolveLegacyPlanSpecialGuests(manualGuests),
			maps: resolveLegacyPlanMaps(places),
		};
	});

	return { activeId: data.activeId, items };
}

export function migrateSpecialGuestPlansSnapshot(
	data: unknown,
	version: number
) {
	let migratedData = data;
	let schemaVersion = version;
	if (schemaVersion === 1) {
		if (!checkSpecialGuestPlansData(migratedData, 1, false, false)) {
			return data;
		}
		migratedData =
			migrateLegacySpecialGuestPlansSnapshotV1ToV2(migratedData);
		schemaVersion = 2;
	}
	if (schemaVersion === 2) {
		if (!checkSpecialGuestPlansData(migratedData, 2, false, false)) {
			return data;
		}
		migratedData =
			migrateLegacySpecialGuestPlansSnapshotV2ToV3(migratedData);
		schemaVersion = 3;
	}
	if (schemaVersion === 3) {
		if (!checkSpecialGuestPlansData(migratedData, 3, false, true)) {
			return data;
		}
		migratedData =
			migrateLegacySpecialGuestPlansSnapshotV3ToV4(migratedData);
		schemaVersion = 4;
	}
	if (schemaVersion !== 4) {
		throw new Error('unsupported-special-guest-plans-schema-version');
	}

	return migratedData;
}

const SPECIAL_GUEST_PLAN_ATOMIC_GROUPS = [
	['name'],
	['guestSort'],
	['mealSource'],
	['mode', 'maps', 'manualGuests', 'includes', 'excludes'],
] as const satisfies ReadonlyArray<ReadonlyArray<keyof ISpecialGuestPlan>>;

function createPlanMap(snapshot: ISpecialGuestPlansState) {
	return new Map(snapshot.items.map((plan) => [plan.id, plan]));
}

function checkPlanContentEqual(
	left: ISpecialGuestPlan | undefined,
	right: ISpecialGuestPlan | undefined
) {
	if (left === undefined || right === undefined) {
		return left === right;
	}

	return SPECIAL_GUEST_PLAN_ATOMIC_GROUPS.every((group) =>
		group.every((key) => checkSnapshotEqual(left[key], right[key]))
	);
}

function mergeExistingPlan({
	base,
	cloud,
	local,
}: {
	base: ISpecialGuestPlan;
	cloud: ISpecialGuestPlan;
	local: ISpecialGuestPlan;
}) {
	const data = { ...base };
	let requiresConfirmation = false;

	for (const group of SPECIAL_GUEST_PLAN_ATOMIC_GROUPS) {
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
	cloud: ISpecialGuestPlansState,
	local: ISpecialGuestPlansState,
	items: ReadonlyArray<ISpecialGuestPlan>
) {
	const itemIds = new Set(items.map(({ id }) => id));

	return cloud.activeId !== null && itemIds.has(cloud.activeId)
		? cloud.activeId
		: local.activeId !== null && itemIds.has(local.activeId)
			? local.activeId
			: (items[0]?.id ?? null);
}

export function mergeSpecialGuestPlansSnapshots({
	base,
	cloud,
	local,
}: {
	base: ISpecialGuestPlansState | null;
	cloud: ISpecialGuestPlansState;
	local: ISpecialGuestPlansState;
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
			? new Map<string, ISpecialGuestPlan>()
			: createPlanMap(base);
	const cloudMap = createPlanMap(cloud);
	const localMap = createPlanMap(local);
	const planIds = new Set([
		...baseMap.keys(),
		...cloudMap.keys(),
		...localMap.keys(),
	]);
	const items: ISpecialGuestPlan[] = [];
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
				items.push(localPlan as ISpecialGuestPlan);
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
		} satisfies ISpecialGuestPlansState,
		hasConflict,
		requiresConfirmation,
	};
}
