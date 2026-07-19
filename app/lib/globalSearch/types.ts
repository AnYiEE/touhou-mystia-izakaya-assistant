import type { TSpriteTarget } from '@/utils/sprite/types';

export type TGlobalSearchSection =
	| 'beverages'
	| 'clothes'
	| 'cookers'
	| 'currencies'
	| 'customers'
	| 'customer-normal'
	| 'customer-rare'
	| 'ingredients'
	| 'ornaments'
	| 'partners'
	| 'preferences'
	| 'recipes';

export type TGlobalSearchIndexSection = Exclude<
	TGlobalSearchSection,
	'customers'
>;

export type TGlobalSearchFieldType =
	| 'beverage-tag'
	| 'category'
	| 'chat'
	| 'content-dlc'
	| 'cooker'
	| 'customer-tag'
	| 'description'
	| 'availability-dlc'
	| 'effect'
	| 'evaluation'
	| 'from'
	| 'ingredient'
	| 'level'
	| 'moving-speed'
	| 'name'
	| 'negative-tag'
	| 'negative-spell-card'
	| 'place'
	| 'positive-tag'
	| 'positive-spell-card'
	| 'price'
	| 'reward'
	| 'speed'
	| 'spell-card'
	| 'tag'
	| 'type'
	| 'working-speed';

export type TGlobalSearchPrefixKind = 'field' | 'section';

export interface IGlobalSearchSectionPrefixGroup {
	aliases: string[];
	key: TGlobalSearchSection;
	label: string;
	order: number;
	spriteTarget?: TSpriteTarget;
}

export interface IGlobalSearchFieldPrefixGroup {
	aliases: string[];
	key: TGlobalSearchFieldType;
	label: string;
	order: number;
	sectionAliases?: Partial<Record<TGlobalSearchSection, string[]>>;
	sectionLabels?: Partial<Record<TGlobalSearchSection, string>>;
	sections?: TGlobalSearchSection[];
	standalone: boolean;
	valueTypeLabel?: string;
}

export interface IGlobalSearchExampleQuery {
	description: string;
	previewSection?: TGlobalSearchSection;
	query: string;
}

export interface IGlobalSearchFieldCondition {
	fieldType: TGlobalSearchFieldType;
	keyword: string;
	prefix: string;
}

export interface IGlobalSearchQueryAst {
	diagnostics: string[];
	fieldConditions: IGlobalSearchFieldCondition[];
	freeKeywords: string[];
	raw: string;
	resultSection: null | TGlobalSearchSection;
}

export interface IGlobalSearchIndexField {
	fieldType: TGlobalSearchFieldType;
	label: string;
	text: string;
	weight: number;
}

export interface IGlobalSearchIndexItem {
	action?: 'open-account-modal' | 'open-customer-rare-plan-drawer';
	description: string;
	fields: IGlobalSearchIndexField[];
	href: string;
	id: string;
	name: string;
	section: TGlobalSearchIndexSection;
	sectionLabel: string;
	spriteTarget?: TSpriteTarget;
	targetName?: string;
}

export interface IGlobalSearchMatchedField {
	field: IGlobalSearchIndexField;
	keyword: string;
	score: number;
	snippet: string;
}

export interface IGlobalSearchResult {
	item: IGlobalSearchIndexItem;
	matches: IGlobalSearchMatchedField[];
	score: number;
}

export interface IGlobalSearchPrefixSuggestion {
	alias: string;
	insertText: string;
	kind: TGlobalSearchPrefixKind;
	key: TGlobalSearchFieldType | TGlobalSearchSection;
	label: string;
	valueTypeLabel?: string;
}

export interface IGlobalSearchTransientTarget {
	name: string;
	section: TGlobalSearchIndexSection;
}
