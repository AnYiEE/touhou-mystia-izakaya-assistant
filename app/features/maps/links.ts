export const MAPS_PAGE_PATH = '/maps';

/** @description Query parameter holding the selected map entity, as in `/maps/BeastForest?select=character:special-1`. */
export const MAP_SELECT_PARAM_NAME = 'select';

export function getCharacterEntityId(characterId: string) {
	return `character:${characterId}`;
}

export function getCollectableEntityId(label: string) {
	return `collectable:${label}`;
}

const MERCHANT_REFERENCE_PREFIX = 'merchant:';

/**
 * @description Names a merchant by its label instead of its character, so
 * pages without the character data can link to it; the map page resolves it.
 */
export function getMerchantReference(label: string) {
	return `${MERCHANT_REFERENCE_PREFIX}${label}`;
}

export function parseMerchantReference(value: string) {
	return value.startsWith(MERCHANT_REFERENCE_PREFIX)
		? value.slice(MERCHANT_REFERENCE_PREFIX.length)
		: null;
}

/** @description Page URL of a map, optionally with one of its entities selected. */
export function getMapsPageHref(
	map: string | null,
	entityId: string | null = null
) {
	if (map === null) {
		return MAPS_PAGE_PATH;
	}

	const path = `${MAPS_PAGE_PATH}/${map}`;
	return entityId === null
		? path
		: // Entity ids only use characters that are safe in a query; keep the colon readable.
			`${path}?${MAP_SELECT_PARAM_NAME}=${encodeURIComponent(entityId).replaceAll('%3A', ':')}`;
}
