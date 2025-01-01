import type {TColorScale} from '../types';

export const black = {
	50: '#f3f3ec',
	100: '#dcdad6',
	200: '#c4c1bd',
	300: '#aba8a2',
	400: '#948f88',
	500: '#7a766e',
	600: '#605c55',
	700: '#44423c',
	800: '#292723',
	900: '#120c05',
} as const satisfies TColorScale;
