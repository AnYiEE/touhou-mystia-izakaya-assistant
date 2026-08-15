import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';
import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { resolveLegacyRecordName } from '@/domain/catalog/legacy/resolveLegacyRecordName';
import type { TBeverageId, TBeverageName } from '@/domain/data/beverages/types';
import type { TFoodId, TFoodName, TRecipeId } from '@/domain/data/foods/types';
import type { TNormalGuestName } from '@/domain/data/guests/normal/types';
import type { TSpecialGuestName } from '@/domain/data/guests/special/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type {
	IMealFood,
	INormalGuestSavedMeal,
	ISpecialGuestSavedMeal,
} from '@/domain/meals/types';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { checkBeverageTag, checkFoodTag } from './tags';
import {
	checkSnapshotEqual,
	createMergeResult,
	createSerializerConflict,
	hasExactKeys,
	stableJson,
} from './utils';

type TMealSyncNamespace =
	| typeof SYNC_NAMESPACE_MAP.normalGuestMeals
	| typeof SYNC_NAMESPACE_MAP.specialGuestMeals;

const beverageCatalog = BeverageCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();
const normalGuestCatalog = NormalGuestCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();
const beverageNames = new Set<string>(beverageCatalog.getNames());
const beverageKeys = new Set(beverageCatalog.data.map(({ id }) => String(id)));
const foodNames = new Set<string>(foodCatalog.getNames());
const ingredientNames = new Set<string>(ingredientCatalog.getNames());
const normalGuestNames = new Set<string>(normalGuestCatalog.getNames());
const normalGuestKeys = new Set(
	normalGuestCatalog.data.map(({ id }) => String(id))
);
const specialGuestNames = new Set<string>(specialGuestCatalog.getNames());
const specialGuestKeys = new Set(
	specialGuestCatalog.data.map(({ id }) => String(id))
);
const recipeFoodNames = new Map<number, TFoodName>();
for (const { name, recipes } of foodCatalog.data) {
	for (const { id } of recipes) {
		recipeFoodNames.set(id, name);
	}
}

export type TMealSnapshot<TMeal> = Record<string, TMeal[]>;

export interface ILegacyMealFoodV1 {
	extraIngredients: TIngredientName[];
	name: TFoodName;
}

export interface ILegacyMealFoodV2 extends ILegacyMealFoodV1 {
	recipeId: TRecipeId;
}

function getGuestKeys(guestType: 'normal' | 'special') {
	return guestType === 'normal' ? normalGuestKeys : specialGuestKeys;
}

function getGuestKeysForNamespace(namespace: TMealSyncNamespace) {
	switch (namespace) {
		case SYNC_NAMESPACE_MAP.normalGuestMeals:
			return normalGuestKeys;
		case SYNC_NAMESPACE_MAP.specialGuestMeals:
			return specialGuestKeys;
	}
}

function getLegacyGuestNames(guestType: 'normal' | 'special') {
	return guestType === 'normal' ? normalGuestNames : specialGuestNames;
}

function checkLegacyFoodName(value: unknown): value is TFoodName {
	return typeof value === 'string' && foodNames.has(value);
}

function checkLegacyIngredientName(value: unknown): value is TIngredientName {
	return typeof value === 'string' && ingredientNames.has(value);
}

function checkLegacyNormalGuestName(value: unknown): value is TNormalGuestName {
	return typeof value === 'string' && normalGuestNames.has(value);
}

function checkLegacyRecipeReference(
	value: unknown,
	foodName: TFoodName
): value is TRecipeId {
	return (
		typeof value === 'number' &&
		Number.isSafeInteger(value) &&
		recipeFoodNames.get(value) === foodName
	);
}

function checkLegacySpecialGuestName(
	value: unknown
): value is TSpecialGuestName {
	return typeof value === 'string' && specialGuestNames.has(value);
}

function sanitizeMealSnapshot<TMeal>(
	data: TMealSnapshot<TMeal>,
	guestKeys: Set<string>
) {
	return Object.entries(data).reduce<TMealSnapshot<TMeal>>(
		(result, [guestKey, meals]) => {
			if (guestKeys.has(guestKey) && Array.isArray(meals)) {
				result[guestKey] = meals;
			}

			return result;
		},
		{}
	);
}

