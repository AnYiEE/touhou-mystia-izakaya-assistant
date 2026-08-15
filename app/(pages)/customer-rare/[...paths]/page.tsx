import { notFound } from 'next/navigation';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { resolveLegacyRecordName } from '@/domain/catalog/legacy/resolveLegacyRecordName';

import LegacyRouteRedirect from '@/features/appShell/client/navigation/LegacyRouteRedirect';

const specialGuestCatalog = SpecialGuestCatalog.getInstance();

export function generateStaticParams() {
	return specialGuestCatalog.getNames().map((name) => ({ paths: [name] }));
}

export default async function LegacySpecialGuestPage({
	params,
}: {
	params: Promise<{ paths: string[] }>;
}) {
	const { paths } = await params;
	const [requestedName] = paths;
	const name = specialGuestCatalog
		.getNames()
		.find((candidate) => candidate === requestedName);
	if (name === undefined) {
		notFound();
	}
	const id = resolveLegacyRecordName({
		catalog: specialGuestCatalog,
		category: 'specialGuest',
		name,
	});

	return (
		<LegacyRouteRedirect
			from={`/customer-rare/${encodeURIComponent(name)}`}
			to={`/special-guests/${id}`}
		/>
	);
}
