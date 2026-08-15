import {
	migrateUnversionedNormalGuestMealsSnapshot,
	migrateUnversionedSpecialGuestMealsSnapshot,
} from '@/features/account/sync/serializers/savedMealsMigration';
import { specialGuestPlansSerializer } from '@/features/account/sync/serializers/specialGuestPlans';
import { validateSpecialGuestPlansData } from '@/features/account/sync/validation';
import { type TNormalGuestMealsPersistenceSnapshot } from '@/features/catalog/guests/normal/client/state/accountSync';
import { type TSpecialGuestMealsPersistenceSnapshot } from '@/features/catalog/guests/special/client/state/accountSync';
import {
	compatibilitySpecialGuestData,
	deleteIndexProperty,
} from '@/features/legacyBackup/legacyPayload';
import type { ISpecialGuestPlansState } from '@/features/specialGuestPlans/contracts';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

export const GUEST_DATA_KEY_MAP = {
	normalMeals: 'customer_normal_meals',
	rareMeals: 'customer_rare_meals',
	rarePlans: 'customer_rare_plans',
} as const;

const LEGACY_GUEST_DATA_KEY_MAP = {
	normalMeals: 'customer_normal',
	rareMeals: 'customer_rare',
} as const;

const GUEST_DATA_KEY_SET = new Set<string>(Object.values(GUEST_DATA_KEY_MAP));
const LEGACY_GUEST_DATA_KEY_SET = new Set<string>(
	Object.values(LEGACY_GUEST_DATA_KEY_MAP)
);

export interface IGuestDataImport {
	data: Partial<{
		customer_normal_meals: TNormalGuestMealsPersistenceSnapshot;
		customer_rare_meals: TSpecialGuestMealsPersistenceSnapshot;
		customer_rare_plans: ISpecialGuestPlansState;
	}>;
	eventName: 'Guest Data' | 'Special Guest Data';
}

function migrateCurrentRarePlans(data: unknown) {
	for (const version of [4, 3, 2, 1] as const) {
		if (validateSpecialGuestPlansData(data, version)) {
			return specialGuestPlansSerializer.migrate(data, version);
		}
	}

	throw new TypeError('invalid special guest plans');
}

export function parseGuestDataImport(json: unknown): IGuestDataImport {
	if (!isObjectTagRecord(json)) {
		throw new TypeError('not an object');
	}

	const keys = Object.keys(json);
	const hasCurrentGuestDataKey = keys.some((key) =>
		GUEST_DATA_KEY_SET.has(key)
	);
	const hasLegacyGuestDataKey = keys.some((key) =>
		LEGACY_GUEST_DATA_KEY_SET.has(key)
	);

	if (hasCurrentGuestDataKey && hasLegacyGuestDataKey) {
		throw new TypeError('mixed current and legacy guest data');
	}

	if (hasCurrentGuestDataKey) {
		if (!keys.every((key) => GUEST_DATA_KEY_SET.has(key))) {
			throw new TypeError('invalid combined guest data');
		}

		const data: IGuestDataImport['data'] = {};
		if (GUEST_DATA_KEY_MAP.normalMeals in json) {
			data.customer_normal_meals =
				migrateUnversionedNormalGuestMealsSnapshot(
					json[GUEST_DATA_KEY_MAP.normalMeals]
				);
		}
		if (GUEST_DATA_KEY_MAP.rareMeals in json) {
			data.customer_rare_meals =
				migrateUnversionedSpecialGuestMealsSnapshot(
					json[GUEST_DATA_KEY_MAP.rareMeals]
				);
		}
		if (GUEST_DATA_KEY_MAP.rarePlans in json) {
			data.customer_rare_plans = migrateCurrentRarePlans(
				json[GUEST_DATA_KEY_MAP.rarePlans]
			);
		}

		return { data, eventName: 'Guest Data' };
	}

	if (hasLegacyGuestDataKey) {
		if (!keys.every((key) => LEGACY_GUEST_DATA_KEY_SET.has(key))) {
			throw new TypeError('invalid legacy combined guest data');
		}

		const data: IGuestDataImport['data'] = {};
		if (LEGACY_GUEST_DATA_KEY_MAP.normalMeals in json) {
			const normalData = json[
				LEGACY_GUEST_DATA_KEY_MAP.normalMeals
			] as Record<string, object[]>;
			deleteIndexProperty(normalData);
			data.customer_normal_meals =
				migrateUnversionedNormalGuestMealsSnapshot(normalData);
		}
		if (LEGACY_GUEST_DATA_KEY_MAP.rareMeals in json) {
			const rareData = json[
				LEGACY_GUEST_DATA_KEY_MAP.rareMeals
			] as Record<string, object[]>;
			deleteIndexProperty(rareData);
			data.customer_rare_meals =
				migrateUnversionedSpecialGuestMealsSnapshot(rareData);
		}

		return { data, eventName: 'Guest Data' };
	}

	const rareData = json as Record<string, object[]>;
	deleteIndexProperty(rareData);
	compatibilitySpecialGuestData(rareData);

	return {
		data: {
			customer_rare_meals:
				migrateUnversionedSpecialGuestMealsSnapshot(rareData),
		},
		eventName: 'Special Guest Data',
	};
}
