import { CustomerRare as Customer } from '@/domain/catalog/customers/CustomerRare';

import { CustomerRarePageContent } from '@/features/catalog/customers/rare/client';

export function generateStaticParams() {
	return [
		{ paths: [] },
		...Customer.getInstance()
			.getNames()
			.map((name) => ({ paths: [name] })),
	];
}

export default function CustomerRare() {
	return <CustomerRarePageContent />;
}
