import { generateSpriteConfig } from '@/data/utils';
import { ORNAMENT_LIST } from './data';

export const ORNAMENT_SPRITE_CONFIG = generateSpriteConfig(
	ORNAMENT_LIST.length,
	{ height: 26, width: 26 }
);

export * from './data';
