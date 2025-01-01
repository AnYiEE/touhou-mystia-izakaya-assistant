import type {TColorScale} from '../types';
import {createShiftedColorScale} from '../utils';

export const brown = {
	50: '#fef7e4',
	100: '#ede0c4',
	200: '#ddc9a1',
	300: '#cfb07d',
	400: '#c19658',
	500: '#a8793f',
	600: '#825c30',
	700: '#5e3f22',
	800: '#392812',
	900: '#180f00',
} as const satisfies TColorScale;

export const brownShifted1 = createShiftedColorScale(brown);
export const brownShifted2 = createShiftedColorScale(brownShifted1);
