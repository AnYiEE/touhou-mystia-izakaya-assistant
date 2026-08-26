import type {
	TSpriteRecordIdentity,
	TSpriteTarget,
} from '@/domain/data/sprites/types';

export type TGlobalSearchSection =
	| 'badges'
	| 'beverages'
	| 'clothes'
	| 'cookers'
	| 'currency-items'
	| 'decorations'
	| 'foods'
	| 'fishing-collectibles'
	| 'guests'
	| 'ingredients'
	| 'items'
	| 'normal-guests'
	| 'partners'
	| 'preferences'
	| 'records'
	| 'special-guests';

export type TGlobalSearchIndexSection = Exclude<TGlobalSearchSection, 'guests'>;

export type TGlobalSearchFieldType =
	| 'availability-dlc'
	| 'beverage-tag'
	| 'category'
	| 'chat'
	| 'content-dlc'
	| 'composer'
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
	| 'original'
	| 'place'
	| 'positive-spell-card'
	| 'positive-tag'
	| 'price'
	| 'reward'
	| 'speed'
	| 'spell-card'
	| 'tag'
	| 'track-name'
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
		| 'badges'
		| 'beverages'
		| 'clothes'
		| 'cookers'
		| 'currency-items'
		| 'decorations'
		| 'foods'
		| 'fishing-collectibles'
		| 'ingredients'
		| 'items'
		| 'partners'
		| 'records'
	>;
}
