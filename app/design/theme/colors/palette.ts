import { defaultBackgrounds } from './constants/backgroundColors';
import { black } from './constants/black';
import { blue } from './constants/blue';
import { brown } from './constants/brown';
import { green } from './constants/green';
import { orange } from './constants/orange';
import { pink } from './constants/pink';
import { purple } from './constants/purple';

const constants = {
	BLACK: '#000000',
	BLACK_LIGHT: '#fafafa',
	WHITE: '#ffffff',
} as const;

const divider = {
	dark: 'rgba(250, 250, 250, 0.15)', // constants.BLACK_LIGHT / 15%
	light: 'rgba(13, 13, 13, 0.15)', // colors.black[900] / 15%
} as const;

export const colors = {
	black,
	blue,
	brown,
	green,
	orange,
	pink,
	purple,

	constants,
	defaultBackgrounds,
	divider,
};
