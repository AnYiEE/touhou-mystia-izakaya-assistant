import {Sprite} from '@utils';
import {INGREDIENT_LIST} from './data';

const spriteInstance = new Sprite(INGREDIENT_LIST, {
	target: 'ingredients',
	col: 10,
	row: 7,
	height: 728,
	width: 1040,
});

export * from './data';
export default spriteInstance;
