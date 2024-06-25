import {Food} from './base';
import {type TRecipes} from '@/data';

export class Recipe extends Food<TRecipes> {
	constructor(data: TRecipes) {
		super(data);

		this._data = data;
	}
}
