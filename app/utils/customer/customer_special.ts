import {Customer} from './base';
import {type CustomerSpecials} from '@/data';

export class CustomerSpecial extends Customer<CustomerSpecials> {
	constructor(data: CustomerSpecials) {
		super(data);

		this._data = data;
	}
}
