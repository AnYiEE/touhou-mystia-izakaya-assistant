import type {
	TSpriteRecordIdentity,
	TSpriteTarget,
} from '@/domain/data/sprites/types';

export type TGlobalSearchSection =
	| 'beverages'
	| 'clothes'
	| 'cookers'
	| 'currency-items'
	| 'decorations'
	| 'foods'
	| 'guests'
	| 'ingredients'
	| 'normal-guests'
	| 'partners'
	| 'preferences'
	| 'special-guests';

export type TGlobalSearchIndexSection = Exclude<TGlobalSearchSection, 'guests'>;

export type TGlobalSearchFieldType =
	| 'availability-dlc'
	| 'beverage-tag'
	| 'category'
	| 'chat'
	| 'content-dlc'
	| 'cooker-type'
	| 'description'
	| 'effect'
	| 'evaluation'
	| 'from'
	| 'guest-tag'
	| 'ingredient'
	| 'level'
	| 'moving-speed'
	| 'name'
	| 'negative-spell-card'
	| 'negative-tag'
	| 'place'
	| 'positive-spell-card'
	| 'positive-tag'
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
	value: unknown;
	weight: number;
}

interface IGlobalSearchIndexItemBase {
	description: string;
	fields: IGlobalSearchIndexField[];
	href: string;
	id: string;
	name: string;
	navigationAction?: TGlobalSearchNavigationAction;
	section: TGlobalSearchIndexSection;
	sectionLabel: string;
}

export type IGlobalSearchIndexItem = IGlobalSearchIndexItemBase &
	(TSpriteRecordIdentity | { recordId?: number; spriteTarget?: never });

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
	key: TGlobalSearchFieldType | TGlobalSearchSection;
	kind: TGlobalSearchPrefixKind;
	label: string;
	valueTypeLabel?: string;
}

export interface IGlobalSearchTransientTarget {
	recordId: number;
	section: TGlobalSearchIndexSection;
}

export type TGlobalSearchNavigationAction =
	| { type: 'open-account' }
	| { type: 'open-special-guest-plans' }
	| { targetKey: string; type: 'open-preference' };

export interface IGlobalSearchFilterAction {
	description: string;
	label: string;
	run(): void;
	targetSection: Extract<
		TGlobalSearchSection,
		| 'beverages'
		| 'clothes'
		| 'cookers'
		| 'currency-items'
		| 'ingredients'
		| 'decorations'
		| 'partners'
		| 'foods'
	>;
}