function resolveLegacyIngredientNames(names: ReadonlyArray<TIngredientName>) {
	return names.map((name) =>
		resolveLegacyRecordName({
			catalog: ingredientCatalog,
			category: 'ingredient',
			name,
		})
	);
}

function resolveLegacyGuestName(guestType: 'normal' | 'special', name: string) {
	if (guestType === 'normal') {
		if (!checkLegacyNormalGuestName(name)) {
			return null;
		}

		return resolveLegacyRecordName({
			catalog: normalGuestCatalog,
			category: 'normalGuest',
			name,
		});
	}
	if (!checkLegacySpecialGuestName(name)) {
		return null;
	}

	return resolveLegacyRecordName({
		catalog: specialGuestCatalog,
		category: 'specialGuest',
		name,
	});
}

function getLegacyDefaultRecipe(food: TFoodId) {
	const [recipe] = foodCatalog.getPropsById(food, 'recipes');
	return recipe.id;
}

export function migrateMealFoodV1ToV2(
	data: ILegacyMealFoodV1
): ILegacyMealFoodV2 {
	const food = resolveLegacyRecordName({
		catalog: foodCatalog,
		category: 'food',
		name: data.name,
	});

	return { ...data, recipeId: getLegacyDefaultRecipe(food) };
}

export function migrateMealFoodV2(data: ILegacyMealFoodV2): IMealFood {
	return {
		extraIngredients: resolveLegacyIngredientNames(data.extraIngredients),
		recipeId: data.recipeId,
	};
}

export function validateLegacyMealFoodV1(
	data: unknown
): data is ILegacyMealFoodV1 {
	if (
		!isObjectTagRecord(data) ||
		!hasExactKeys(data, ['extraIngredients', 'name']) ||
		!checkLegacyFoodName(data['name']) ||
		!Array.isArray(data['extraIngredients']) ||
		!data['extraIngredients'].every(checkLegacyIngredientName)
	) {
		return false;
	}

	return true;
}

export function validateLegacyMealFoodV2(
	data: unknown
): data is ILegacyMealFoodV2 {
	if (
		!isObjectTagRecord(data) ||
		!hasExactKeys(data, ['extraIngredients', 'name', 'recipeId']) ||
		!checkLegacyFoodName(data['name']) ||
		!checkLegacyRecipeReference(data['recipeId'], data['name']) ||
		!Array.isArray(data['extraIngredients']) ||
		!data['extraIngredients'].every(checkLegacyIngredientName)
	) {
		return false;
	}

	return true;
}

export function validateMealFood(data: unknown): data is IMealFood {
	return foodCatalog.isMealFood(data);
}

export function checkBeverage(data: unknown): data is TBeverageId {
	return typeof data === 'number' && beverageKeys.has(String(data));
}

export function validateNormalGuestSavedMeal(
	data: unknown
): data is INormalGuestSavedMeal {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, ['beverage', 'food']) &&
		(data['beverage'] === null || checkBeverage(data['beverage'])) &&
		validateMealFood(data['food'])
	);
}

export function validateSpecialGuestSavedMeal(
	data: unknown
): data is ISpecialGuestSavedMeal {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, ['beverage', 'food', 'hasMystiaCooker', 'order']) &&
		checkBeverage(data['beverage']) &&
		typeof data['hasMystiaCooker'] === 'boolean' &&
		isObjectTagRecord(data['order']) &&
		hasExactKeys(data['order'], ['beverageTag', 'foodTag']) &&
		(data['order']['beverageTag'] === null ||
			checkBeverageTag(data['order']['beverageTag'])) &&
		(data['order']['foodTag'] === null ||
			checkFoodTag(data['order']['foodTag'])) &&
		validateMealFood(data['food'])
	);
}

export function normalizeMealFood(data: IMealFood): IMealFood {
	return {
		extraIngredients: [...data.extraIngredients],
		recipeId: data.recipeId,
	};
}

export function validateLegacyMealSnapshot<TMeal>(
	data: unknown,
	{
		guestType,
		validateMeal,
	}: {
		guestType: 'normal' | 'special';
		validateMeal: (data: unknown) => data is TMeal;
	}
): data is TMealSnapshot<TMeal> {
	if (!isObjectTagRecord(data)) {
		return false;
	}
	const guestNames = getLegacyGuestNames(guestType);

	return Object.entries(data).every(
		([guestName, meals]) =>
			guestNames.has(guestName) &&
			Array.isArray(meals) &&
			meals.every(validateMeal)
	);
}

