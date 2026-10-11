import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

interface IRecordRouteIdentity {
	readonly id: number;
}

export function createRecordRouteStaticParams(
	records: ReadonlyArray<IRecordRouteIdentity>
) {
	return records.map(({ id }) => ({ paths: [id.toString()] }));
}

export function createOptionalRecordRouteStaticParams(
	records: ReadonlyArray<IRecordRouteIdentity>
) {
	return [{ paths: [] }, ...createRecordRouteStaticParams(records)];
}

export function shouldPrerenderRecordRoutes() {
	return PUBLIC_RUNTIME_CONFIG.isExportMode;
}
