import type { TDayMapLabel, TDayMapPoint } from './types';

export interface IDayMapFacility {
	key: 'collaboration-terminal';
	map: TDayMapLabel;
	position: TDayMapPoint;
}

/**
 * @description Release 4.4.0e: Map_BeastForest/Interactables/Console.
 * ResourceEx's gift mailbox adds an option to this same terminal's menu.
 */
export const DAY_MAP_COLLABORATION_TERMINAL = {
	key: 'collaboration-terminal',
	map: 'BeastForest',
	position: [-7.636, 0.651],
} as const satisfies IDayMapFacility;
