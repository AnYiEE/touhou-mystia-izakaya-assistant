import Content from './content';

import { CustomerRare as Customer } from '@/utils';

export function generateStaticParams() {
	return [
		{ paths: [] },
		...Customer.getInstance()
			.getNames()
			.map((name) => ({ paths: [name] })),
	];
}

export default function CustomerRare() {
	return <Content />;
}
