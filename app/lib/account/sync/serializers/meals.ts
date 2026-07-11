import {
	checkSnapshotEqual,
	createMergeResult,
	createSerializerConflict,
	isPlainObject,
	stableJson,
} from './utils';
import { SYNC_NAMESPACE_MAP } from '@/lib/account/sync';
import { type IMealRecipe } from '@/types';
import {
	Beverage,
	CustomerNormal,
	CustomerRare,
	Ingredient,
	Recipe,
} from '@/utils';

type TMealSyncNamespace =
	| typeof SYNC_NAMESPACE_MAP.customerNormalMeals
	| typeof SYNC_NAMESPACE_MAP.customerRareMeals;

const beverageNames = new Set<string>(Beverage.getInstance().getNames());
const customerNormalNames = new Set<string>(
	CustomerNormal.getInstance().getNames()
);
const customerRareNames = new Set<string>(
	CustomerRare.getInstance().getNames()
);
const ingredientNames = new Set<string>(Ingredient.getInstance().getNames());
const recipeNames = new Set<string>(Recipe.getInstance().getNames());

export type TMealSnapshot<TMeal> = Partial<Record<string, TMeal[]>>;

function getCustomerNamesForType(customerType: 'normal' | 'rare') {
	return customerType === 'normal' ? customerNormalNames : customerRareNames;
}

function getCustomerNamesForNamespace(namespace: TMealSyncNamespace) {
	switch (namespace) {
		case SYNC_NAMESPACE_MAP.customerNormalMeals:
			return customerNormalNames;
		case SYNC_NAMESPACE_MAP.customerRareMeals:
			return customerRareNames;
	}
}

function sanitizeMealSnapshot<TMeal>(
	data: TMealSnapshot<TMeal>,
	customerNames: Set<string>
) {
	return Object.entries(data).reduce<TMealSnapshot<TMeal>>(
		(result, [customerName, meals]) => {
			if (customerNames.has(customerName) && Array.isArray(meals)) {
				result[customerName] = meals;
			}

			return result;
		},
		{}
	);
}

export function validateMealRecipe(data: unknown): data is IMealRecipe {
	return (
		isPlainObject(data) &&
		typeof data['name'] === 'string' &&
		recipeNames.has(data['name']) &&
		Array.isArray(data['extraIngredients']) &&
		data['extraIngredients'].every(
			(ingredient) =>
				typeof ingredient === 'string' &&
				ingredientNames.has(ingredient)
		)
	);
}

export function normalizeMealRecipe(data: IMealRecipe): IMealRecipe {
	return { extraIngredients: [...data.extraIngredients], name: data.name };
}

export function validateMealSnapshot<TMeal>(
	data: unknown,
	{
		customerType,
		validateMeal,
	}: {
		customerType: 'normal' | 'rare';
		validateMeal: (data: unknown) => data is TMeal;
	}
): data is TMealSnapshot<TMeal> {
	if (!isPlainObject(data)) {
		return false;
	}

	const customerNames = getCustomerNamesForType(customerType);

	return Object.entries(data).every(
		([customerName, meals]) =>
			customerNames.has(customerName) &&
			Array.isArray(meals) &&
			meals.every(validateMeal)
	);
}

export function normalizeMealSnapshot<TMeal, TNormalizedMeal>(
	data: TMealSnapshot<TMeal>,
	normalizeMeal: (meal: TMeal) => TNormalizedMeal,
	customerType?: 'normal' | 'rare'
) {
	if (!isPlainObject(data)) {
		return {};
	}
	const snapshot =
		customerType === undefined
			? data
			: sanitizeMealSnapshot(data, getCustomerNamesForType(customerType));

	return Object.entries(snapshot).reduce<TMealSnapshot<TNormalizedMeal>>(
		(result, [customerName, meals]) => {
			if (!Array.isArray(meals)) {
				return result;
			}

			const normalizedMeals = meals.map(normalizeMeal);
			if (normalizedMeals.length > 0) {
				result[customerName] = normalizedMeals;
			}
			return result;
		},
		{}
	);
}

export function checkBeverageName(data: unknown) {
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
	const allowedCustomerNames = getCustomerNamesForNamespace(namespace);
	const baseSnapshot =
		base === null ? null : sanitizeMealSnapshot(base, allowedCustomerNames);
	const cloudSnapshot =
		cloud === null
			? null
			: sanitizeMealSnapshot(cloud, allowedCustomerNames);
	const localSnapshot = sanitizeMealSnapshot(local, allowedCustomerNames);

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
		const customerNames = new Set([
			...Object.keys(cloudSnapshot),
			...Object.keys(localSnapshot),
		]);
		const data: TMealSnapshot<TMeal> = {};

		customerNames.forEach((customerName) => {
			const localAdditions = getMealAdditions(
				localSnapshot[customerName] ?? [],
				cloudSnapshot[customerName] ?? []
			);
			const mergedMeals = [
				...(cloudSnapshot[customerName] ?? []),
				...localAdditions,
			];

			if (mergedMeals.length > 0) {
				data[customerName] = mergedMeals;
			}
		});

		return createMergeResult({
			data,
			requiresConfirmation: true,
			shouldUpload: !checkSnapshotEqual(data, cloudSnapshot),
		});
	}

	const customerNames = new Set([
		...Object.keys(baseSnapshot),
		...Object.keys(cloudSnapshot),
		...Object.keys(localSnapshot),
	]);
	const data: TMealSnapshot<TMeal> = {};

	const hasConflict = [...customerNames].some((customerName) => {
		const mergedMeals = mergeMealList({
			baseMeals: baseSnapshot[customerName] ?? [],
			cloudMeals: cloudSnapshot[customerName] ?? [],
			localMeals: localSnapshot[customerName] ?? [],
		});

		if (mergedMeals === null) {
			return true;
		}
		if (mergedMeals.length > 0) {
			data[customerName] = mergedMeals;
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
