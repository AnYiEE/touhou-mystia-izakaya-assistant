import { customerNormalStore } from '@/features/catalog/customers/normal/client/state/store';
import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';

export function selectCatalogCustomer(
	section: 'customer-normal' | 'customer-rare',
	name: string
) {
	if (section === 'customer-normal') {
		customerNormalStore.onCustomerSelectedChange(name as never);
		return;
	}

	customerRareStore.onCustomerSelectedChange(name as never);
}
