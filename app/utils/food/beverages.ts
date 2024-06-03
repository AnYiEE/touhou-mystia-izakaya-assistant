import {Food} from './base';
import type {Beverages} from '@/data/beverages';

class Beverage extends Food<Beverages> {
	constructor(data: Beverages) {
		super(data);

		this._data = data;
	}
}

export {Beverage};
