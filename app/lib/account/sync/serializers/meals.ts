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

export function checkBeverageName(data: unknown) {
	return typeof data === 'string' && beverageNames.has(data);
}

function getMealSignature(meal: unknown) {
	return stableJson(meal);
}

function hasDeletedBaseMeal<TMeal>(baseMeals: TMeal[], targetMeals: TMeal[]) {
	const targetSignatures = new Set(targetMeals.map(getMealSignature));

	return baseMeals.some(
		(meal) => !targetSignatures.has(getMealSignature(meal))
	);
}

function hasReorderedBaseMeal<TMeal>(baseMeals: TMeal[], targetMeals: TMeal[]) {
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

function hasDuplicateIntent<TMeal>(cloudMeals: TMeal[], localMeals: TMeal[]) {
	const cloudSignatures = cloudMeals.map(getMealSignature);

	return localMeals.some((meal, index) => {
		const signature = getMealSignature(meal);
		const cloudIndex = cloudSignatures.indexOf(signature);

		return cloudIndex !== -1 && cloudIndex !== index;
	});
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
	if (
		hasDeletedBaseMeal(baseMeals, cloudMeals) ||
		hasDeletedBaseMeal(baseMeals, localMeals) ||
		hasReorderedBaseMeal(baseMeals, cloudMeals) ||
		hasReorderedBaseMeal(baseMeals, localMeals) ||
		hasDuplicateIntent(cloudMeals, localMeals)
	) {
		return null;
	}

	const signatures = new Set(cloudMeals.map(getMealSignature));
	const localAdditions = localMeals.filter((meal) => {
		const signature = getMealSignature(meal);
		if (signatures.has(signature)) {
			return false;
		}

		signatures.add(signature);
		return true;
	});

	return [...cloudMeals, ...localAdditions];
}

export function mergeMealSnapshot<TMeal>({
	base,
	cloud,
	local,
	namespace,
}: {
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
		if (checkSnapshotEqual(local, {})) {
			return createMergeResult({ data: cloud, shouldUpload: false });
		}

		const customerNames = new Set([
			...Object.keys(cloud),
			...Object.keys(local),
		]);
		const data: TMealSnapshot<TMeal> = {};

		customerNames.forEach((customerName) => {
			const signatures = new Set(
				(cloud[customerName] ?? []).map(getMealSignature)
			);
			const localAdditions = (local[customerName] ?? []).filter(
				(meal) => {
					const signature = getMealSignature(meal);
					if (signatures.has(signature)) {
						return false;
					}

					signatures.add(signature);
					return true;
				}
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
			conflict: createSerializerConflict({ cloud, local, namespace }),
			data: cloud,
			shouldUpload: false,
		});
	}

	return createMergeResult({
		data,
		shouldUpload: !checkSnapshotEqual(data, cloud),
	});
}
