import {Sprite} from '@utils';
import {RECIPES_LIST} from './data';

const spriteInstance = new Sprite(RECIPES_LIST, {
	target: 'recipes',
	col: 10,
	row: 17,
	height: 1768,
	width: 1040,
});

export * from './data';
export default spriteInstance;
