export const MAPS_PAGE_PATH = '/maps';

/** @description Query parameter holding the selected map entity, as in `/maps/BeastForest?select=character:special-1`. */
export const MAP_SELECT_PARAM_NAME = 'select';

export function getCharacterEntityId(characterId: string) {
	return `character:${characterId}`;
}

export function getCollectableEntityId(label: string) {
	return `collectable:${label}`;
}

export function getFishingEntityId(index: number) {
	return `fishing:${index}`;
}

export function getInteractionEntityId(kind: string) {
	return `interaction:${kind}`;
}

export function getPrayerEntityId(label: string) {
	return `prayer:${label}`;
}

export function getTaskEntityId(key: string) {
	return `task:${key}`;
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

export function getFacilityEntityId(key: string) {
	return `facility:${key}`;
}
