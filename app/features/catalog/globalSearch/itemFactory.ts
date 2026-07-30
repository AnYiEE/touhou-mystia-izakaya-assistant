import type { TDlc } from '@/domain/data/shared/types';

import type {
	IGlobalSearchIndexField,
	IGlobalSearchIndexItem,
	TGlobalSearchFieldType,
	TGlobalSearchIndexSection,
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

	return text.length === 0 ? [] : [{ fieldType, label, text, weight }];
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

export function createItem({
	description,
	fields,
	name,
	section,
}: {
	description?: unknown;
	fields: IGlobalSearchIndexField[];
	name: string;
	section: TGlobalSearchIndexSection;
}): IGlobalSearchIndexItem {
	const sectionConfig = GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.find(
		({ key }) => key === section
	);
	const spriteTarget =
		sectionConfig !== undefined && 'spriteTarget' in sectionConfig
			? sectionConfig.spriteTarget
			: undefined;
	const href =
		section === 'customer-normal' || section === 'customer-rare'
			? `${GLOBAL_SEARCH_SECTION_PATH_MAP[section]}/${name}`
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
		id: `${section}:${name}`,
		name,
		section,
		sectionLabel: getSectionLabel(section),
		...(spriteTarget === undefined ? {} : { spriteTarget }),
		targetName: name,
	};
}
