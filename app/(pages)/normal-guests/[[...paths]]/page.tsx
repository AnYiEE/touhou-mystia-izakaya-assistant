import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';

import { createOptionalRecordRouteStaticParams } from '@/features/appShell/navigation/recordRouteStaticParams';
import NormalGuestPageContent from '@/features/catalog/guests/normal/client/components/content';

export function generateStaticParams() {
	return createOptionalRecordRouteStaticParams(
		NormalGuestCatalog.getInstance().data
	);
}

export default function NormalGuests() {
	return <NormalGuestPageContent />;
}
