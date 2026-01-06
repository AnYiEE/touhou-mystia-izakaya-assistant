import { generateSpriteConfig } from '@/data/utils';
import { CLOTHES_LIST } from './data';

export const CLOTHES_SPRITE_CONFIG = generateSpriteConfig(CLOTHES_LIST.length, {
	height: 26,
	width: 26,
});

export * from './data';
