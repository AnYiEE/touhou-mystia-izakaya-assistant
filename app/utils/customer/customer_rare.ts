import {Customer} from './base';
import {type TCustomerRares} from '@/data';

export class CustomerRare extends Customer<TCustomerRares> {
	constructor(data: TCustomerRares) {
		super(data);

		this._data = data;
	}
}
