import {
	type TLegacyNameOwnerDeclaration,
	type TLegacyRecordCategory,
	legacyNameOwners,
} from './legacyNameOwners';

export type TLegacyRecordNameResolutionErrorCode =
	| 'legacy-record-name-ambiguous'
	| 'legacy-record-name-declaration-invalid'
	| 'legacy-record-name-no-historical-owner'
	| 'legacy-record-name-not-found';

export class LegacyRecordNameResolutionError extends Error {
	public readonly code: TLegacyRecordNameResolutionErrorCode;

	public constructor(code: TLegacyRecordNameResolutionErrorCode) {
		super(code);
		this.code = code;
		this.name = 'LegacyRecordNameResolutionError';
	}
}

interface ILegacyRecordCatalog<TId extends number, TName extends string> {
	readonly data: ReadonlyArray<{ id: TId; name: TName }>;
	findIndicesByName(name: TName): ReadonlyArray<number>;
}

export function resolveLegacyRecordName<
	TId extends number,
	TName extends string,
>({
	catalog,
	category,
	declarations = legacyNameOwners,
	name,
}: {
	catalog: ILegacyRecordCatalog<TId, TName>;
	category: TLegacyRecordCategory;
	declarations?: ReadonlyArray<TLegacyNameOwnerDeclaration>;
	name: TName;
}): TId {
	const matchingDeclarations = declarations.filter(
		(declaration) =>
			declaration.category === category && declaration.name === name
	);
	if (matchingDeclarations.length > 1) {
		throw new LegacyRecordNameResolutionError(
			'legacy-record-name-declaration-invalid'
		);
	}

	const indices = catalog.findIndicesByName(name);
	const [declaration] = matchingDeclarations;
	if (declaration?.noHistoricalOwner === true) {
		throw new LegacyRecordNameResolutionError(
			'legacy-record-name-no-historical-owner'
		);
	}
	if (declaration?.historicalOwnerId !== undefined) {
		const historicalOwner = indices
			.flatMap((index) => {
				const record = catalog.data[index];
				return record === undefined ? [] : [record];
			})
			.find(({ id }) => id === declaration.historicalOwnerId);
		if (historicalOwner === undefined) {
			throw new LegacyRecordNameResolutionError(
				'legacy-record-name-declaration-invalid'
			);
		}

		return historicalOwner.id;
	}

	if (indices.length === 0) {
		throw new LegacyRecordNameResolutionError(
			'legacy-record-name-not-found'
		);
	}
	if (indices.length > 1) {
		throw new LegacyRecordNameResolutionError(
			'legacy-record-name-ambiguous'
		);
	}

	const record = catalog.data[indices[0] as number];
	if (record === undefined) {
		throw new LegacyRecordNameResolutionError(
			'legacy-record-name-declaration-invalid'
		);
	}

	return record.id;
}
