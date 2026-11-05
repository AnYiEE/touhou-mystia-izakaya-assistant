/**
 * Minimum zoom required for each sharper tile level. The increasing gaps make
 * higher-resolution background tiles progressively more expensive to reach.
 */
const DAY_MAP_LEVEL_MIN_ZOOM = [1.2, 0.55, 0.25] as const;
const LEVEL_SWITCH_HYSTERESIS_RATIO = 0.06;

export function getDayMapTileLevelForZoom(
	levelCount: number,
	zoom: number,
	currentLevel?: number
) {
	const lastLevel = Math.max(0, Math.floor(levelCount) - 1);

	if (currentLevel === undefined) {
		for (const [level, minZoom] of DAY_MAP_LEVEL_MIN_ZOOM.entries()) {
			if (level >= lastLevel) {
				break;
			}
			if (zoom >= minZoom) {
				return level;
			}
		}
		return lastLevel;
	}

	let level = Math.min(Math.max(Math.floor(currentLevel), 0), lastLevel);
	while (level > 0) {
		const minZoom = DAY_MAP_LEVEL_MIN_ZOOM[level - 1];
		if (
			minZoom === undefined ||
			zoom < minZoom * (1 + LEVEL_SWITCH_HYSTERESIS_RATIO)
		) {
			break;
		}
		level--;
	}
	while (level < lastLevel) {
		const minZoom = DAY_MAP_LEVEL_MIN_ZOOM[level];
		if (
			minZoom === undefined ||
			zoom > minZoom * (1 - LEVEL_SWITCH_HYSTERESIS_RATIO)
		) {
			break;
		}
		level++;
	}
	return level;
}

export function getDayMapTileLevelMinZoom(level: number) {
	return DAY_MAP_LEVEL_MIN_ZOOM[level];
}
