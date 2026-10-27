import { type TDayMapLayer } from './dayMapEntities';

export const MAP_POPOVER_CONTAINER_PADDING = 12;
export const MAP_POPOVER_CONTENT_MAX_WIDTH_CLASS_NAME =
	'max-w-[calc(100vw-1.5rem)]';
export const MAP_POPOVER_CONTENT_WIDTH_CLASS_NAME =
	'w-[min(23rem,calc(100vw-1.5rem))]';
/**
 * 21rem sidebar + 12px inset + 23rem card + 23rem popover + 8px gap +
 * 12px viewport padding = 1104px (69rem).
 */
export const MAP_POPOVER_SIDE_PLACEMENT_MIN_WIDTH = 1104;

/**
 * @description Shared class names for overlays drawn on top of the game art.
 * Overlays use the game's own language: dark translucent pills with white text,
 * and the guide map's highlight orange for hover and selection.
 */
export const MAP_PILL_CLASS_NAME =
	'whitespace-nowrap rounded-full bg-black/70 text-white shadow-md backdrop-blur-sm';

export const MAP_PILL_ACTIVE_CLASS_NAME = 'bg-[#ffa800] text-black';

/** @description For pills inside a `group` button; selected pills keep the active colours. */
export const MAP_PILL_HOVER_CLASS_NAME = 'group-hover:bg-black/85';

export const MAP_GOLD_RING_CLASS_NAME = 'border-[#f3d28b]';

/**
 * @description Popover-like surface for panels over the map. The site popover
 * is more translucent; the game art behind needs a denser backdrop.
 */
export function getMapSurfaceClassName(isHighAppearance: boolean) {
	return isHighAppearance
		? 'bg-content1/80 backdrop-blur-lg dark:bg-content1/80'
		: 'bg-content1';
}

/** @description One colour per layer, used by legend dots, list icons and map chips. */
export const DAY_MAP_LAYER_COLORS = {
	collectable: { dot: 'bg-[#f3d28b]', icon: 'text-[#f3d28b]' },
	facility: { dot: 'bg-teal-400', icon: 'text-teal-300' },
	fishing: { dot: 'bg-sky-400', icon: 'text-sky-300' },
	interaction: { dot: 'bg-orange-300', icon: 'text-orange-300' },
	merchant: { dot: 'bg-success', icon: 'text-success' },
	partner: { dot: 'bg-rose-400', icon: 'text-rose-300' },
	prayer: { dot: 'bg-lime-400', icon: 'text-lime-300' },
	resident: { dot: 'bg-default-400', icon: 'text-default-400' },
	specialGuest: { dot: 'bg-[#ffa800]', icon: 'text-[#ffa800]' },
	task: { dot: 'bg-violet-300', icon: 'text-violet-300' },
	teleport: { dot: 'bg-fuchsia-400', icon: 'text-fuchsia-300' },
	transition: { dot: 'bg-indigo-400', icon: 'text-indigo-300' },
} as const satisfies Record<TDayMapLayer, { dot: string; icon: string }>;
