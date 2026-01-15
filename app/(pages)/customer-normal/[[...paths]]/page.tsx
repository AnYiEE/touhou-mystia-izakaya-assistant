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

export default async function CustomerNormal({
	params,
}: {
	params: Promise<{ paths: string[] | undefined }>;
}) {
	const { paths } = await params;

	return <Content nameSlug={paths?.[0]} />;
}
