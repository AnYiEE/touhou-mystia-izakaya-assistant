import { CustomerNormal as Customer } from '@/domain/catalog/customers/CustomerNormal';

import { CustomerNormalPageContent } from '@/features/catalog/customers/normal/client';

export function generateStaticParams() {
	return [
		{ paths: [] },
		...Customer.getInstance()
			.getNames()
			.map((name) => ({ paths: [name] })),
	];
}

export default function CustomerNormal() {
	return <CustomerNormalPageContent />;
}
