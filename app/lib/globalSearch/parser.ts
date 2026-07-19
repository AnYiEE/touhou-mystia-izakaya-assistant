import {
	GLOBAL_SEARCH_FIELD_PREFIX_GROUPS,
	GLOBAL_SEARCH_SECTION_PREFIX_GROUPS,
} from './constants';
import type {
	IGlobalSearchFieldPrefixGroup,
	IGlobalSearchPrefixSuggestion,
	IGlobalSearchQueryAst,
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from './types';

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

function createAliasMap<T extends string>(
	groups: ReadonlyArray<{ aliases: ReadonlyArray<string>; key: T }>
) {
	const map = new Map<string, T>();

	groups.forEach(({ aliases, key }) => {
		aliases.forEach((alias) => {
			map.set(normalize(alias), key);
		});
	});

	return map;
}

const sectionAliasMap = createAliasMap(GLOBAL_SEARCH_SECTION_PREFIX_GROUPS);

function getSectionLabel(section: TGlobalSearchSection) {
	return (
		GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.find(({ key }) => key === section)
			?.label ?? section
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
	section: null | TGlobalSearchSection
) {
	return section === null
		? group.aliases
		: (group.sectionAliases?.[section] ?? group.aliases);
}

function getFieldTypeByAlias(
	alias: string,
	section: null | TGlobalSearchSection
) {
	return GLOBAL_SEARCH_FIELD_PREFIX_GROUPS.find(
		(group) =>
			checkFieldGroupAvailableForSection(group, section) &&
			getFieldGroupAliasesForSection(group, section).some(
				(groupAlias) => normalize(groupAlias) === alias
			)
	)?.key;
}

function splitQuery(raw: string) {
	const tokens: Array<{ type: 'prefix' | 'text'; value: string }> = [];
	const pattern = /(@[^\s@]+)|([^@\s][^@]*)/gu;
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(raw)) !== null) {
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

export function parseGlobalSearchQuery(raw: string): IGlobalSearchQueryAst {
	const tokens = splitQuery(raw);
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
			const field = getFieldTypeByAlias(normalizedPrefix, resultSection);

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
					`一次只能限定一个结果分区；已使用“${getSectionLabel(activeResultSection)}”，已忽略“${token.value}”。`
				);
				return;
			}

			diagnostics.push(`未识别前缀 ${token.value}`);
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
		diagnostics.push(`${prefix} 后还需要输入关键词`);
	});

	return { diagnostics, fieldConditions, freeKeywords, raw, resultSection };
}

export function getSectionPrefixGroup(section: TGlobalSearchSection) {
	return GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.find(
		({ key }) => key === section
	);
}

export function getFieldPrefixGroup(fieldType: TGlobalSearchFieldType) {
	return GLOBAL_SEARCH_FIELD_PREFIX_GROUPS.find(
		({ key }) => key === fieldType
	);
}

export function getFieldPrefixLabel(
	fieldType: TGlobalSearchFieldType,
	section: null | TGlobalSearchSection
) {
	const group = getFieldPrefixGroup(fieldType);
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

export function getGlobalSearchPrefixSuggestions(
	raw: string
): IGlobalSearchPrefixSuggestion[] {
	const ast = parseGlobalSearchQuery(raw);
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
			? GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.filter(({ aliases }) =>
					createMatcher(aliases)
				).map<IGlobalSearchPrefixSuggestion>(
					({ aliases, key, label }) => ({
						alias: aliases[0],
						insertText: `@${aliases[0]} `,
						key,
						kind: 'section',
						label,
					})
				)
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
				getFieldGroupAliasesForSection(group, ast.resultSection)
			)
	).map<IGlobalSearchPrefixSuggestion>((group) => {
		const alias =
			getFieldGroupAliasesForSection(group, ast.resultSection)[0] ??
			group.label;

		return {
			alias,
			insertText: `@${alias} `,
			key: group.key,
			kind: 'field',
			label: getFieldPrefixLabel(group.key, ast.resultSection),
			...('valueTypeLabel' in group
				? { valueTypeLabel: group.valueTypeLabel }
				: {}),
		};
	});

	return [...sectionSuggestions, ...fieldSuggestions];
}
