import {Sprite} from '@utils';
import {CUSTOMER_NORMAL_LIST} from './data';

const spriteInstance = new Sprite(CUSTOMER_NORMAL_LIST, {
	target: 'customer_normal',
	col: 10,
	row: 5,
	height: 600,
	width: 890,
});

export * from './data';
export default spriteInstance;
