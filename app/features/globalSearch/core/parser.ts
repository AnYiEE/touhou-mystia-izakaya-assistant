import type {
	IGlobalSearchFieldPrefixGroup,
	IGlobalSearchPrefixSuggestion,
	IGlobalSearchQueryAst,
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from '@/features/globalSearch/contracts';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';

import {
	GLOBAL_SEARCH_FIELD_PREFIX_GROUPS,
	GLOBAL_SEARCH_SECTION_PREFIX_GROUPS,
} from './constants';
import {
	getGlobalSearchDiagnosticMessages,
	getGlobalSearchLocalizedFieldSyntax,
	getGlobalSearchLocalizedSectionSyntax,
} from './localizedSyntax';

const PREFIX_PATTERN = /^@(.+)$/u;
const ACTIVE_PREFIX_PATTERN = /(?:^|\s)@([^\s@]*)$/u;
const DEFAULT_GLOBAL_FIELD_SUGGESTION_KEYS = new Set<TGlobalSearchFieldType>([
	'description',
	'availability-dlc',
	'content-dlc',
	'from',
	'name',
	'place',
	'tag',
]);
const SINGLE_VALUE_FIELD_SUGGESTION_KEYS = new Set<TGlobalSearchFieldType>([
	'category',
	'availability-dlc',
	'content-dlc',
	'level',
	'moving-speed',
	'price',
	'speed',
	'type',
	'working-speed',
]);

function normalize(value: string) {
	return value.trim().toLowerCase();
}

const sectionAliasMapCache = new Map<
	TLocale,
	Map<string, TGlobalSearchSection>
>();

function getSectionGroup(section: TGlobalSearchSection) {
	return GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.find(
		({ key }) => key === section
	);
}

function getSectionAliases(section: TGlobalSearchSection, locale: TLocale) {
	const localized = getGlobalSearchLocalizedSectionSyntax(section, locale);
	if (localized !== undefined) {
		return localized.aliases;
	}

	return getSectionGroup(section)?.aliases ?? [section];
}

function getSectionAliasMap(locale: TLocale) {
	const cached = sectionAliasMapCache.get(locale);
	if (cached !== undefined) {
		return cached;
	}

	const map = new Map<string, TGlobalSearchSection>();
	GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.forEach(({ key }) => {
		getSectionAliases(key, locale).forEach((alias) => {
			map.set(normalize(alias), key);
		});
	});
	sectionAliasMapCache.set(locale, map);

	return map;
}

export function getSectionPrefixLabel(
	section: TGlobalSearchSection,
	locale: TLocale = DEFAULT_LOCALE
) {
	return (
		getGlobalSearchLocalizedSectionSyntax(section, locale)?.label ??
		getSectionGroup(section)?.label ??
		section
	);
}

function checkFieldGroupAvailableForSection(
	{ sections, standalone }: IGlobalSearchFieldPrefixGroup,
	section: null | TGlobalSearchSection
) {
	return (
		(section === null && standalone) ||
		(section !== null &&
			(sections === undefined || sections.includes(section)))
	);
}

function getFieldGroupAliasesForSection(
	group: IGlobalSearchFieldPrefixGroup,
	section: null | TGlobalSearchSection,
	locale: TLocale
) {
	const localized = getGlobalSearchLocalizedFieldSyntax(group.key, locale);
	const localizedAliases = localized?.aliases;
	if (localizedAliases !== undefined) {
		return section === null
			? localizedAliases
			: (localized?.sectionAliases?.[section] ?? localizedAliases);
	}

	return section === null
		? group.aliases
		: (group.sectionAliases?.[section] ?? group.aliases);
}

function getFieldTypeByAlias(
	alias: string,
	section: null | TGlobalSearchSection,
	locale: TLocale
) {
	return GLOBAL_SEARCH_FIELD_PREFIX_GROUPS.find(
		(group) =>
			checkFieldGroupAvailableForSection(group, section) &&
			getFieldGroupAliasesForSection(group, section, locale).some(
				(groupAlias) => normalize(groupAlias) === alias
			)
	)?.key;
}

function splitQuery(raw: string) {
	const tokens: Array<{ type: 'prefix' | 'text'; value: string }> = [];
	const pattern = /(@[^\s@]+)|([^@\s][^@]*)/gu;

	for (const match of raw.matchAll(pattern)) {
		const [value] = match;
		const trimmedValue = value.trim();
		if (trimmedValue.length === 0) {
			continue;
		}
		tokens.push({
			type: trimmedValue.startsWith('@') ? 'prefix' : 'text',
			value: trimmedValue,
		});
	}

	return tokens;
}

export function parseGlobalSearchQuery(
	raw: string,
	locale: TLocale = DEFAULT_LOCALE
): IGlobalSearchQueryAst {
	const tokens = splitQuery(raw);
	const diagnosticMessages = getGlobalSearchDiagnosticMessages(locale);
	const sectionAliasMap = getSectionAliasMap(locale);
	const diagnostics: string[] = [];
	const fieldConditions: IGlobalSearchQueryAst['fieldConditions'] = [];
	const freeKeywords: string[] = [];
	let resultSection: IGlobalSearchQueryAst['resultSection'] = null;
	let currentField: null | {
		fieldType: TGlobalSearchFieldType;
		prefix: string;
	} = null;

	tokens.forEach((token) => {
		if (token.type === 'prefix') {
			const prefix = PREFIX_PATTERN.exec(token.value)?.[1] ?? '';
			const normalizedPrefix = normalize(prefix);
			const section = sectionAliasMap.get(normalizedPrefix);
			const field = getFieldTypeByAlias(
				normalizedPrefix,
				resultSection,
				locale
			);

			if (resultSection === null && section !== undefined) {
				resultSection = section;
				currentField = null;
				return;
			}

			if (field !== undefined) {
				const lastCondition = fieldConditions.at(-1);
				if (
					lastCondition?.fieldType === field &&
					lastCondition.keyword.length === 0
				) {
					currentField = { fieldType: field, prefix: token.value };
					return;
				}

				currentField = { fieldType: field, prefix: token.value };
				fieldConditions.push({
					fieldType: field,
					keyword: '',
					prefix: token.value,
				});
				return;
			}

			const activeResultSection = resultSection;
			if (section !== undefined && activeResultSection !== null) {
				diagnostics.push(
					diagnosticMessages.sectionConflict(
						getSectionPrefixLabel(activeResultSection, locale),
						token.value
					)
				);
				return;
			}

			diagnostics.push(diagnosticMessages.unknownPrefix(token.value));
			currentField = null;
			return;
		}

		if (currentField !== null) {
			const lastCondition = fieldConditions.at(-1);
			if (lastCondition?.fieldType === currentField.fieldType) {
				if (
					lastCondition.keyword.length === 0 &&
					SINGLE_VALUE_FIELD_SUGGESTION_KEYS.has(
						currentField.fieldType
					)
				) {
					const [fieldKeyword = '', ...freeKeywordParts] =
						token.value.split(/\s+/u);
					lastCondition.keyword = fieldKeyword;
					currentField = null;

					const freeKeyword = freeKeywordParts.join(' ');
					if (freeKeyword.length > 0) {
						freeKeywords.push(freeKeyword);
					}
					return;
				}

				lastCondition.keyword = [lastCondition.keyword, token.value]
					.filter(Boolean)
					.join(' ');
				return;
			}
		}

		freeKeywords.push(token.value);
	});

	const emptyFieldPrefixes = new Set<string>();
	fieldConditions.forEach(({ keyword, prefix }) => {
		if (keyword.length === 0) {
			emptyFieldPrefixes.add(prefix);
		}
	});
	emptyFieldPrefixes.forEach((prefix) => {
		diagnostics.push(diagnosticMessages.emptyFieldKeyword(prefix));
	});

	return { diagnostics, fieldConditions, freeKeywords, raw, resultSection };
}

export function getSectionPrefixGroup(
	section: TGlobalSearchSection,
	locale: TLocale = DEFAULT_LOCALE
) {
	const group = getSectionGroup(section);
	if (group === undefined) {
		return;
	}

	const localized = getGlobalSearchLocalizedSectionSyntax(section, locale);
	if (localized === undefined) {
		return group;
	}

	return {
		...group,
		aliases: [...localized.aliases],
		label: localized.label,
	};
}

export function getFieldPrefixGroup(fieldType: TGlobalSearchFieldType) {
	return GLOBAL_SEARCH_FIELD_PREFIX_GROUPS.find(
		({ key }) => key === fieldType
	);
}

export function getFieldPrefixLabel(
	fieldType: TGlobalSearchFieldType,
	section: null | TGlobalSearchSection,
	locale: TLocale = DEFAULT_LOCALE
) {
	const group = getFieldPrefixGroup(fieldType);
	const localized = getGlobalSearchLocalizedFieldSyntax(fieldType, locale);
	const localizedSectionLabel =
		section === null ? undefined : localized?.sectionLabels?.[section];
	if (localizedSectionLabel !== undefined) {
		return localizedSectionLabel;
	}
	if (localized?.label !== undefined) {
		return localized.label;
	}

	const sectionLabels =
		group !== undefined && 'sectionLabels' in group
			? (group.sectionLabels as Partial<
					Record<TGlobalSearchSection, string>
				>)
			: undefined;
	const sectionLabel =
		section === null ? undefined : sectionLabels?.[section];

	return sectionLabel ?? group?.label ?? fieldType;
}

export function getSectionDisplayLabel(
	section: TGlobalSearchSection,
	fallbackLabel: string,
	locale: TLocale
) {
	return locale === DEFAULT_LOCALE
		? fallbackLabel
		: getSectionPrefixLabel(section, locale);
}

export function getFieldDisplayLabel(
	fieldType: TGlobalSearchFieldType,
	section: null | TGlobalSearchSection,
	fallbackLabel: string,
	locale: TLocale
) {
	return locale === DEFAULT_LOCALE
		? fallbackLabel
		: getFieldPrefixLabel(fieldType, section, locale);
}

export function getGlobalSearchPrefixSuggestions(
	raw: string,
	locale: TLocale = DEFAULT_LOCALE
): IGlobalSearchPrefixSuggestion[] {
	const ast = parseGlobalSearchQuery(raw, locale);
	const sectionAliasMap = getSectionAliasMap(locale);
	const activePrefix = ACTIVE_PREFIX_PATTERN.exec(raw)?.[1];
	const activeSectionPrefix =
		activePrefix === undefined
			? undefined
			: sectionAliasMap.get(normalize(activePrefix));
	const shouldShowSectionFieldSuggestions =
		ast.resultSection !== null &&
		ast.freeKeywords.length === 0 &&
		ast.fieldConditions.every(({ keyword }) => keyword.length === 0) &&
		(activePrefix === undefined ||
			activePrefix.length === 0 ||
			activeSectionPrefix === ast.resultSection);

	if (activePrefix === undefined && !shouldShowSectionFieldSuggestions) {
		return [];
	}

	const normalizedPrefix = shouldShowSectionFieldSuggestions
		? ''
		: normalize(activePrefix ?? '');
	const usedSingleValueFields = new Set(
		ast.fieldConditions
			.values()
			.filter(
				({ fieldType, keyword }) =>
					keyword.length > 0 &&
					SINGLE_VALUE_FIELD_SUGGESTION_KEYS.has(fieldType)
			)
			.map(({ fieldType }) => fieldType)
	);
	const createMatcher = (aliases: ReadonlyArray<string>) =>
		aliases.some((alias) => normalize(alias).startsWith(normalizedPrefix));

	const sectionSuggestions =
		ast.resultSection === null
			? GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.filter(({ key }) =>
					createMatcher(getSectionAliases(key, locale))
				).map<IGlobalSearchPrefixSuggestion>(({ key }) => {
					const aliases = getSectionAliases(key, locale);
					const alias = aliases[0] ?? key;

					return {
						alias,
						insertText: `@${alias} `,
						key,
						kind: 'section',
						label: getSectionPrefixLabel(key, locale),
					};
				})
			: [];

	const fieldSuggestions = GLOBAL_SEARCH_FIELD_PREFIX_GROUPS.filter(
		(group) =>
			!(
				ast.resultSection === null &&
				normalizedPrefix.length === 0 &&
				!DEFAULT_GLOBAL_FIELD_SUGGESTION_KEYS.has(group.key)
			) &&
			!usedSingleValueFields.has(group.key) &&
			checkFieldGroupAvailableForSection(group, ast.resultSection) &&
			createMatcher(
				getFieldGroupAliasesForSection(group, ast.resultSection, locale)
			)
	).map<IGlobalSearchPrefixSuggestion>((group) => {
		const localized = getGlobalSearchLocalizedFieldSyntax(
			group.key,
			locale
		);
		const alias =
			getFieldGroupAliasesForSection(
				group,
				ast.resultSection,
				locale
			)[0] ?? group.label;

		return {
			alias,
			insertText: `@${alias} `,
			key: group.key,
			kind: 'field',
			label: getFieldPrefixLabel(group.key, ast.resultSection, locale),
			...('valueTypeLabel' in group
				? {
						valueTypeLabel:
							localized?.valueTypeLabel ?? group.valueTypeLabel,
					}
				: {}),
		};
	});

	return [...sectionSuggestions, ...fieldSuggestions];
}
