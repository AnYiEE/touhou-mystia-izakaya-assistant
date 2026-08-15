import type { TDlc } from '@/domain/data/shared/types';
import type {
	TSpriteId,
	TSpriteRecordIdentity,
	TSpriteTarget,
} from '@/domain/data/sprites/types';

import type {
	IGlobalSearchIndexField,
	IGlobalSearchIndexItem,
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from '@/features/globalSearch/contracts';
import {
	GLOBAL_SEARCH_SECTION_PATH_MAP,
	GLOBAL_SEARCH_SECTION_PREFIX_GROUPS,
	getGlobalSearchSectionPath,
} from '@/features/globalSearch/core/constants';

import { joinFieldValue, joinValue } from './valueFormatting';

export const CATALOG_SEARCH_FIELD_WEIGHT = {
	context: 1.8,
	low: 1,
	medium: 2,
	name: 5,
	primary: 3,
	text: 1.4,
} as const;

export function createField(
	fieldType: TGlobalSearchFieldType,
	label: string,
	value: unknown,
	weight: number
): IGlobalSearchIndexField[] {
	const text = joinFieldValue(fieldType, value);

	return text.length === 0 ? [] : [{ fieldType, label, text, value, weight }];
}

export function createDlcFields({
	availabilityDlcs,
	dlc,
}: {
	availabilityDlcs: ReadonlyArray<TDlc>;
	dlc: TDlc;
}) {
	return [
		...createField(
			'content-dlc',
			'内容归属',
			dlc,
			CATALOG_SEARCH_FIELD_WEIGHT.medium
		),
		...createField(
			'availability-dlc',
			'可获取于',
			availabilityDlcs,
			CATALOG_SEARCH_FIELD_WEIGHT.medium
		),
	];
}

function getSectionLabel(section: TGlobalSearchSection) {
	return (
		GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.find(({ key }) => key === section)
			?.label ?? section
	);
}

type TCatalogSearchSectionConfig = Extract<
	(typeof GLOBAL_SEARCH_SECTION_PREFIX_GROUPS)[number],
	{ spriteTarget: TSpriteTarget }
>;
type TCatalogSearchIndexSection = TCatalogSearchSectionConfig['key'];
type TCatalogSearchSpriteTarget<TSection extends TCatalogSearchIndexSection> =
	Extract<TCatalogSearchSectionConfig, { key: TSection }>['spriteTarget'];

function getCatalogSearchSectionConfig<
	TSection extends TCatalogSearchIndexSection,
>(section: TSection) {
	const config = GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.find(
		(
			candidate
		): candidate is Extract<
			TCatalogSearchSectionConfig,
			{ key: TSection }
		> => candidate.key === section
	);
	if (config === undefined) {
		throw new Error('catalog-search-section-config-not-found');
	}

	return config;
}

export function createItem<TSection extends TCatalogSearchIndexSection>({
	description,
	fields,
	name,
	recordId,
	section,
}: {
	description?: unknown;
	fields: IGlobalSearchIndexField[];
	name: string;
	recordId: TSpriteId<TCatalogSearchSpriteTarget<TSection>>;
	section: TSection;
}): IGlobalSearchIndexItem {
	const sectionConfig = getCatalogSearchSectionConfig(section);
	const { spriteTarget } = sectionConfig;
	const identity = { recordId, spriteTarget } as TSpriteRecordIdentity<
		typeof spriteTarget
	>;
	const href =
		section === 'normal-guests' || section === 'special-guests'
			? `${GLOBAL_SEARCH_SECTION_PATH_MAP[section]}/${recordId}`
			: getGlobalSearchSectionPath(section);

	return {
		description: joinValue(description),
		fields: [
			...createField(
				'name',
				'名称',
				name,
				CATALOG_SEARCH_FIELD_WEIGHT.name
			),
			...fields,
		],
		href,
		id: `${spriteTarget}:${recordId}`,
		...identity,
		name,
		section,
		sectionLabel: getSectionLabel(section),
	};
}
