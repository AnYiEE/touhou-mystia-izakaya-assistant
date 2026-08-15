export const LEGACY_RECORD_CATEGORIES = [
	'beverage',
	'clothes',
	'cooker',
	'currencyItem',
	'decoration',
	'food',
	'ingredient',
	'normalGuest',
	'partner',
	'specialGuest',
] as const;

export type TLegacyRecordCategory = (typeof LEGACY_RECORD_CATEGORIES)[number];

interface ILegacyNameHistoricalOwner {
	category: TLegacyRecordCategory;
	historicalOwnerId: number;
	name: string;
	noHistoricalOwner?: never;
}

interface ILegacyNameWithoutHistoricalOwner {
	category: TLegacyRecordCategory;
	historicalOwnerId?: never;
	name: string;
	noHistoricalOwner: true;
}

export type TLegacyNameOwnerDeclaration =
	| ILegacyNameHistoricalOwner
	| ILegacyNameWithoutHistoricalOwner;

/**
 * Sparse declarations only for current same-category duplicate-name groups.
 * Adding a record whose name remains unique requires no entry. When a
 * supported legacy payload could contain the duplicated name, declare its
 * original record ID as `historicalOwnerId`; when every record in the group is
 * new and no supported legacy payload could contain the name, declare
 * `noHistoricalOwner: true`. Never guess an owner or turn this into a complete
 * name-to-ID table.
 */
export const legacyNameOwners =
	[] as const satisfies ReadonlyArray<TLegacyNameOwnerDeclaration>;
