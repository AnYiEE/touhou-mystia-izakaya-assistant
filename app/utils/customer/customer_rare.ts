import {Customer} from './base';
import {type CustomerRares} from '@/data';

export class CustomerRare extends Customer<CustomerRares> {
	constructor(data: CustomerRares) {
		super(data);

		this._data = data;
	}
}