export function migrateLegacyMealSnapshot<TMeal, TNormalizedMeal>(
	data: TMealSnapshot<TMeal>,
	{
		guestType,
		migrateMeal,
	}: {
		guestType: 'normal' | 'special';
		migrateMeal: (meal: TMeal) => TNormalizedMeal;
	}
) {
	return Object.entries(data).reduce<TMealSnapshot<TNormalizedMeal>>(
		(result, [guestName, meals]) => {
			const guest = resolveLegacyGuestName(guestType, guestName);
			if (guest === null) {
				return result;
			}
			const guestKey = String(guest);
			const migratedMeals = meals.map(migrateMeal);
			result[guestKey] = [...(result[guestKey] ?? []), ...migratedMeals];

			return result;
		},
		{}
	);
}

export function validateMealSnapshot<TMeal>(
	data: unknown,
	{
		guestType,
		validateMeal,
	}: {
		guestType: 'normal' | 'special';
		validateMeal: (data: unknown) => data is TMeal;
	}
): data is TMealSnapshot<TMeal> {
	return (
		isObjectTagRecord(data) &&
		Object.entries(data).every(
			([guestKey, meals]) =>
				getGuestKeys(guestType).has(guestKey) &&
				Array.isArray(meals) &&
				meals.every(validateMeal)
		)
	);
}

export function normalizeMealSnapshot<TMeal, TNormalizedMeal>(
	data: TMealSnapshot<TMeal>,
	normalizeMeal: (meal: TMeal) => TNormalizedMeal,
	guestType?: 'normal' | 'special'
) {
	if (!isObjectTagRecord(data)) {
		return {};
	}
	const snapshot =
		guestType === undefined
			? data
			: sanitizeMealSnapshot(data, getGuestKeys(guestType));

	return Object.entries(snapshot).reduce<TMealSnapshot<TNormalizedMeal>>(
		(result, [guestKey, meals]) => {
			if (!Array.isArray(meals)) {
				return result;
			}

			const normalizedMeals = meals.map(normalizeMeal);
			if (normalizedMeals.length > 0) {
				result[guestKey] = normalizedMeals;
			}
			return result;
		},
		{}
	);
}

export function resolveLegacyBeverage(name: TBeverageName): TBeverageId {
	return resolveLegacyRecordName({
		catalog: beverageCatalog,
		category: 'beverage',
		name,
	});
}

export function checkLegacyBeverage(data: unknown): data is TBeverageName {
	return typeof data === 'string' && beverageNames.has(data);
}

function getMealSignature(meal: unknown) {
	return stableJson(meal);
}

function createMealSignatureCountMap(meals: unknown[]) {
	return meals.reduce<Map<string, number>>((result, meal) => {
		const signature = getMealSignature(meal);
		result.set(signature, (result.get(signature) ?? 0) + 1);

		return result;
	}, new Map());
}

function consumeMealSignature(
	signatureCountMap: Map<string, number>,
	signature: string
) {
	const count = signatureCountMap.get(signature) ?? 0;
	if (count <= 0) {
		return false;
	}

	signatureCountMap.set(signature, count - 1);

	return true;
}

function hasDeletedBaseMeal(baseMeals: unknown[], targetMeals: unknown[]) {
	const targetSignatureCountMap = createMealSignatureCountMap(targetMeals);

	return baseMeals.some(
		(meal) =>
			!consumeMealSignature(
				targetSignatureCountMap,
				getMealSignature(meal)
			)
	);
}

function hasReorderedBaseMeal(baseMeals: unknown[], targetMeals: unknown[]) {
	const targetSignatures = targetMeals.map(getMealSignature);
	let searchStart = 0;

	return baseMeals.some((meal) => {
		const index = targetSignatures.indexOf(
			getMealSignature(meal),
			searchStart
		);
		if (index === -1) {
			return true;
		}
		searchStart = index + 1;
		return false;
	});
}

function getMealAdditions<TMeal>(sourceMeals: TMeal[], targetMeals: TMeal[]) {
	const targetSignatureCountMap = createMealSignatureCountMap(targetMeals);

	return sourceMeals.filter(
		(meal) =>
			!consumeMealSignature(
				targetSignatureCountMap,
				getMealSignature(meal)
			)
	);
}

