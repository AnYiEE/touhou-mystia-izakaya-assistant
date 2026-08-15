interface IGuestRouteCatalog<TId extends number, TName extends string> {
	getPropsById(id: TId, prop: 'name'): TName;
}

export function resolveGuestRouteSegment<
	TId extends number,
	TName extends string,
>({
	catalog,
	value,
}: {
	catalog: IGuestRouteCatalog<TId, TName>;
	value: string | undefined;
}): { id: TId; name: TName } | null {
	if (value === undefined || value === '') {
		return null;
	}

	const id = Number(value) as TId;
	if (value !== id.toString()) {
		return null;
	}

	try {
		return { id, name: catalog.getPropsById(id, 'name') };
	} catch {
		return null;
	}
}
