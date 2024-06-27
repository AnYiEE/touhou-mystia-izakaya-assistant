import {Food} from './base';
import {type TRecipes} from '@/data';

export class Recipe<
	TItem extends TRecipes[number] = TRecipes[number],
	TName extends TItem['name'] = TItem['name'],
	TPositiveTags extends TItem['positive'] = TItem['positive'],
	TNegativeTags extends TItem['negative'] = TItem['negative'],
> extends Food<TRecipes> {
	constructor(data: TRecipes) {
		super(data);

		this._data = data;
	}

	public getCustomerSuitability(name: TName, customerPositiveTags: string[], costomerNegativeTags: string[]) {
		const recipe = this.getPropsByName(name);

		const {positive: recipeTags} = recipe;
		const {commonTags: positiveTags, count: positiveCount} = this.getCommonTags(recipeTags, customerPositiveTags);
		const {commonTags: negativeTags, count: negativeCount} = this.getCommonTags(recipeTags, costomerNegativeTags);

		return {
			suitability: positiveCount - negativeCount,
			positive: positiveTags as TPositiveTags,
			negative: negativeTags as TNegativeTags,
		};
	}
}
