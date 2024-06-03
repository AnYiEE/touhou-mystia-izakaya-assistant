import {Food} from './base';
import type {Ingredients} from '@/data/ingredients';

class Ingredient extends Food<Ingredients> {
	constructor(data: Ingredients) {
		super(data);

		this._data = data;
	}
}

export {Ingredient};
