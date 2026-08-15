import type {
	IGlobalSearchIndexItem,
	TGlobalSearchIndexSection,
} from '@/features/globalSearch/contracts';

interface IRecentSearchState {
	items: string[];
	queries: string[];
}

export type TGlobalSearchRecentIndexItem = Pick<
	IGlobalSearchIndexItem,
	'id' | 'name' | 'section'
>;

const LEGACY_RECENT_ITEM_ID_MAP = new Map<string, string>([
	['preferences:customer-hidden-items', 'preferences:guest-hidden-items'],
	[
		'preferences:customer-order-linked-filter',
		'preferences:special-guest-order-linked-filter',
	],
	[
		'preferences:customer-rare-plan-drawer',
		'preferences:special-guest-plan-drawer',
	],
	[
		'preferences:customer-show-tag-description',
		'preferences:special-guest-show-tag-description',
	],
	[
		'preferences:customer-suggest-meals',
		'preferences:special-guest-suggest-meals',
	],
]);

const RECENT_RECORD_SECTION_MAP = new Map<string, TGlobalSearchIndexSection>([
	['beverages', 'beverages'],
	['clothes', 'clothes'],
	['cookers', 'cookers'],
	['currencies', 'currency-items'],
	['customer-normal', 'normal-guests'],
	['customer-rare', 'special-guests'],
	['ingredients', 'ingredients'],
	['ornaments', 'decorations'],
	['partners', 'partners'],
	['recipes', 'foods'],
]);

function migrateRecentItemId(
	itemId: string,
	index: ReadonlyArray<TGlobalSearchRecentIndexItem>,
	currentIds: ReadonlySet<string>
) {
	if (currentIds.has(itemId)) {
		return itemId;
	}
	const migratedItemId = LEGACY_RECENT_ITEM_ID_MAP.get(itemId);
	if (migratedItemId !== undefined && currentIds.has(migratedItemId)) {
		return migratedItemId;
	}

	const separatorIndex = itemId.indexOf(':');
	if (separatorIndex <= 0 || separatorIndex === itemId.length - 1) {
		return itemId;
	}

	const section = RECENT_RECORD_SECTION_MAP.get(
		itemId.slice(0, separatorIndex)
	);
	if (section === undefined) {
		return itemId;
	}

	const name = itemId.slice(separatorIndex + 1);
	let matchedItem: TGlobalSearchRecentIndexItem | undefined;
	for (const item of index) {
		if (item.section !== section || item.name !== name) {
			continue;
		}
		if (matchedItem !== undefined) {
			return itemId;
		}
		matchedItem = item;
	}

	return matchedItem?.id ?? itemId;
}

export function migrateGlobalSearchRecentState(
	state: IRecentSearchState,
	index: ReadonlyArray<TGlobalSearchRecentIndexItem>
): IRecentSearchState {
	const currentIds = new Set<string>();
	for (const item of index) {
		currentIds.add(item.id);
	}

	let isChanged = false;
	const items: string[] = [];
	for (const itemId of state.items) {
		const migratedItemId = migrateRecentItemId(itemId, index, currentIds);
		if (migratedItemId !== itemId) {
			isChanged = true;
		}
		items.push(migratedItemId);
	}

	return isChanged ? { ...state, items } : state;
}
