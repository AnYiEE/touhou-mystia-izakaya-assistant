import {Sprite} from '@utils';
import {BEVERAGE_LIST} from './data';

const spriteInstance = new Sprite(BEVERAGE_LIST, {
	target: 'beverages',
	col: 10,
	row: 5,
	height: 420,
	width: 840,
});

export * from './data';
export default spriteInstance;
