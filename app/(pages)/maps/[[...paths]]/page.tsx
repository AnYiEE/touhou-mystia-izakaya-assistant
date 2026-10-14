import { shouldPrerenderRecordRoutes } from '@/features/appShell/navigation/recordRouteStaticParams';
import MapsPage from '@/features/maps/client/components/MapsPage';
import { ALL_DAY_MAP_LABELS } from '@/features/maps/client/model/dayMapLabels';

export function generateStaticParams() {
	return shouldPrerenderRecordRoutes()
		? [
				{ paths: [] },
				...ALL_DAY_MAP_LABELS.map((map) => ({ paths: [map] })),
			]
		: [{ paths: [] }];
}

export default function Maps() {
	return <MapsPage />;
}
