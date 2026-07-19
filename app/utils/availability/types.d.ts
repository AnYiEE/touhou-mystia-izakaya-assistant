import { type TDlc } from '@/data';

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

export interface IAvailabilityPath {
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
