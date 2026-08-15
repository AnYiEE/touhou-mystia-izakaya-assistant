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
