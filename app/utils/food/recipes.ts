import {Food} from './base';
import {type TRecipes} from '@/data';

export class Recipe<
	TItem extends TRecipes[number] = TRecipes[number],
	TName extends TItem['name'] = TItem['name'],
> extends Food<TRecipes> {
	private static tagCoverMap = {
		大份: '小巧',
		灼热: '凉爽',
		肉: '素',
		重油: '清淡',
		饱腹: '下酒',
	} as const;

	constructor(data: TRecipes) {
		super(data);

		this._data = data;
	}

	public composeTags<T extends string, U extends string>(
		originalIngredients: T[],
		extraIngredients: T[],
		originalRecipePositiveTags: U[],
		extraIngredientTags: U[]
	) {
		const resultTags = new Set([...originalRecipePositiveTags, ...extraIngredientTags]);

		if (originalIngredients.length + extraIngredients.length >= 5) {
			resultTags.add('大份' as U);
		}

		for (const [targetTag, coveredTag] of Object.entries(Recipe.tagCoverMap)) {
			if (resultTags.has(targetTag as U)) {
				resultTags.delete(coveredTag as U);
			}
		}

		return [...resultTags];
	}

	public getCustomerSuitability<T extends TName, U extends string, S extends string>(
		name: T,
		customerPositiveTags: U[],
		costomerNegativeTags: S[]
	) {
		const recipe = this.getPropsByName(name);

		const {positiveTags: recipeTags} = recipe;
		const {commonTags: positiveTags, count: positiveCount} = this.getCommonTags(recipeTags, customerPositiveTags);
		const {commonTags: negativeTags, count: negativeCount} = this.getCommonTags(recipeTags, costomerNegativeTags);

		return {
			negativeTags,
			positiveTags,
			suitability: positiveCount - negativeCount,
		};
	}

	private calculateScore(
		recipePositiveTags: string[],
		customerPositiveTags: string[],
		costomerNegativeTags: string[]
	) {
		let score = 0;

		for (const tag of recipePositiveTags) {
			if (customerPositiveTags.includes(tag)) {
				score += 1;
			}
			if (costomerNegativeTags.includes(tag)) {
				score -= 1;
			}
		}

		return score;
	}

	public getIngredientScoreChange<T extends string, U extends string>(
		oldRecipePositiveTags: T[],
		newRecipePositiveTags: T[],
		customerPositiveTags: U[],
		costomerNegativeTags: U[]
	) {
		const originalScore = this.calculateScore(oldRecipePositiveTags, customerPositiveTags, costomerNegativeTags);
		const newScore = this.calculateScore(newRecipePositiveTags, customerPositiveTags, costomerNegativeTags);

		return newScore - originalScore;
	}
}
