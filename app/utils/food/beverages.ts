import {Food} from './base';
import {type Beverages} from '@/data';

export class Beverage extends Food<Beverages> {
	constructor(data: Beverages) {
		super(data);

		this._data = data;
	}
}
