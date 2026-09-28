import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';

import {
	createOptionalRecordRouteStaticParams,
	shouldPrerenderRecordRoutes,
} from '@/features/appShell/navigation/recordRouteStaticParams';
import NormalGuestPageContent from '@/features/catalog/guests/normal/client/components/content';

export function generateStaticParams() {
	const normalGuestCatalog = NormalGuestCatalog.getInstance();

	return shouldPrerenderRecordRoutes()
		? createOptionalRecordRouteStaticParams(normalGuestCatalog.data)
		: [{ paths: [] }];
}

export default function NormalGuests() {
	return <NormalGuestPageContent />;
}
