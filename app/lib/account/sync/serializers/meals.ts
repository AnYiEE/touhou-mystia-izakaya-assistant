import { type TSyncNamespace } from '@/lib/account/sync';
import { type IMealRecipe } from '@/types';
import {
	Beverage,
	CustomerNormal,
	CustomerRare,
	Ingredient,
	Recipe,
} from '@/utils';
import {
	checkSnapshotEqual,
	createMergeResult,
	createSerializerConflict,
	isPlainObject,
	stableJson,
} from './utils';

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

	const customerNames =
		customerType === 'normal' ? customerNormalNames : customerRareNames;

	return Object.entries(data).every(
		([customerName, meals]) =>
			customerNames.has(customerName) &&
			Array.isArray(meals) &&
			meals.every(validateMeal)
	);
}

export function normalizeMealSnapshot<TMeal, TNormalizedMeal>(
	data: TMealSnapshot<TMeal>,
	normalizeMeal: (meal: TMeal) => TNormalizedMeal
) {
	if (!isPlainObject(data)) {
		return {};
	}

	return Object.entries(data).reduce<TMealSnapshot<TNormalizedMeal>>(
		(result, [customerName, meals]) => {
			if (!Array.isArray(meals)) {
				return result;
			}

			result[customerName] = meals.map(normalizeMeal);
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
	allowBaseNullAutoMerge = false,
	base,
	cloud,
	local,
	namespace,
}: {
	allowBaseNullAutoMerge?: boolean;
	base: TMealSnapshot<TMeal> | null;
	cloud: TMealSnapshot<TMeal> | null;
	local: TMealSnapshot<TMeal>;
	namespace: TSyncNamespace;
}) {
	if (cloud === null) {
		return createMergeResult({
			data: local,
			shouldUpload: !checkSnapshotEqual(local, {}),
		});
	}
	if (base === null) {
		if (checkSnapshotEqual(local, cloud)) {
			return createMergeResult({ data: cloud, shouldUpload: false });
		}
		if (checkSnapshotEqual(local, {})) {
			return createMergeResult({ data: cloud, shouldUpload: false });
		}
		if (!allowBaseNullAutoMerge) {
			return createMergeResult({
				conflict: createSerializerConflict({
					cloud,
					local,
					namespace,
					userId: '',
				}),
				data: cloud,
				shouldUpload: false,
			});
		}

		const customerNames = new Set([
			...Object.keys(cloud),
			...Object.keys(local),
		]);
		const data: TMealSnapshot<TMeal> = {};

		customerNames.forEach((customerName) => {
			const localAdditions = getMealAdditions(
				local[customerName] ?? [],
				cloud[customerName] ?? []
			);
			const mergedMeals = [
				...(cloud[customerName] ?? []),
				...localAdditions,
			];

			if (mergedMeals.length > 0) {
				data[customerName] = mergedMeals;
			}
		});

		return createMergeResult({
			data,
			shouldUpload: !checkSnapshotEqual(data, cloud),
		});
	}

	const customerNames = new Set([
		...Object.keys(base),
		...Object.keys(cloud),
		...Object.keys(local),
	]);
	const data: TMealSnapshot<TMeal> = {};

	const hasConflict = [...customerNames].some((customerName) => {
		const mergedMeals = mergeMealList({
			baseMeals: base[customerName] ?? [],
			cloudMeals: cloud[customerName] ?? [],
			localMeals: local[customerName] ?? [],
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
				cloud,
				local,
				namespace,
				userId: '',
			}),
			data: cloud,
			shouldUpload: false,
		});
	}

	return createMergeResult({
		data,
		shouldUpload: !checkSnapshotEqual(data, cloud),
	});
}
