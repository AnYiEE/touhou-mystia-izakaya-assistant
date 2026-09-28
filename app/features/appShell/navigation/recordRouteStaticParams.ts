import { checkEnvironmentFlag } from '@/infrastructure/environment/flags';

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
	return (
		checkEnvironmentFlag(process.env.OFFLINE) ||
		!checkEnvironmentFlag(process.env.SELF_HOSTED)
	);
}
