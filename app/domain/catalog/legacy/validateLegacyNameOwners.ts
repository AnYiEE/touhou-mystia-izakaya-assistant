import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

import {
	LEGACY_RECORD_CATEGORIES,
	type TLegacyRecordCategory,
} from './legacyNameOwners';

export type TRecordIdentityValidationErrorCode =
	| 'record-identity-declaration-category-mismatch'
	| 'record-identity-declaration-invalid'
	| 'record-identity-duplicate-declaration-missing'
	| 'record-identity-historical-owner-not-found'
	| 'record-identity-historical-owner-outside-group'
	| 'record-identity-owner-modes-conflict';

export class RecordIdentityValidationError extends Error {
	public readonly code: TRecordIdentityValidationErrorCode;

	public constructor(code: TRecordIdentityValidationErrorCode) {
		super(code);
		this.code = code;
		this.name = 'RecordIdentityValidationError';
	}
}

export interface ILegacyRecordIdentity {
	id: number;
	name: string;
}

export type TLegacyRecordRegistry = Readonly<
	Partial<Record<TLegacyRecordCategory, ReadonlyArray<ILegacyRecordIdentity>>>
>;

function fail(code: TRecordIdentityValidationErrorCode): never {
	throw new RecordIdentityValidationError(code);
}

function getDuplicateNameGroups(records: ReadonlyArray<ILegacyRecordIdentity>) {
	const recordsByName = new Map<string, ILegacyRecordIdentity[]>();
	for (const record of records) {
		const group = recordsByName.get(record.name);
		if (group === undefined) {
			recordsByName.set(record.name, [record]);
		} else {
			group.push(record);
		}
	}

	return [...recordsByName].filter(([, group]) => group.length > 1);
}

export function validateLegacyNameOwners(
	recordRegistry: TLegacyRecordRegistry,
	declarations: ReadonlyArray<unknown>
) {
	const duplicateGroups = new Map<
		TLegacyRecordCategory,
		Map<string, ReadonlyArray<ILegacyRecordIdentity>>
	>();
	for (const category of LEGACY_RECORD_CATEGORIES) {
		duplicateGroups.set(
			category,
			new Map(getDuplicateNameGroups(recordRegistry[category] ?? []))
		);
	}

	const declarationRecords = declarations.map((declaration) => {
		if (!checkIsRecord(declaration)) {
			fail('record-identity-declaration-invalid');
		}
		const { category, name } = declaration;
		if (
			typeof category !== 'string' ||
			!LEGACY_RECORD_CATEGORIES.includes(
				category as TLegacyRecordCategory
			) ||
			typeof name !== 'string'
		) {
			fail('record-identity-declaration-invalid');
		}

		const declaredCategory = category as TLegacyRecordCategory;
		if (!duplicateGroups.get(declaredCategory)?.has(name)) {
			const isDuplicateInAnotherCategory = LEGACY_RECORD_CATEGORIES.some(
				(candidateCategory) =>
					candidateCategory !== declaredCategory &&
					duplicateGroups.get(candidateCategory)?.has(name) === true
			);
			fail(
				isDuplicateInAnotherCategory
					? 'record-identity-declaration-category-mismatch'
					: 'record-identity-declaration-invalid'
			);
		}
		return declaration;
	});

	for (const category of LEGACY_RECORD_CATEGORIES) {
		const records = recordRegistry[category] ?? [];
		for (const [name, duplicateGroup] of duplicateGroups.get(category) ??
			[]) {
			const nameDeclarations = declarationRecords.filter(
				(declaration) => declaration['name'] === name
			);
			const categoryDeclarations = nameDeclarations.filter(
				(declaration) => declaration['category'] === category
			);
			if (categoryDeclarations.length === 0) {
				fail(
					nameDeclarations.length > 0
						? 'record-identity-declaration-category-mismatch'
						: 'record-identity-duplicate-declaration-missing'
				);
			}
			if (categoryDeclarations.length !== 1) {
				fail('record-identity-declaration-invalid');
			}

			const [declarationValue] = categoryDeclarations;
			const declaration = declarationValue as Record<string, unknown>;
			const hasHistoricalOwner = Object.hasOwn(
				declaration,
				'historicalOwnerId'
			);
			const hasNoHistoricalOwner = Object.hasOwn(
				declaration,
				'noHistoricalOwner'
			);
			if (hasHistoricalOwner === hasNoHistoricalOwner) {
				fail('record-identity-owner-modes-conflict');
			}
			if (hasNoHistoricalOwner) {
				if (declaration['noHistoricalOwner'] !== true) {
					fail('record-identity-declaration-invalid');
				}
				continue;
			}

			const { historicalOwnerId } = declaration;
			if (!Number.isSafeInteger(historicalOwnerId)) {
				fail('record-identity-historical-owner-not-found');
			}
			const historicalOwner = records.find(
				({ id }) => id === historicalOwnerId
			);
			if (historicalOwner === undefined) {
				fail('record-identity-historical-owner-not-found');
			}
			if (!duplicateGroup.includes(historicalOwner)) {
				fail('record-identity-historical-owner-outside-group');
			}
		}
	}
}
