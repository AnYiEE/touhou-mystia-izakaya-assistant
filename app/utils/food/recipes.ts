import {Food} from './base';
import {type TRecipes} from '@/data';

export class Recipe<
	TItem extends TRecipes[number] = TRecipes[number],
	TName extends TItem['name'] = TItem['name'],
	TPositiveTags extends TItem['positiveTags'] = TItem['positiveTags'],
	TNegativeTags extends TItem['negativeTags'] = TItem['negativeTags'],
> extends Food<TRecipes> {
	constructor(data: TRecipes) {
		super(data);

		this._data = data;
	}

	public getCustomerSuitability(name: TName, customerPositiveTags: string[], costomerNegativeTags: string[]) {
		const recipe = this.getPropsByName(name);

		const {positiveTags: recipeTags} = recipe;
		const {commonTags: positiveTags, count: positiveCount} = this.getCommonTags(recipeTags, customerPositiveTags);
		const {commonTags: negativeTags, count: negativeCount} = this.getCommonTags(recipeTags, costomerNegativeTags);

		return {
			suitability: positiveCount - negativeCount,
			positiveTags: positiveTags as TPositiveTags,
			negativeTags: negativeTags as TNegativeTags,
		};
	}
}
