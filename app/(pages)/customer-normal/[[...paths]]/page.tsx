import Content from './content';

import { CustomerNormal as Customer } from '@/utils';

export function generateStaticParams() {
	return [
		{ paths: [] },
		...Customer.getInstance()
			.getNames()
			.map((name) => ({ paths: [name] })),
	];
}

export default function CustomerNormal() {
	return <Content />;
}
