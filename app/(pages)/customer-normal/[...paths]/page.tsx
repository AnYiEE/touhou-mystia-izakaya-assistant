import { notFound } from 'next/navigation';

import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { resolveLegacyRecordName } from '@/domain/catalog/legacy/resolveLegacyRecordName';

import LegacyRouteRedirect from '@/features/appShell/client/navigation/LegacyRouteRedirect';

const normalGuestCatalog = NormalGuestCatalog.getInstance();

export function generateStaticParams() {
	return normalGuestCatalog.getNames().map((name) => ({ paths: [name] }));
}

export default async function LegacyNormalGuestPage({
	params,
}: {
	params: Promise<{ paths: string[] }>;
}) {
	const { paths } = await params;
	const [requestedName] = paths;
	const name = normalGuestCatalog
		.getNames()
		.find((candidate) => candidate === requestedName);
	if (name === undefined) {
		notFound();
	}
	const id = resolveLegacyRecordName({
		catalog: normalGuestCatalog,
		category: 'normalGuest',
		name,
	});

	return (
		<LegacyRouteRedirect
			from={`/customer-normal/${encodeURIComponent(name)}`}
			to={`/normal-guests/${id}`}
		/>
	);
}
