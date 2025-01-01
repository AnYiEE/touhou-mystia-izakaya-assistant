import {black} from './black';
import {blue} from './blue';
import {brown, brownShifted1, brownShifted2} from './brown';
import {green} from './green';
import {orange} from './orange';
import {pink} from './pink';
import {purple} from './purple';

const constants = {
	BLACK: '#000000',
	WHITE: '#ffffff',
} as const;

const divider = {
	light: 'rgba(15, 15, 15, 0.15)', // colors.black[900] / 15%
} as const;

export const colors = {
	black,
	blue,
	brown,
	brownShifted1,
	brownShifted2,
	green,
	orange,
	pink,
	purple,

	constants,
	divider,
};
