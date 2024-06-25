import {Food} from './base';
import {type TIngredients} from '@/data';

export class Ingredient extends Food<TIngredients> {
	constructor(data: TIngredients) {
		super(data);

		this._data = data;
	}
}
