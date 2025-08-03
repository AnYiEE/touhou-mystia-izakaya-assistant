import { defaultBackgrounds } from './backgroundColors';
import { black } from './black';
import { blue } from './blue';
import { brown } from './brown';
import { green } from './green';
import { orange } from './orange';
import { pink } from './pink';
import { purple } from './purple';

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
