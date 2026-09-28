import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';

import {
	createOptionalRecordRouteStaticParams,
	shouldPrerenderRecordRoutes,
} from '@/features/appShell/navigation/recordRouteStaticParams';
import SpecialGuestPageContent from '@/features/catalog/guests/special/client/components/content';

export function generateStaticParams() {
	const specialGuestCatalog = SpecialGuestCatalog.getInstance();

	return shouldPrerenderRecordRoutes()
		? createOptionalRecordRouteStaticParams(specialGuestCatalog.data)
		: [{ paths: [] }];
}

export default function SpecialGuests() {
	return <SpecialGuestPageContent />;
}
