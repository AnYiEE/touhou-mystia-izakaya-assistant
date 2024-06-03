import type {ISpriteConfig} from '@/utils/sprite/types';

const BEVERAGE_SPRITE_CONFIG = {
	col: 10,
	row: 5,
	height: 420,
	width: 840,
} as const satisfies ISpriteConfig;

export * from './data';
export {BEVERAGE_SPRITE_CONFIG};
