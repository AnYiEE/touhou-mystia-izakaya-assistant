import { shouldPrerenderRecordRoutes } from '@/features/appShell/navigation/recordRouteStaticParams';
import MapsPageEntry from '@/features/maps/client/components/MapsPageEntry';
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
	return <MapsPageEntry />;
}
