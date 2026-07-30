import { customerNormalMealsSerializer } from '@/features/account/sync/serializers/customerNormalMeals';
import { customerRareMealsSerializer } from '@/features/account/sync/serializers/customerRareMeals';
import { validateCustomerRarePlansData } from '@/features/account/sync/validation';
import { type TCustomerNormalMealsPersistenceSnapshot } from '@/features/catalog/customers/normal/client/state/accountSync';
import { type TCustomerRareMealsPersistenceSnapshot } from '@/features/catalog/customers/rare/client/state/accountSync';
import type { ICustomerRarePlansState } from '@/features/customerPlans/contracts';
import {
	compatibilityCustomerRareData,
	deleteIndexProperty,
} from '@/features/legacyBackup/legacyPayload';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

export const CUSTOMER_DATA_KEY_MAP = {
	normalMeals: 'customer_normal_meals',
	rareMeals: 'customer_rare_meals',
	rarePlans: 'customer_rare_plans',
} as const;

const LEGACY_CUSTOMER_DATA_KEY_MAP = {
	normalMeals: 'customer_normal',
	rareMeals: 'customer_rare',
} as const;

const CUSTOMER_DATA_KEY_SET = new Set<string>(
	Object.values(CUSTOMER_DATA_KEY_MAP)
);
const LEGACY_CUSTOMER_DATA_KEY_SET = new Set<string>(
	Object.values(LEGACY_CUSTOMER_DATA_KEY_MAP)
);

export interface ICustomerDataImport {
	data: Partial<{
		customer_normal_meals: TCustomerNormalMealsPersistenceSnapshot;
		customer_rare_meals: TCustomerRareMealsPersistenceSnapshot;
		customer_rare_plans: ICustomerRarePlansState;
	}>;
	eventLabel: 'Customer Data' | 'Customer Rare Data';
}

function migrateCurrentNormalMeals(data: unknown) {
	return customerNormalMealsSerializer.validate(data)
		? customerNormalMealsSerializer.migrate(data, 2)
		: customerNormalMealsSerializer.migrate(data, 1);
}

function migrateCurrentRareMeals(data: unknown) {
	return customerRareMealsSerializer.validate(data)
		? customerRareMealsSerializer.migrate(data, 2)
		: customerRareMealsSerializer.migrate(data, 1);
}

export function parseCustomerDataImport(json: unknown): ICustomerDataImport {
	if (!isObjectTagRecord(json)) {
		throw new TypeError('not an object');
	}

	const keys = Object.keys(json);
	const hasCurrentCustomerDataKey = keys.some((key) =>
		CUSTOMER_DATA_KEY_SET.has(key)
	);
	const hasLegacyCustomerDataKey = keys.some((key) =>
		LEGACY_CUSTOMER_DATA_KEY_SET.has(key)
	);

	if (hasCurrentCustomerDataKey && hasLegacyCustomerDataKey) {
		throw new TypeError('mixed current and legacy customer data');
	}

	if (hasCurrentCustomerDataKey) {
		if (!keys.every((key) => CUSTOMER_DATA_KEY_SET.has(key))) {
			throw new TypeError('invalid combined meal data');
		}

		const data: ICustomerDataImport['data'] = {};
		if (CUSTOMER_DATA_KEY_MAP.normalMeals in json) {
			data.customer_normal_meals = migrateCurrentNormalMeals(
				json[CUSTOMER_DATA_KEY_MAP.normalMeals]
			);
		}
		if (CUSTOMER_DATA_KEY_MAP.rareMeals in json) {
			data.customer_rare_meals = migrateCurrentRareMeals(
				json[CUSTOMER_DATA_KEY_MAP.rareMeals]
			);
		}
		if (
			CUSTOMER_DATA_KEY_MAP.rarePlans in json &&
			!validateCustomerRarePlansData(
				json[CUSTOMER_DATA_KEY_MAP.rarePlans]
			)
		) {
			throw new TypeError('invalid customer rare plans');
		}
		if (CUSTOMER_DATA_KEY_MAP.rarePlans in json) {
			data.customer_rare_plans = json[
				CUSTOMER_DATA_KEY_MAP.rarePlans
			] as ICustomerRarePlansState;
		}

		return { data, eventLabel: 'Customer Data' };
	}

	if (hasLegacyCustomerDataKey) {
		if (!keys.every((key) => LEGACY_CUSTOMER_DATA_KEY_SET.has(key))) {
			throw new TypeError('invalid legacy combined meal data');
		}

		const data: ICustomerDataImport['data'] = {};
		if (LEGACY_CUSTOMER_DATA_KEY_MAP.normalMeals in json) {
			const normalData = json[
				LEGACY_CUSTOMER_DATA_KEY_MAP.normalMeals
			] as Record<string, object[]>;
			deleteIndexProperty(normalData);
			data.customer_normal_meals = customerNormalMealsSerializer.migrate(
				normalData,
				1
			);
		}
		if (LEGACY_CUSTOMER_DATA_KEY_MAP.rareMeals in json) {
			const rareData = json[
				LEGACY_CUSTOMER_DATA_KEY_MAP.rareMeals
			] as Record<string, object[]>;
			deleteIndexProperty(rareData);
			data.customer_rare_meals = customerRareMealsSerializer.migrate(
				rareData,
				1
			);
		}

		return { data, eventLabel: 'Customer Data' };
	}

	const rareData = json as Record<string, object[]>;
	deleteIndexProperty(rareData);
	compatibilityCustomerRareData(rareData);

	return {
		data: {
			customer_rare_meals: customerRareMealsSerializer.migrate(
				rareData,
				1
			),
		},
		eventLabel: 'Customer Rare Data',
	};
}
