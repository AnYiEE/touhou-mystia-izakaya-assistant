export function resolveLegacyTagLabel<TId extends number>({
	allowed,
	errorCode,
	facts,
	label,
}: {
	allowed?: ReadonlySet<number>;
	errorCode: string;
	facts: Readonly<Record<TId, string>>;
	label: string;
}): TId {
	const matches = Object.entries(facts).filter(
		([id, candidate]) =>
			candidate === label && (allowed?.has(Number(id)) ?? true)
	);
	if (matches.length !== 1) {
		throw new Error(errorCode);
	}

	return Number(matches[0]?.[0]) as TId;
}
