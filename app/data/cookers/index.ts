import { generateSpriteConfig } from '@/data/utils';
import { COOKER_LIST } from './data';

export const COOKER_SPRITE_CONFIG = generateSpriteConfig(COOKER_LIST.length, {
	height: 26,
	width: 26,
});

export * from './data';
