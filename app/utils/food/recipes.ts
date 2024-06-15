import {Food} from './base';
import {type Recipes} from '@/data';

export class Recipe extends Food<Recipes> {
	constructor(data: Recipes) {
		super(data);

		this._data = data;
	}
}