function mergeMealList<TMeal>({
	baseMeals,
	cloudMeals,
	localMeals,
}: {
	baseMeals: TMeal[];
	cloudMeals: TMeal[];
	localMeals: TMeal[];
}) {
	if (stableJson(cloudMeals) === stableJson(localMeals)) {
		return [...cloudMeals];
	}
	if (stableJson(localMeals) === stableJson(baseMeals)) {
		return [...cloudMeals];
	}
	if (stableJson(cloudMeals) === stableJson(baseMeals)) {
		return [...localMeals];
	}
	if (
		hasDeletedBaseMeal(baseMeals, cloudMeals) ||
		hasDeletedBaseMeal(baseMeals, localMeals) ||
		hasReorderedBaseMeal(baseMeals, cloudMeals) ||
		hasReorderedBaseMeal(baseMeals, localMeals)
	) {
		return null;
	}

	const localAdditions = getMealAdditions(localMeals, cloudMeals);

	return [...cloudMeals, ...localAdditions];
}

export function mergeMealSnapshot<TMeal>({
	base,
	cloud,
	local,
	namespace,
}: {
	allowBaseNullAutoMerge?: boolean;
	base: TMealSnapshot<TMeal> | null;
	cloud: TMealSnapshot<TMeal> | null;
	local: TMealSnapshot<TMeal>;
	namespace: TMealSyncNamespace;
}) {
	const allowedGuestKeys = getGuestKeysForNamespace(namespace);
	const baseSnapshot =
		base === null ? null : sanitizeMealSnapshot(base, allowedGuestKeys);
	const cloudSnapshot =
		cloud === null ? null : sanitizeMealSnapshot(cloud, allowedGuestKeys);
	const localSnapshot = sanitizeMealSnapshot(local, allowedGuestKeys);

	if (cloudSnapshot === null) {
		return createMergeResult({
			data: localSnapshot,
			shouldUpload: !checkSnapshotEqual(localSnapshot, {}),
		});
	}
	if (baseSnapshot === null) {
		if (checkSnapshotEqual(localSnapshot, cloudSnapshot)) {
			return createMergeResult({
				data: cloudSnapshot,
				shouldUpload: false,
			});
		}
		if (checkSnapshotEqual(localSnapshot, {})) {
			return createMergeResult({
				data: cloudSnapshot,
				shouldUpload: false,
			});
		}
		if (checkSnapshotEqual(cloudSnapshot, {})) {
			return createMergeResult({
				data: localSnapshot,
				shouldUpload: true,
			});
		}
		const guestKeys = new Set([
			...Object.keys(cloudSnapshot),
			...Object.keys(localSnapshot),
		]);
		const data: TMealSnapshot<TMeal> = {};

		guestKeys.forEach((guestKey) => {
			const localAdditions = getMealAdditions(
				localSnapshot[guestKey] ?? [],
				cloudSnapshot[guestKey] ?? []
			);
			const mergedMeals = [
				...(cloudSnapshot[guestKey] ?? []),
				...localAdditions,
			];

			if (mergedMeals.length > 0) {
				data[guestKey] = mergedMeals;
			}
		});

		return createMergeResult({
			data,
			requiresConfirmation: true,
			shouldUpload: !checkSnapshotEqual(data, cloudSnapshot),
		});
	}

	const guestKeys = new Set([
		...Object.keys(baseSnapshot),
		...Object.keys(cloudSnapshot),
		...Object.keys(localSnapshot),
	]);
	const data: TMealSnapshot<TMeal> = {};

	const hasConflict = guestKeys.values().some((guestKey) => {
		const mergedMeals = mergeMealList({
			baseMeals: baseSnapshot[guestKey] ?? [],
			cloudMeals: cloudSnapshot[guestKey] ?? [],
			localMeals: localSnapshot[guestKey] ?? [],
		});

		if (mergedMeals === null) {
			return true;
		}
		if (mergedMeals.length > 0) {
			data[guestKey] = mergedMeals;
		}

		return false;
	});

	if (hasConflict) {
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
		data,
		shouldUpload: !checkSnapshotEqual(data, cloudSnapshot),
	});
}
