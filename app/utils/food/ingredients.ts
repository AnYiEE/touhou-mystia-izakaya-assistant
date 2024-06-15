import {Food} from './base';
import {type Ingredients} from '@/data';

export class Ingredient extends Food<Ingredients> {
	constructor(data: Ingredients) {
		super(data);

		this._data = data;
	}
}
