import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { ALL_MAP_LABELS_SET } from '@/domain/data/places/placeFacts';
import type { TMapLabel } from '@/domain/data/places/types';

import { migrateSpecialGuestPlansSnapshot } from '@/features/account/sync/serializers/specialGuestPlansMerge';
import { hasExactKeys } from '@/features/account/sync/serializers/utils';
import { SPECIAL_GUEST_PLAN_MAX_NAME_LENGTH } from '@/features/specialGuestPlans/constants';
import type {
	ISpecialGuestPlan,
	ISpecialGuestPlansState,
	TSpecialGuestPlanGuestSort,
	TSpecialGuestPlanMealSource,
	TSpecialGuestPlanMode,
} from '@/features/specialGuestPlans/contracts';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';
import type { IPersistedShape } from '@/shared/utilities/state/persistedShape';

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

function checkNumberArrayOf<T extends number>(
	value: unknown,
	checkItem: (item: unknown) => item is T
): value is T[] {
	return Array.isArray(value) && value.every(checkItem);
}

function checkStringArrayOf<T extends string>(
	value: unknown,
	checkItem: (item: unknown) => item is T
): value is T[] {
	return Array.isArray(value) && value.every(checkItem);
}

function checkPlanTimestamp(value: unknown): value is number {
	return (
		typeof value === 'number' &&
		Number.isSafeInteger(value) &&
		value >= 0 &&
		value < Number.MAX_SAFE_INTEGER
	);
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

function dedupeValues<T extends number | string>(values: ReadonlyArray<T>) {
	return [...new Set(values)];
}

function normalizeSpecialGuestPlanValue(
	data: unknown
): ISpecialGuestPlan | null {
	if (!isObjectTagRecord(data)) {
		return null;
	}
	const createdAt = checkPlanTimestamp(data['createdAt'])
		? data['createdAt']
		: null;
	const updatedAt = checkPlanTimestamp(data['updatedAt'])
		? data['updatedAt']
		: null;
	const id =
		typeof data['id'] === 'string' &&
		data['id'].length > 0 &&
		data['id'].length <= 128
			? data['id']
			: null;
	const name =
		typeof data['name'] === 'string' && data['name'].trim().length > 0
			? data['name'].slice(0, SPECIAL_GUEST_PLAN_MAX_NAME_LENGTH)
			: null;
	if (
		createdAt === null ||
		updatedAt === null ||
		id === null ||
		name === null
	) {
		return null;
	}
	const guardArrayIds = (value: unknown) => {
		if (!Array.isArray(value) || !value.every(checkSpecialGuest)) {
			return null;
		}
		const normalized: TSpecialGuestId[] = [];
		for (const item of value) {
			if (checkSpecialGuest(item)) {
				normalized.push(item);
			}
		}
		return normalized;
	};
	const guardArrayMaps = (value: unknown) => {
		if (!Array.isArray(value) || !value.every(checkMap)) {
			return null;
		}
		const normalized: TMapLabel[] = [];
		for (const item of value) {
			if (checkMap(item)) {
				normalized.push(item);
			}
		}
		return normalized;
	};
	const excludes = guardArrayIds(data['excludes']);
	const includes = guardArrayIds(data['includes']);
	const manualGuests = guardArrayIds(data['manualGuests']);
	const maps = guardArrayMaps(data['maps']);
	if (
		excludes === null ||
		includes === null ||
		manualGuests === null ||
		maps === null
	) {
		return null;
	}

	return {
		...data,
		createdAt,
		excludes,
		guestSort: checkPlanGuestSort(data['guestSort'])
			? data['guestSort']
			: 'default',
		id,
		includes,
		manualGuests,
		maps,
		mealSource: checkPlanMealSource(data['mealSource'])
			? data['mealSource']
			: 'saved',
		mode: checkPlanMode(data['mode']) ? data['mode'] : 'region',
		name,
		updatedAt,
	} satisfies ISpecialGuestPlan;
}

function normalizeSpecialGuestPlan(plan: ISpecialGuestPlan) {
	return {
		...plan,
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

export const specialGuestPlansShape = {
	createDefault() {
		return structuredClone(defaultSnapshot);
	},
	migrate(value: unknown, version: number): ISpecialGuestPlansState {
		try {
			return specialGuestPlansShape.normalize(
				migrateSpecialGuestPlansSnapshot(value, version)
			);
		} catch {
			return specialGuestPlansShape.normalize(value);
		}
	},
	normalize(value: unknown): ISpecialGuestPlansState {
		if (!isObjectTagRecord(value) || !Array.isArray(value['items'])) {
			return structuredClone(defaultSnapshot);
		}

		const seenIds = new Set<string>();
		const items: ISpecialGuestPlan[] = [];
		for (const rawPlan of value['items']) {
			const normalizedPlan = normalizeSpecialGuestPlanValue(rawPlan);
			if (
				normalizedPlan === null ||
				seenIds.has(normalizedPlan.id) ||
				!validateSpecialGuestPlan(normalizedPlan)
			) {
				continue;
			}
			seenIds.add(normalizedPlan.id);
			items.push(normalizeSpecialGuestPlan(normalizedPlan));
		}
		const activeId =
			typeof value['activeId'] === 'string' &&
			seenIds.has(value['activeId'])
				? value['activeId']
				: (items[0]?.id ?? null);
		return { activeId, items } satisfies ISpecialGuestPlansState;
	},
	validate(value: unknown): value is ISpecialGuestPlansState {
		if (!isObjectTagRecord(value)) {
			return false;
		}
		const items = Array.isArray(value['items'])
			? (value['items'] as ISpecialGuestPlan[])
			: [];
		if (
			!hasExactKeys(value, ['activeId', 'items']) ||
			(value['activeId'] !== null &&
				typeof value['activeId'] !== 'string') ||
			!Array.isArray(value['items']) ||
			!items.every(validateSpecialGuestPlan)
		) {
			return false;
		}
		const planIds = new Set<string>();
		if (
			!items.every(({ id }) => {
				if (planIds.has(id)) {
					return false;
				}
				planIds.add(id);
				return true;
			})
		) {
			return false;
		}
		return (
			value['activeId'] === null ||
			items.some(({ id }) => id === value['activeId'])
		);
	},
} satisfies IPersistedShape<ISpecialGuestPlansState>;
