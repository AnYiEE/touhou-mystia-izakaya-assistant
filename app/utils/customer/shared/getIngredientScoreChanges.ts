import {
	DARK_MATTER_META_MAP,
	DYNAMIC_TAG_MAP,
	type TIngredientName,
	type TIngredientTag,
	type TRecipeTag,
} from '@/data';
import { type IPopularTrend } from '@/types';
import { intersection, toSet, union } from '@/utilities';
import type { TRecipe } from '@/utils/types';

import type {
	IIngredientScoreCandidate,
	IIngredientScoreChangesResult,
	TIngredientScoreRestriction,
} from './types';

function getIngredientRestriction(
	scoreChange: number,
	isDarkIngredient: boolean,
	isDarkMatter: boolean
): TIngredientScoreRestriction {
	if (isDarkMatter) {
		return 'darkMatterOverride';
	}

	if (isDarkIngredient) {
		return 'darkIngredient';
	}

	if (scoreChange === Infinity) {
		return 'lowestRestricted';
	}

	if (scoreChange === -Infinity) {
		return 'highestRestricted';
	}

	return 'none';
}

function getLargePartitionScoreChange({
	before,
	currentPopularTrend,
	customerNegativeTags,
	customerPositiveTags,
	isLargePartitionTagNext,
	shouldCalculateLargePartitionTag,
}: {
	before: ReadonlyArray<TRecipeTag>;
	currentPopularTrend: IPopularTrend;
	customerNegativeTags: ReadonlyArray<TRecipeTag>;
	customerPositiveTags: ReadonlyArray<TRecipeTag>;
	isLargePartitionTagNext: boolean;
	shouldCalculateLargePartitionTag: boolean;
}) {
	let scoreChange = 0;

	if (
		isLargePartitionTagNext &&
		!before.includes(DYNAMIC_TAG_MAP.largePartition)
	) {
		scoreChange -= Number(
			customerNegativeTags.includes(DYNAMIC_TAG_MAP.largePartition)
		);
		scoreChange += Number(
			customerPositiveTags.includes(DYNAMIC_TAG_MAP.largePartition)
		);
	}

	if (!shouldCalculateLargePartitionTag) {
		return scoreChange;
	}

	scoreChange -= Number(
		customerNegativeTags.includes(DYNAMIC_TAG_MAP.popularNegative) &&
			currentPopularTrend.isNegative
	);
	scoreChange -= Number(
		customerNegativeTags.includes(DYNAMIC_TAG_MAP.popularPositive) &&
			!currentPopularTrend.isNegative
	);
	scoreChange += Number(
		customerPositiveTags.includes(DYNAMIC_TAG_MAP.popularNegative) &&
			currentPopularTrend.isNegative
	);
	scoreChange += Number(
		customerPositiveTags.includes(DYNAMIC_TAG_MAP.popularPositive) &&
			!currentPopularTrend.isNegative
	);

	return scoreChange;
}

