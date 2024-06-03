import type {ISpriteConfig} from '@/utils/sprite/types';

const RECIPES_SPRITE_CONFIG = {
	col: 10,
	row: 17,
	height: 1768,
	width: 1040,
} as const satisfies ISpriteConfig;

export * from './data';
export {RECIPES_SPRITE_CONFIG};
