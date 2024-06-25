import {Customer} from './base';
import {type TCustomerSpecials} from '@/data';

export class CustomerSpecial extends Customer<TCustomerSpecials> {
	constructor(data: TCustomerSpecials) {
		super(data);

		this._data = data;
	}
}
