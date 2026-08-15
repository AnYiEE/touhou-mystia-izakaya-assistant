import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';

import { createOptionalRecordRouteStaticParams } from '@/features/appShell/navigation/recordRouteStaticParams';
import SpecialGuestPageContent from '@/features/catalog/guests/special/client/components/content';

export function generateStaticParams() {
	return createOptionalRecordRouteStaticParams(
		SpecialGuestCatalog.getInstance().data
	);
}

export default function SpecialGuests() {
	return <SpecialGuestPageContent />;
}
