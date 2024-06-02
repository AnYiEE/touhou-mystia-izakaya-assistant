import {Sprite} from '@utils';
import {KITCHENWARE_LIST} from './data';

const spriteInstance = new Sprite(KITCHENWARE_LIST, {
	target: 'kitchenwares',
	col: 5,
	row: 1,
	height: 104,
	width: 520,
});

export * from './data';
export default spriteInstance;
