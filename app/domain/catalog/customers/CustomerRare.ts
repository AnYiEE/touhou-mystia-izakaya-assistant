import { isAvailableWithHiddenDlcs } from '@/domain/availability/catalog';
import type { IAvailabilityPath } from '@/domain/availability/types';
import { CUSTOMER_RARE_LIST } from '@/domain/data/customers/rare/records';
import type { TCustomerRares } from '@/domain/data/customers/rare/types';
import type { TDlc } from '@/domain/data/shared/types';

import { Customer } from './Customer';

export class CustomerRare extends Customer<TCustomerRares> {
	private static _instance: CustomerRare | undefined;

	public static getInstance() {
		if (CustomerRare._instance !== undefined) {
			return CustomerRare._instance;
		}

		const instance = new CustomerRare(CUSTOMER_RARE_LIST, 'customerRare');

		CustomerRare._instance = instance;

		return instance;
	}

	public isVisibleWithHiddenDlcs(
		customer: { availabilityPaths: ReadonlyArray<IAvailabilityPath> },
		hiddenDlcs: ReadonlySet<TDlc>
	) {
		return isAvailableWithHiddenDlcs(
			customer.availabilityPaths,
			hiddenDlcs
		);
	}
}
