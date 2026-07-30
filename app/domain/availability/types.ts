import type { TPlace } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';

export type TAvailabilityCategory =
	| 'beverage'
	| 'clothes'
	| 'cooker'
	| 'currency'
	| 'customerNormal'
	| 'customerRare'
	| 'ingredient'
	| 'ornament'
	| 'partner'
	| 'recipe';

export type TAvailabilityAcquisitionSourceKind =
	| 'bond'
	| 'buy'
	| 'collect'
	| 'content'
	| 'fishing'
	| 'levelup'
	| 'self'
	| 'task'
	| 'unknown';

export interface IAvailabilityAcquisitionSource {
	kind: TAvailabilityAcquisitionSourceKind;
	name: string;
	place: TPlace | null;
	probability: number | null;
	timeWindow: readonly [number, number] | null;
}

export interface IAvailabilityPath {
	acquisitionSources: ReadonlyArray<IAvailabilityAcquisitionSource>;
	isFishingPath: boolean;
	requiredDlcs: readonly [TDlc, ...TDlc[]];
	sources: ReadonlyArray<string>;
}

export interface IAvailabilityResult {
	availabilityPaths: ReadonlyArray<IAvailabilityPath>;
	diagnostics: ReadonlyArray<string>;
}

export interface IAvailabilityItemData {
	availabilityDlcs: ReadonlyArray<TDlc>;
	availabilityPaths: ReadonlyArray<IAvailabilityPath>;
}

export interface IAvailabilityAuditEntry extends IAvailabilityResult {
	category: TAvailabilityCategory;
	contentDlc: TDlc;
	id: number;
	name: string;
	rawFrom: unknown;
}