export function getIngredientScoreChanges({
	calculateIngredientTagsWithTrend,
	calculateRecipeTagsWithTrend,
	candidates,
	composeRecipeTagsWithPopularTrend,
	currentCustomerOrderRecipeTag = null,
	currentPopularTrend,
	currentRecipeExtraIngredients,
	currentRecipeIngredients,
	currentRecipeName,
	currentRecipeNegativeTags,
	customerNegativeTags = [],
	customerPositiveTags,
	getIngredientEasterEggScore,
	getIngredientScoreChange,
	getIngredientTags,
	isDarkMatter = false,
}: {
	candidates: ReadonlyArray<IIngredientScoreCandidate>;
	calculateIngredientTagsWithTrend: (
		tags: ReadonlyArray<TIngredientTag>
	) => TRecipeTag[];
	calculateRecipeTagsWithTrend: (
		tags: ReadonlyArray<TRecipeTag>
	) => TRecipeTag[];
	composeRecipeTagsWithPopularTrend: (
		tags: ReadonlyArray<TIngredientTag | TRecipeTag>
	) => TRecipeTag[];
	currentCustomerOrderRecipeTag?: TRecipeTag | null;
	currentPopularTrend: IPopularTrend;
	currentRecipeExtraIngredients: ReadonlyArray<TIngredientName>;
	currentRecipeIngredients: ReadonlyArray<TIngredientName>;
	currentRecipeName: TRecipe['name'];
	currentRecipeNegativeTags: ReadonlyArray<TRecipeTag>;
	customerNegativeTags?: ReadonlyArray<TRecipeTag>;
	customerPositiveTags: ReadonlyArray<TRecipeTag>;
	getIngredientEasterEggScore?: (args: {
		currentIngredients: ReadonlyArray<TIngredientName>;
		currentRecipeName: TRecipe['name'];
		ingredientName: TIngredientName;
	}) => number | null | undefined;
	getIngredientScoreChange: (
		oldRecipePositiveTags: ReadonlyArray<TRecipeTag>,
		newRecipePositiveTags: ReadonlyArray<TRecipeTag>,
		customerPositiveTags: ReadonlyArray<TRecipeTag>,
		customerNegativeTags?: ReadonlyArray<TRecipeTag>
	) => number;
	getIngredientTags: (
		ingredientName: TIngredientName
	) => ReadonlyArray<TIngredientTag>;
	isDarkMatter?: boolean;
}): IIngredientScoreChangesResult {
	const currentRecipeAllIngredients = union(
		currentRecipeIngredients,
		currentRecipeExtraIngredients
	);
	const currentRecipeExtraIngredientsTags =
		currentRecipeExtraIngredients.flatMap((extraIngredient) =>
			getIngredientTags(extraIngredient)
		);
	const currentRecipeExtraIngredientsTagsWithTrend =
		calculateIngredientTagsWithTrend(currentRecipeExtraIngredientsTags);
	const currentRecipeComposedTags = composeRecipeTagsWithPopularTrend(
		currentRecipeExtraIngredientsTagsWithTrend
	);
	const currentRecipeTagsWithTrend = union(
		calculateRecipeTagsWithTrend(currentRecipeComposedTags)
	);

	const currentIngredientCount =
		currentRecipeIngredients.length + currentRecipeExtraIngredients.length;
	const isLargePartitionTagNext = currentIngredientCount === 4;
	const shouldCalculateLargePartitionTag =
		isLargePartitionTagNext &&
		currentPopularTrend.tag === DYNAMIC_TAG_MAP.largePartition;

	const darkIngredientNames = candidates
		.filter(
			({ tags }) =>
				intersection(tags, currentRecipeNegativeTags).length > 0
		)
		.map(({ name }) => name);
	const darkIngredientSet = toSet(darkIngredientNames);

	const changesByName: IIngredientScoreChangesResult['changesByName'] = {};

	candidates.forEach(({ name, tags }) => {
		const tagsWithTrend = calculateIngredientTagsWithTrend(tags);
		const allTagsWithTrend = union(
			currentRecipeTagsWithTrend,
			tagsWithTrend
		);

		const before = composeRecipeTagsWithPopularTrend(
			currentRecipeTagsWithTrend
		);
		const after = composeRecipeTagsWithPopularTrend(allTagsWithTrend);

		let scoreChange = getIngredientScoreChange(
			before,
			after,
			customerPositiveTags,
			customerNegativeTags
		);
		scoreChange += getLargePartitionScoreChange({
			before,
			currentPopularTrend,
			customerNegativeTags,
			customerPositiveTags,
			isLargePartitionTagNext,
			shouldCalculateLargePartitionTag,
		});

		const isDarkIngredient = darkIngredientSet.has(name);
		const easterEggScore = getIngredientEasterEggScore?.({
			currentIngredients: union(currentRecipeAllIngredients, [name]),
			currentRecipeName:
				isDarkIngredient || isDarkMatter
					? DARK_MATTER_META_MAP.name
					: currentRecipeName,
			ingredientName: name,
		});

		if (easterEggScore !== null && easterEggScore !== undefined) {
			scoreChange = easterEggScore === 0 ? -Infinity : Infinity;
		}

		if (isDarkIngredient) {
			scoreChange = -Infinity;
		}

		if (isDarkMatter) {
			scoreChange = 0;
		}

		const isOrderTag =
			currentCustomerOrderRecipeTag !== null &&
			tagsWithTrend.includes(currentCustomerOrderRecipeTag) &&
			after.includes(currentCustomerOrderRecipeTag) &&
			!before.includes(currentCustomerOrderRecipeTag);

		changesByName[name] = {
			isDarkIngredient,
			isOrderTag,
			restriction: getIngredientRestriction(
				scoreChange,
				isDarkIngredient,
				isDarkMatter
			),
			scoreChange,
		};
	});

	return { changesByName, darkIngredientNames };
}
